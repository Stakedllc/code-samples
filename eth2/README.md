# ETH2 API

Clone ``code-samples`` and navigate to ``eth2`` to follow along.

## Getting Started

### Generate a Withdrawal Key
An ETH2 withdrawal key is required before you can provision validators. The withdrawal key controls your stake on ETH2. A single withdrawal key can be used for any number of validators.

For the purposes of this walkthrough, we'll use the prysmatic labs validator image to generate a withdrawal key. First, you'll need [Docker](https://docs.docker.com/get-docker/) installed, then head over to the command line, and run the following command in the ``eth2`` directory:

```
docker run -it -v "$PWD:/data" --network="host" gcr.io/prysmaticlabs/prysm/validator:latest accounts create --keystore-path=/data --password=example
```

The above command will generate an ETH2 account and store it in your local filesystem. The withdrawal key information will be stored in a generated file titled ``shardwithdrawalkey{xyz...}``. Go ahead and drop it in the ``keys`` subfolder, we'll use this file later.

### Georli ETH
Goerli ETH is needed for testnet staking. To procure Goerli ETH, please email sam@staked.us.

## Post Provisioning Request


