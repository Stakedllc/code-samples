# ETH2

Provision ETH2 validators on Staked's secure cloud infrastructure.

## Getting Started

First thing's first: clone `code-samples`, open the command line, and navigate to the ETH2 folder.

### API Key
An API key with ETH2 permissions is required to provision validators - please email sam@staked.us for an API key with access.

### Generate a Withdrawal Key
An ETH2 withdrawal key is required to control stake on ETH2, and can be used for many validators.

Follow our [guide](https://staked.us/faq/eth2/#withdrawal-address) to generate a withdrawal key which be can used in testing.

### Goerli ETH
Goerli ETH is the staking asset on ETH2 testnets, which means a Goerli account is required for testing. We've added a Goerli provider URL to the .env file - if the provider requests max out, please contact us or replace with your own. 

To generate a Goerli account, run the following commands:

```
$ docker image build -t staked-eth2 .
$ docker run --env-file .env staked-eth2 account
```

This will print the associated address and private key - make sure these stay accessible. Next, the address needs to be funded.

The ETH Staker discord ([link](https://discord.gg/eAuDepM)) is a fantastic testing resource. Select the #request-goerli-eth faucet channel and enter the following message into the chat:

```
!goerliEth {YOUR GOERLI ADDRESS}
```

The faucet will send enough Goerli ETH for a validator (32 Goerli ETH) plus gas costs.

## .env
Fill in the seeded [.env](https://github.com/Stakedllc/code-samples/blob/master/eth2/.env) file with your details from above.

```
// .env
STAKED_API_KEY={YOUR STAKED API KEY}

VALIDATOR_COUNT={Seed value set to 5}
WITHDRAWAL_PUBLIC_KEY={YOUR WITHDRAWAL PUBLIC KEY}

GOERLI_RPC_URL={URL provided, or use your own}
GOERLI_ADDRESS={YOUR GOERLI ADDRESS}
GOERLI_PRIVATE_KEY={YOUR GOERLI PRIVATE KEY}

GAS_PRICE_SCALAR=2
```

## Provision Validators

A POST request to [``/provisioning_requests/eth2``](https://staked.gitbook.io/staked/staking-api/node-provisioning-api#post-provisioning-request) will provision ETH2 validators. The .env file is used to configure the validator count for our example scripts, and is set to 1 by default.

To provision validators on the Medalla testnet, run the following commands:

```
$ docker image build -t staked-eth2 .
$ docker run --env-file .env staked-eth2 provision
```

Below is the javascript magic running in the Docker container:

<table>
<tr>
<td>
  <pre lang="javascript">
// Step 1: Post Provisioning Request
async function postProvisioningRequest(num_validators) {
    try {
        let response = await axios({
            method: 'post',
            url: "https://testnet.staked.cloud/api/provisioning_requests/eth2",
            params: {
                api_key: STAKED_API_KEY
            },
            data: {
                attributes: {
                    "withdrawalKey": WITHDRAWAL_PUBLIC_KEY,
                    "validators": [
                        {
                            "provider": "decentralized",
                            "count": num_validators
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
  <a href="https://github.com/Stakedllc/code-samples/blob/master/eth2/provision.js#L20">source code</a>
</td>
</tr>
</table>

The response will include a deposit transaction to sign for each provisioned validator. Rather than submit these transactions individually, they can be submited in one transaction with the [Staked Batching Contract](https://staked.gitbook.io/staked/staking-api/node-provisioning-api#submit-transactions-to-the-batching-contract).

Each deposit transaction is decoded to create an array of input values to the batching contract. 

<table>
<tr>
<td>
  <pre lang="javascript">
// Step 2: Batch Staking Transactions
async function submitBatchTransactions(web3, validators) {
    /*
        Each validator object contains encoded transaction data 
        to sign and send to the canonical ETH2 deposit contract.
        To use the batching contract, this data must be decoded
        and constructed in a batch.
    */
    var pubkeys = [];
    var withdrawal_credentials = [];
    var signatures = [];
    var deposit_data_roots = [];
    for (let i = 0; i < validators.length; i++) {
        let decoded = decodeDepositInput(web3, validators[i].depositInput);
        pubkeys.push(decoded.pubkey);
        withdrawal_credentials.push(decoded.withdrawal_credentials);
        signatures.push(decoded.signature);
        deposit_data_roots.push(decoded.deposit_data_root);
    }
    /*
        After decoding the information for each validator, the 
        transaction to the batching contract must be constructed
        and sent.
    */
    const batching_abi = require("./BatchDeposit.json");
    const batching_address = "0x730Ce54f821499ef3656d8E3Ff4763567FF1402F";
    const batching_contract = new web3.eth.Contract(batching_abi, batching_address);
    try {
        const ether = n => new web3.utils.BN(web3.utils.toWei(n, "ether"));
        const gas_price = await web3.eth.getGasPrice();
        const tx = await batching_contract.methods.batchDeposit(
            pubkeys,
            withdrawal_credentials,
            signatures,
            deposit_data_roots
        ).send({
            from: web3.eth.accounts.wallet[0].address,
            value: ether(web3.utils.toBN(32 * validators.length)),
            gasPrice: gas_price * GAS_PRICE_SCALAR,
            gas: 21000 + (64000 * validators.length)
        });
        return tx;
    } catch (error) {
        throw error;
    }
}
  </pre>
</td>
</tr>
<tr>
<td>
  <a href="https://github.com/Stakedllc/code-samples/blob/master/eth2/provision.js#L46">source code</a>
</td>
</tr>
</table>

## Validator Statuses

Validators go through a number of states on the ETH2 chain after initial deposit.

| Status        | Definition  | Time Period  |
| ------------- |-------------| -----|
| CREATED      | Validator was provisioned through Staked API | n / a |
| DEPOSITED     | Deposit is waiting to be seen by ETH2 chain | 0-6 Hours |
| PENDING      | Validator is in the ETH2 queue waiting to go live | 0-6 Days |
| ACTIVE | Validator is participating and earning rewards      | n / a |

A GET request to the [``/delegations/eth2``](https://staked.gitbook.io/staked/staking-api/node-provisioning-api#get-validator-statuses) endpoint will detail the status and metadata of provisioned validators.

To get the validator statuses, run the following command:

```
$ docker image build -t staked-eth2 .
$ docker run --env-file .env staked-eth2 status
```

<table>
<tr>
<td>
  <pre lang="javascript">
async function getDelegations() {
    try {
        let response = await axios({
            method: 'get',
            url: "https://testnet.staked.cloud/api/delegations/eth2",
            params: {
                api_key: STAKED_API_KEY
            }
        });
        return response.data.results;
    } catch (error) {
        throw error;
    }
}
  </pre>
</td>
</tr>
<tr>
<td>
  <a href="https://github.com/Stakedllc/code-samples/blob/master/eth2/status.js#L7">source code</a>
</td>
</tr>
</table>
