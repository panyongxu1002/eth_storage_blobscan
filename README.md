# Overview

## What is EthStorage

EthStorage is a modular and decentralized storage Layer 2 that offers programmable key-value storage powered by DA. It enables long-term DA solutions for Rollups and opens up new possibilities for fully on-chain applications like games, social networks, AI, etc.

## Motivation

The main motivation behind EthStorage is to provide a long-term DA based on Ethereum.

EIP-4844 introduces data blobs that enhance the throughput and efficiency of L2 scaling solutions like rollups. However, the blob data is only available temporarily, meaning it will be discarded in a few weeks. This has generated a significant impact: the inability of L2 to unconditionally derive the latest state from L1. If a certain piece of data can no longer be retrieved from L1, a rollup may not be possible to sync the chain.

With EthStorage as a long-term DA solution, L2s can derive from their DA layer (Ethereum DA, Celestia, EigenDA, etc. + EthStorage) any time they want.

EthStorage also opens up new possibilities for fully on-chain applications like games, social networks, AI, etc.

<figure><img src=".gitbook/assets/es.jpg" alt=""><figcaption></figcaption></figure>

# Installation
Install all the Node.js dependencies:
```
pnpm fetch -r
pnpm install -r
```
Run the local Postgres and Redis containers:
```
docker compose -f docker-compose.local.yml up -d postgres redis

````
### Run
```
pnpm dev
```
Lastly, create the database schema:
```
pnpm db:generate
```

# Deploy
- build
```
  sudo pnpm build
```

- run pm2
```
  pm2 start pm2.config.js
```
- check pm2 progress
```
  pm2 ls
```

- If the code has been updated, rerun `sudo pnpm build` and then restart the PM2 process. Currently, there are some minor issues with directly restarting, so you need to stop the process (either `3000 or 3001`) first and then restart it.

```
  pm2 reload blobscan-api
  // or 
  pm2 reload blobscan-web
```

