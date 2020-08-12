const axios = require("axios");
const Web3 = require("web3");

const {
    STAKED_API_KEY,
    VALIDATOR_COUNT,
    WITHDRAWAL_PUBLIC_KEY,
    GOERLI_RPC_URL,
    GOERLI_PRIVATE_KEY,
} = process.env;

// Set-Up Web3
const web3 = new Web3(GOERLI_RPC_URL);
const account = web3.eth.accounts.privateKeyToAccount(GOERLI_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

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

module.exports.postProvisioningRequest = postProvisioningRequest;

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
        throw error;
    }
}

function decodeDepositInput(validator_tx) {
    return web3.eth.abi.decodeParameters([
        {
            "type": "bytes",
            "name": "pubkey"
        }, {
            "type": "bytes",
            "name": "withdrawal_credentials"
        }, {
            "type": "bytes",
            "name": "signature"
        }, {
            "type": "bytes32",
            "name": "deposit_data_root"
        }],
        "0x" + validator_tx.substring(8)
    );
}

module.exports.provision = async function () {
    try {
        console.log("provisioning validators...")
        const validators = await postProvisioningRequest();
        console.log("sending batched deposit transaction... (this may take a minute to confirm)")
        const tx = await submitBatchTransactions(validators);
        console.log("etherscan link:", `https://goerli.etherscan.io/tx/${tx.transactionHash}`)
    } catch (error) {
        throw error;
    }
}