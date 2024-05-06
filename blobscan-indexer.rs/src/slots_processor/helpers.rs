use std::{collections::HashMap, str::FromStr};

use ethers::types::{Block as EthersBlock, Transaction as EthersTransaction, H160, H256};

use crate::{
    clients::beacon::types::Blob as BeaconBlob,
    utils::web3::{calculate_versioned_hash, get_tx_versioned_hashes},
};

pub fn create_tx_hash_versioned_hashes_mapping(
    block: &EthersBlock<EthersTransaction>,
) -> Result<HashMap<H256, Vec<H256>>, anyhow::Error> {
    let mut tx_to_versioned_hashes = HashMap::new();

    for tx in &block.transactions {
        match get_tx_versioned_hashes(tx)? {
            Some(versioned_hashes) => {
                tx_to_versioned_hashes.insert(tx.hash, versioned_hashes);
            }
            None => {
                continue;
            }
        };
    }
    Ok(tx_to_versioned_hashes)
}

pub fn create_tx_hash_mapping(
    block: &EthersBlock<EthersTransaction>,
) -> Result<Vec<H256>, anyhow::Error> {
    let mut hashes: Vec<H256> = Vec::new();
    for tx in &block.transactions {
        if let Some(to_address) = tx.to {
            let expected_address =
                H160::from_str("804c520d3c084c805e37a35e90057ac32831f96f").unwrap();
            if to_address == expected_address {
                println!("tx.to: {:?}", tx.to);
                hashes.push(tx.hash);
            }
        }
    }
    Ok(hashes)
}

pub fn create_versioned_hash_blob_mapping(
    blobs: &Vec<BeaconBlob>,
) -> Result<HashMap<H256, &BeaconBlob>, anyhow::Error> {
    let mut version_hash_to_blob = HashMap::new();

    for blob in blobs {
        let versioned_hash = calculate_versioned_hash(&blob.kzg_commitment)?;

        version_hash_to_blob.entry(versioned_hash).or_insert(blob);
    }

    Ok(version_hash_to_blob)
}
