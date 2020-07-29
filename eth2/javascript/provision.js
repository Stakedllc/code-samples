require("dotenv").config()

const axios = require("axios");
const Web3 = require("web3");

const {
  STAKED_API_KEY,
  STAKED_API_URL,
  GOERLI_RPC_URL,
  WITHDRAWAL_PUBLIC_KEY,
  BATCHING_CONTRACT_ADDR,
  ETH1_GOERLI_PRIVATE_KEY,
  GAS_PRICE
} = process.env;

const web3 = new Web3(GOERLI_RPC_URL);

async function main() {
  try {
    await setETH1GoerliAccount();
    try {
      const validators = await postProvisioningRequest();
      await submitBatchTransactions(validators);
    } catch (error) {
      console.log(error);
    }
  } catch (newAccount) {
    console.log("No private key set, generated new Goerli account \n", newAccount);
  }
}

async function setETH1GoerliAccount() {
  var account;
  if (typeof ETH1_GOERLI_PRIVATE_KEY === 'undefined' || ETH1_GOERLI_PRIVATE_KEY === null) {
    account = await web3.eth.accounts.create(web3.utils.randomHex(32));
    throw (account);
  } else {
    account = await web3.eth.accounts.privateKeyToAccount(ETH1_GOERLI_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    return account;
  }
}

async function postProvisioningRequest() {
  const endpoint = "/provisioning_requests/eth2";
  try {
    var response = await axios.post(STAKED_API_URL + endpoint + `?api_key=${STAKED_API_KEY}`, {
      attributes: {
        "withdrawalKey": WITHDRAWAL_PUBLIC_KEY,
        "validators": [
          {
            "cloud": "amazon",
            "count": 2
          }
        ]
      }
    });
    return response.data.attributes.validators;
  } catch (error) {
    throw error;
  }
}

async function submitBatchTransactions(validators) {
  console.log(validators);

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

  const batchingABI = require("./build/contracts/BatchDeposit_Goerli.json").abi;
  const batchingContract = new web3.eth.Contract(batchingABI, BATCHING_CONTRACT_ADDR);
  try {
    const ether = n => new web3.utils.BN(web3.utils.toWei(n, 'ether'));
    const tx = await batchingContract.methods.batchDeposit(
      pubkeys,
      withdrawal_credentials,
      signatures,
      deposit_data_roots)
      .send({ from: web3.eth.accounts.wallet[0].address, value: ether(web3.utils.toBN(32 * validators.length)), gasPrice: GAS_PRICE, gas: 7999999 });
    console.log(tx);
  } catch (error) {
    console.log(error);
  }
}

function decodeDepositInput(data) {
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
    "0x" + data.substring(8)
  );
}

main();
