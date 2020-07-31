# Provison ETH2 Validators

Navigate to the subfolder of your preferred language and let's spin up some validators!

## Getting Started

### Generate a Withdrawal Key
An ETH2 withdrawal key is required before you can provision validators. The withdrawal key controls your stake on ETH2, and can be used for any number of validators.

For the purposes of this walkthrough, we'll use the prysmatic labs validator image to generate a withdrawal key. First, you'll need [Docker installed](https://docs.docker.com/get-docker/), then head over to the command line, and run the following command:

```
docker run -it -v "$PWD:/data" --network="host" gcr.io/prysmaticlabs/prysm/validator:latest accounts create --keystore-path=/data --password=example
```

The above command will generate an ETH2 account and store it in your local filesystem. The withdrawal key information will be in a generated file titled ``shardwithdrawalkey{xyz...}``. Go ahead and drop it in the ``keys`` subfolder, open it, and copy the ``"publickey"`` value into your .env file.

### Georli ETH
Goerli ETH is used to stake on the ETH2 testnet, so a Goerli account is required for testing.

To generate a Goerli account, run the following command:

python | javascript
------------ | -------------
coming soon | npm run goerliAccount

This will print the associated address and private key; add these to your .env file. Each validator requires 32 Goerli ETH. For >32 Goerli ETH, please email sam@staked.us. 

## Provision Validators

With the ETH2 withdrawal key generated, and an account that holds > 32 Goerli ETH, it's time to provision ETH2 testnet validators! 

A POST request to [``/provisioning_requests/eth2``](https://staked.gitbook.io/staked/staking-api/node-provisioning-api#post-provisioning-request) will provision as many validators as we specify. The .env file is used to configure the validator count for our example scripts, and is set to 2 by default.

<table>
<tr>
<td>
  python
</td>
<td>
  javascript
</td>
</tr>
<tr>
<td>
  <pre lang="python">
  # post_provisioning_request(validator_count) ...
  endpoint = "/provisioning_requests/eth2"
  params = {"api_key": os.environ["STAKED_API_KEY"]}
  data = {
      "attributes": {
          "withdrawalKey": os.environ["WITHDRAWAL_PUBLIC_KEY"],
          "validators": [{"cloud": "amazon", "count": validator_count}],
      }
  }
  # ...
  </pre>
</td>
<td>
  <pre lang="javascript">
  // postProvisioningRequest(validatorCount) ...
  const endpoint = "/provisioning_requests/eth2";
  const data = {
    "attributes": {
      "withdrawalKey": ETH2_PUBLIC_KEY,
      "validators": [
        {
          "cloud": "amazon",
          "count": validatorCount
        }
      ]
    }
  }
  // ...
  </pre>
</td>
</tr>
<tr>
<td>
  source code
</td>
<td>
  source code
</td>
</tr>
</table>

The response will include a staking transaction to sign for each provisioned validator. Rather than submit these transactions individually, they can be submited in one transaction with the [Staked Batching Contract](https://staked.gitbook.io/staked/staking-api/node-provisioning-api#submit-transactions-to-the-batching-contract).

Each staking transaction from the previous response is decoded to create an array of input values to the batching contract. 

<table>
<tr>
<td>
  python
</td>
<td>
  javascript
</td>
</tr>
<tr>
<td>
  <pre lang="python">
  # post_provisioning_request(validator_count) ...
  endpoint = "/provisioning_requests/eth2"
  params = {"api_key": os.environ["STAKED_API_KEY"]}
  data = {
      "attributes": {
          "withdrawalKey": os.environ["WITHDRAWAL_PUBLIC_KEY"],
          "validators": [{"cloud": "amazon", "count": validator_count}],
      }
  }
  # ...
  </pre>
</td>
<td>
  <pre lang="javascript">
  // postProvisioningRequest(validatorCount) ...
  const endpoint = "/provisioning_requests/eth2";
  const data = {
    "attributes": {
      "withdrawalKey": ETH2_PUBLIC_KEY,
      "validators": [
        {
          "cloud": "amazon",
          "count": validatorCount
        }
      ]
    }
  }
  // ...
  </pre>
</td>
</tr>
<tr>
<td>
  source code
</td>
<td>
  source code
</td>
</tr>
</table>






