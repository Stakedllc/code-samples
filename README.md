# code-samples
Code samples for integration partners.

# [ETH2](https://github.com/Stakedllc/code-samples/tree/master/eth2)

Provision ETH2 validators on Staked's secure cloud infrastructure.

## Getting Started

First thing's first: clone `code-samples`, open the command line, and navigate to the ETH2 folder.

### API Key
An API key with ETH2 permissions is required to provision validators - please email sam@staked.us for an API key with access.

### Generate a Withdrawal Key
An ETH2 withdrawal key is required to control stake on ETH2, and can be used for many validators.

For the purposes of this walkthrough, we'll use the prysmatic labs validator image to generate a withdrawal key. [Docker](https://docs.docker.com/get-docker/) needs to be installed, then run the following command:

```
$ docker run -it -v "$PWD:/keys" --network="host" gcr.io/prysmaticlabs/prysm/validator:latest accounts create --keystore-path=/keys --password=example
```

The above command will generate an ETH2 account and store it in your local filesystem. The withdrawal key will be in a file titled ``shardwithdrawalkey{xyz...}``. Go ahead and drop it in the ``keys`` subfolder, and delete the ``validatorprivatekey{xyz...}`` file that was generated along with it.

### Goerli ETH
Goerli ETH is the staking asset on [Medalla](https://github.com/goerli/medalla/blob/master/medalla/README.md), which means a Goerli account is required for testing. We've added a Goerli provider URL to the .env file - if the provider requests max out, please contact us or replace with your own. 

To generate a Goerli account, run the following commands (sometimes ``sudo`` is required):

```
$ docker image build -t staked-eth2 .
$ docker run --env-file .env staked-eth2 account
```

This will print the associated address and private key - make sure these stay accessible. Next, the address needs to be funded.

The ETH Staker discord ([link](https://discord.gg/eAuDepM)) is a fantastic Medalla testing resource. Select the #request-goerli-eth faucet channel and enter the following message into the chat:

```
!goerliEth {YOUR GOERLI ADDRESS} 5
```

The faucet will send enough Goerli ETH for 5 validators (5 * 32 Goerli ETH) plus gas costs.

## .env
Fill in the seeded [.env](https://github.com/Stakedllc/code-samples/blob/master/eth2/.env) file with your details from above.

```
// .env
STAKED_API_KEY={YOUR STAKED API KEY}

WITHDRAWAL_PUBLIC_KEY={YOUR WITHDRAWAL PUBLIC KEY}

GOERLI_ADDRESS={YOUR GOERLI ADDRESS}
GOERLI_PRIVATE_KEY={YOUR GOERLI PRIVATE KEY}
```

## Provision Validators

A POST request to [``/provisioning_requests/eth2``](https://staked.gitbook.io/staked/staking-api/node-provisioning-api#post-provisioning-request) will provision Medalla validators. The .env file is used to configure the validator count for our example scripts, and is set to 5 by default.

To provision validators, run the following commands (sometimes ``sudo`` is required):

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
  <a href="https://github.com/Stakedllc/code-samples/blob/master/eth2/provision.js#L17">source code</a>
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
    const batching_address = "0xD3e5AA84e0E6f4247B3609F88ff157c258E1fE89";
    const batching_contract = new web3.eth.Contract(batching_abi, batching_address);
    try {
        const ether = n => new web3.utils.BN(web3.utils.toWei(n, "ether"));
        const gas_price = await web3.eth.getGasPrice();
        const gas_price_scalar = 2;
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
  <a href="https://github.com/Stakedllc/code-samples/blob/master/eth2/provision.js#L44">source code</a>
</td>
</tr>
</table>
