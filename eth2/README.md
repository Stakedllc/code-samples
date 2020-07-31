# ETH2 API - Programmatically Provison Validators

Navigate to the subfolder of your preferred language and let's spin up some validators!

## Getting Started

### Generate a Withdrawal Key
An ETH2 withdrawal key is required before you can provision validators. The withdrawal key controls your stake on ETH2, and can be used for any number of validators.

Your key management solution can be used here, but for the purposes of this walkthrough, we'll use the prysmatic labs validator image to generate a withdrawal key. First, you'll need [Docker install](https://docs.docker.com/get-docker/)ed, then head over to the command line, and run the following command:

```
docker run -it -v "$PWD:/data" --network="host" gcr.io/prysmaticlabs/prysm/validator:latest accounts create --keystore-path=/data --password=example
```

The above command will generate an ETH2 account and store it in your local filesystem. The withdrawal key information will be in a generated file titled ``shardwithdrawalkey{xyz...}``. Go ahead and drop it in the ``keys`` subfolder, open it, and copy the ``"publickey"`` value into your .env file.

### Georli ETH
Goerli ETH is needed for testnet staking. To control the Goerli ETH, you'll need an ETH key pair.

To generate a Goerli ETH account, run the following command:

python | javascript
------------ | -------------
Content from cell 1 | npm run goerliAccount
source code | source code

This will print the associated address and private key; add these to your .env file. 

Each validator requires 32 Goerli ETH. For >32 Goerli ETH, please email sam@staked.us. 

## Post Provisioning Request


