# Provison ETH2 Validators

## Getting Started

### Generate a Withdrawal Key
An ETH2 withdrawal key is required before any provisioning can happen. The withdrawal key controls stake on ETH2, and can be used for many validators.

For the purposes of this walkthrough, we'll use the prysmatic labs validator image to generate a withdrawal key. First, you'll need [Docker](https://docs.docker.com/get-docker/) installed, then head over to the command line, and run the following command:

```
$ docker run -it -v "$PWD:/data" --network="host" gcr.io/prysmaticlabs/prysm/validator:latest accounts create --keystore-path=/data --password=example
```

The above command will generate an ETH2 account and store it in your local filesystem. The withdrawal key information will be in a file titled ``shardwithdrawalkey{xyz...}``. Go ahead and drop it in the ``keys`` subfolder, open it, and copy the ``"publickey"`` value into your .env file.

### Goerli ETH
Goerli ETH is used to stake on the ETH2 testnet, which means a Goerli account is required for testing.

To generate a Goerli account, run the following commands:

```
$ docker image build -t staked-eth2 .
$ docker run --env-file .env staked-eth2 goerliAccount
```

This will print the associated address and private key; add and save these to your .env file. For Goerli ETH to be sent to your account, please email sam@staked.us. 

## Provision Validators

With the ETH2 withdrawal key generated, and an account that holds > 32 Goerli ETH, it's time to provision ETH2 testnet validators! 

A POST request to [``/provisioning_requests/eth2``](https://staked.gitbook.io/staked/staking-api/node-provisioning-api#post-provisioning-request) will provision as many validators as we specify. The .env file is used to configure the validator count for our example scripts, and is set to 2 by default.

<table>
<tr>
<td>
  <b>python</b>
</td>
</tr>
<tr>
<td>
  <pre lang="python">
  def post_provisioning_request(validator_count):  # Step 1: Post Provisioning Request
    endpoint = "/provisioning_requests/eth2"
    params = {"api_key": os.environ["STAKED_API_KEY"]}
    data = {
        "attributes": {
            "withdrawalKey": os.environ["WITHDRAWAL_PUBLIC_KEY"],
            "validators": [{"cloud": "amazon", "count": validator_count}],
        }
    }
    return requests.post(eth2_url + endpoint, params=params, json=data)
  </pre>
</td>
</tr>
<tr>
<td>
  <a href="https://github.com/Stakedllc/code-samples/blob/develop/eth2/python/provision.py#L12">source code</a>
</td>
</tr>
</table>

The response will include a staking transaction to sign for each provisioned validator. Rather than submit these transactions individually, they can be submited in one transaction with the [Staked Batching Contract](https://staked.gitbook.io/staked/staking-api/node-provisioning-api#submit-transactions-to-the-batching-contract).

Each staking transaction is decoded to create an array of input values to the batching contract. 

<table>
<tr>
<td>
  <b>python</b>
</td>
</tr>
<tr>
<td>
  <pre lang="python">
  def post_provisioning_request(validator_count):  # Step 1: Post Provisioning Request
    endpoint = "/provisioning_requests/eth2"
    params = {"api_key": os.environ["STAKED_API_KEY"]}
    data = {
        "attributes": {
            "withdrawalKey": os.environ["WITHDRAWAL_PUBLIC_KEY"],
            "validators": [{"cloud": "amazon", "count": validator_count}],
        }
    }
    return requests.post(eth2_url + endpoint, params=params, json=data)
  </pre>
</td>
</tr>
<tr>
<td>
  <a href="https://github.com/Stakedllc/code-samples/blob/develop/eth2/python/provision.py#L12">source code</a>
</td>
</tr>
</table>

To provision validators, run the following commands:

```
$ docker image build -t staked-eth2 .
$ docker run --env-file .env staked-eth2 provision
```


