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
$ docker run --env-file .env staked-eth2 account
```

This will print the associated address and private key; add and save these to your .env file. Next, the address needs to be funded.

The ETH Staker discord ([link](https://discord.gg/eAuDepM)) is a fantastic resource for testing on Medalla. Select the #request-goerli-eth faucet channel and enter the following message into the chat:

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
  <pre lang="javascript">
// Step 1: Post Provisioning Request
async function postProvisioningRequest() {
    try {
        let response = await axios({
            method: 'post',
            url: "https://eth2.staging.staked.cloud/api/provisioning_requests/eth2",
            params: {
                api_key: STAKED_API_KEY
            },
            data: {
                attributes: {
                    "withdrawalKey": WITHDRAWAL_PUBLIC_KEY,
                    "validators": [
                        {
                            "provider": "decentralized",
                            "count": Number(VALIDATOR_COUNT)
                        }
                    ]
                }
            }
        });
        return response.data.attributes.validators;
    } catch (error) {
        throw error;
    }
}
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
  <pre lang="javascript">
// Step 2: Batch Staking Transactions
async function submitBatchTransactions(validators) {
    var pubkeys = [];
    var withdrawal_credentials = [];
    var signatures = [];
    var deposit_data_roots = [];
    for (let i = 0; i < validators.length; i++) {
        let decoded = decodeDepositInput(validators[i].depositInput);
        pubkeys.push(decoded.pubkey);
        withdrawal_credentials.push(decoded.withdrawal_credentials);
        signatures.push(decoded.signature);
        deposit_data_roots.push(decoded.deposit_data_root);
    }
    const batching_abi = require("./BatchDeposit.json");
    const batching_address = "0xD3e5AA84e0E6f4247B3609F88ff157c258E1fE89"
    const batching_contract = new web3.eth.Contract(batching_abi, batching_address);
    try {
        const ether = n => new web3.utils.BN(web3.utils.toWei(n, "ether"));
        const gas_price = await web3.eth.getGasPrice();
        const gas_price_scalar = 2
        const tx = await batching_contract.methods.batchDeposit(
            pubkeys,
            withdrawal_credentials,
            signatures,
            deposit_data_roots)
            .send({
                from: web3.eth.accounts.wallet[0].address,
                value: ether(web3.utils.toBN(32 * validators.length)),
                gasPrice: gas_price * gas_price_scalar,
                gas: 7999999
            });
        return tx;
    } catch (error) {
        console.log(error);
    }
}
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


