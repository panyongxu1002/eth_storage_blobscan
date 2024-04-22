use anyhow::{anyhow, Context as AnyhowContext, Result};

use ethers::prelude::*;
use tracing::{debug, info};

use crate::{
    clients::{
        beacon::types::{BlockHeader, BlockId},
        blobscan::types::{Blob, Block, Transaction},
    },
    context::Context,
};

use self::error::{SlotProcessingError, SlotsProcessorError};
use self::helpers::{create_tx_hash_versioned_hashes_mapping, create_versioned_hash_blob_mapping};

pub mod error;
mod helpers;

pub struct SlotsProcessor {
    context: Context,
}

#[derive(Debug, Clone)]
pub struct BlockData {
    pub root: H256,
    pub slot: u32,
}

impl From<BlockHeader> for BlockData {
    fn from(block_header: BlockHeader) -> Self {
        Self {
            root: block_header.root,
            slot: block_header.header.message.slot,
        }
    }
}

impl SlotsProcessor {
    pub fn new(context: Context) -> SlotsProcessor {
        Self { context }
    }

    pub async fn process_slots(
        &mut self,
        initial_slot: u32,
        final_slot: u32,
    ) -> Result<(), SlotsProcessorError> {
        let is_reverse_processing = initial_slot > final_slot;

        if is_reverse_processing {
            for current_slot in (final_slot..=initial_slot).rev() {
                let result = self.process_slot(current_slot).await;
                // println!("result1: {:?}", result);
                if let Err(error) = result {
                    return Err(SlotsProcessorError::FailedSlotsProcessing {
                        initial_slot,
                        final_slot,
                        failed_slot: current_slot,
                        error,
                    });
                }
            }
        } else {
            for current_slot in initial_slot..=final_slot {
                let result = self.process_slot(current_slot).await;
                // println!("result2: {:?}", result);

                if let Err(error) = result {
                    return Err(SlotsProcessorError::FailedSlotsProcessing {
                        initial_slot,
                        final_slot,
                        failed_slot: current_slot,
                        error,
                    });
                }
            }
        }

        Ok(())
    }

    pub async fn process_slot(&mut self, slot: u32) -> Result<(), SlotProcessingError> {
        let beacon_client = self.context.beacon_client();
        let blobscan_client = self.context.blobscan_client();
        let provider = self.context.provider();
        
        let beacon_block = match beacon_client.get_block(&BlockId::Slot(slot)).await? {
            Some(block) => block,
            None => {
                debug!(
                    target = "slots_processor",
                    slot = slot,
                    "Skipping as there is no beacon block"
                );

                return Ok(());
            }
        };

        // println!("beacon_block: {:?}", beacon_block);

        let execution_payload = match beacon_block.message.body.execution_payload {
            Some(payload) => payload,
            None => {
                debug!(
                    target = "slots_processor",
                    slot, "Skipping as beacon block doesn't contain execution payload"
                );

                return Ok(());
            }
        };

        println!("execution_payload: {:?}", execution_payload);

        let has_kzg_blob_commitments = match beacon_block.message.body.blob_kzg_commitments {
            Some(commitments) => !commitments.is_empty(),
            None => false,
        };
        // println!("has_kzg_blob_commitments: {:?}", has_kzg_blob_commitments);

        if !has_kzg_blob_commitments {
            debug!(
                target = "slots_processor",
                slot, "Skipping as beacon block doesn't contain blob kzg commitments"
            );

            return Ok(());
        }

        let execution_block_hash = execution_payload.block_hash;

        // Fetch execution block and perform some checks

        let execution_block = provider
            .get_block_with_txs(execution_block_hash)
            .await?
            .with_context(|| format!("Execution block {execution_block_hash} not found"))?;

            // println!("execution_block: {:?}", execution_block);

        let tx_hash_to_versioned_hashes =
            create_tx_hash_versioned_hashes_mapping(&execution_block)?;

        if tx_hash_to_versioned_hashes.is_empty() {
            return Err(anyhow!("Blocks mismatch: Beacon block contains blob KZG commitments, but the corresponding execution block does not contain any blob transactions").into());
        }

        println!("tx_hash_to_versioned_hashes: {:?}", tx_hash_to_versioned_hashes);
        // Fetch blobs and perform some checks

        let blobs = match beacon_client
            .get_blobs(&BlockId::Slot(slot))
            .await
            .map_err(SlotProcessingError::ClientError)?
        {
            Some(blobs) => {
                if blobs.is_empty() {
                    debug!(
                        target = "slots_processor",
                        slot, "Skipping as blobs sidecar is empty"
                    );

                    return Ok(());
                } else {
                    blobs
                }
            }
            None => {
                debug!(
                    target = "slots_processor",
                    slot, "Skipping as there is no blobs sidecar"
                );

                return Ok(());
            }
        };

        println!("blobs: {:?}", blobs);
        // Create entities to be indexed

        let block_entity = Block::try_from((&execution_block, slot))?;

        println!("block_entity: {:?}", block_entity);

        let transactions_entities = execution_block
            .transactions
            .iter()
            .filter(|tx| tx_hash_to_versioned_hashes.contains_key(&tx.hash))
            .map(|tx| Transaction::try_from((tx, &execution_block)))
            .collect::<Result<Vec<Transaction>>>()?;



        let versioned_hash_to_blob = create_versioned_hash_blob_mapping(&blobs)?;

        // println!("versioned_hash_to_blob: {:?}", versioned_hash_to_blob);
        let mut blob_entities: Vec<Blob> = vec![];

        for (tx_hash, versioned_hashes) in tx_hash_to_versioned_hashes.iter() {
            for (i, versioned_hash) in versioned_hashes.iter().enumerate() {
                let blob = *versioned_hash_to_blob.get(versioned_hash).with_context(|| format!("Sidecar not found for blob {i} with versioned hash {versioned_hash} from tx {tx_hash}"))?;

                blob_entities.push(Blob::from((blob, versioned_hash, i, tx_hash)));
            }
        }

        /*
        let tx_hashes = transactions_entities
            .iter()
            .map(|tx| tx.hash.to_string())
            .collect::<Vec<String>>();
        let blob_versioned_hashes = blob_entities
            .iter()
            .map(|blob| blob.versioned_hash.to_string())
            .collect::<Vec<String>>();
         */

        //  println!("aaa");

        blobscan_client
            .index(block_entity, transactions_entities, blob_entities)
            .await
            .map_err(SlotProcessingError::ClientError)?;

        info!(
            target = "slots_processor",
            slot, "Block indexed successfully"
        );

        Ok(())
    }
}
