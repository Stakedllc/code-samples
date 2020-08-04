# Provision ETH2 Validators

Programmatically provision ETH2 validators on the multi-client testnet [Medalla](https://github.com/goerli/medalla/blob/master/medalla/README.md)

## Getting Started

### Generate a Withdrawal Key
An ETH2 withdrawal key is required to provision validators. The withdrawal key controls stake on ETH2, and can be used for many validators.

For the purposes of this walkthrough, we'll use the prysmatic labs validator image to generate a withdrawal key. First, you'll need [Docker](https://docs.docker.com/get-docker/) installed, then head over to the command line, and run the following command:

```
$ docker run -it -v "$PWD:/data" --network="host" gcr.io/prysmaticlabs/prysm/validator:latest accounts create --keystore-path=/data --password=example
```

The above command will generate an ETH2 account and store it in your local filesystem. The withdrawal key information will be in a file titled ``shardwithdrawalkey{xyz...}``. Go ahead and drop it in the ``keys`` subfolder, open it, and copy the ``"publickey"`` value into your .env file.

### Goerli ETH
Goerli ETH is the staking asset on Medalla, which means a Goerli account is required for testing.

To generate a Goerli account, run the following commands:

```
$ docker image build -t staked-eth2 .
$ docker run --env-file .env staked-eth2 goerliAccount
```

This will print the associated address and private key; add and save these to your .env file. Next, the address needs to be funded.

The ETH Staker discord ([invite](https://discord.gg/eAuDepM)) is a fantastic resource for testing on Medalla. Select the #request-goerli-eth faucet channel and enter the following message into the chat:

```
!goerliEth {YOUR GOERLI ADDRESS} 5
```

The faucet will send the Goerli ETH required for 5 validators plus gas costs. For additional Goerli ETH, or support, please email sam@staked.us.

## Provision Validators

With the withdrawal key generated, and an account that holds > 32 Goerli ETH, it's time to provision ETH2 testnet validators! 

A POST request to [``/provisioning_requests/eth2``](https://staked.gitbook.io/staked/staking-api/node-provisioning-api#post-provisioning-request) will provision Medalla validators. The .env file is used to configure the validator count for our example scripts, and is set to 2 by default.

<table>
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
  <pre lang="python">
  def batch_transactions(validators):  # Step 2: Batch Staking Transactions
    pubkeys = []
    withdrawal_credentials = []
    signatures = []
    deposit_data_roots = []
    def decode(validator_tx):
        return web3.eth.abi.decodeParameters(
            [
                {"type": "bytes", "name": "pubkey"},
                {"type": "bytes", "name": "withdrawal_credentials"},
                {"type": "bytes", "name": "signature"},
                {"type": "bytes32", "name": "deposit_data_root"},
            ],
            "0x" + validator_tx.substring(8),
        )
    for i in range(validators.length):
        decoded = decode(validators[i].depositInput)
        pubkeys.append(decoded.pubkey)
        withdrawal_credentials.append(decoded.withdrawal_credentials)
        signatures.append(decoded.signature)
        deposit_data_roots.append(decoded.deposit_data_root)
    with open("./build/contracts/BatchDeposit_Goerli.json") as abi:
        batching_abi = json.load(abi)
        batching_contract = web3.eth.contract(address="0xD3e5AA84e0E6f4247B3609F88ff157c258E1fE89", abi=batching_abi)
        tx_hash = batching_contract.functions.batchDeposit(
            pubkeys, withdrawal_credentials, signatures, deposit_data_roots
        ).transact({"value": validators.length * 32 * 10 ** 18})
  </pre>
</td>
</tr>
<tr>
<td>
  <a href="https://github.com/Stakedllc/code-samples/blob/develop/eth2/python/provision.py#L12">source code</a>
</td>
</tr>
</table>

To provision validators, using the process detailed above, run the following commands (make sure the .env file has all fields filled in):

```
$ docker image build -t staked-eth2 .
$ docker run --env-file .env staked-eth2 provision
```


