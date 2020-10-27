const axios = require("axios");
const Web3 = require("web3");

const {
    STAKED_API_KEY,
    VALIDATOR_COUNT,
    WITHDRAWAL_PUBLIC_KEY,
    GOERLI_RPC_URL,
    GOERLI_PRIVATE_KEY,
    GAS_PRICE_SCALAR
} = process.env;

async function initializeWeb3() {
    const web3 = new Web3(GOERLI_RPC_URL);
    const account = web3.eth.accounts.privateKeyToAccount(GOERLI_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    return web3;
}

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

function decodeDepositInput(web3, validator_tx) {
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
    let web3 = await initializeWeb3();

    /*
        The Node Provisioning API can currently handle
        about 6 validators per call, with significant 
        performance improvements coming soon through
        asyncronous requests.
    */

    let max_validators_per_call = 6;

    let validators = [];
    while (validators.length < Number(VALIDATOR_COUNT)) {
        let remaining = Number(VALIDATOR_COUNT) - validators.length;
        let create = remaining > max_validators_per_call ? max_validators_per_call : remaining;
        try {
            console.log(`provisioning ${create} validators...`);
            const provisioned = await postProvisioningRequest(create);
            console.log("provisioned", provisioned);
            validators = validators.concat(provisioned);
        } catch (error) {
            throw error;
        }
    }

    /*
        The batching contract can handle a maximum (safe limit)
        of 185 deposits per transaction. This is due to the gas
        limit per block on Ethereum.
    */

    let max_deposits_per_tx = 185;

    let deposited = 0;
    while (deposited < validators.length) {
        let remaining = validators.length - deposited;
        let batch = remaining > max_deposits_per_tx ? max_deposits_per_tx : remaining;
        try {
            console.log("sending batched deposit transaction... (this may take a minute to confirm)");
            const batch_tx = await submitBatchTransactions(web3, validators.slice(deposited, deposited + batch));
            console.log("etherscan link:", `https://goerli.etherscan.io/tx/${batch_tx.transactionHash}`);
            deposited += batch;
        } catch (error) {
            throw error;
        }
    }
}