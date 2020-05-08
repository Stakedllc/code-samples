require("dotenv").config()

const axios = require("axios");
const Web3 = require("web3");

const {
  STAKED_API_KEY,
  STAKED_API_URL,
  GOERLI_RPC_URL,
  WITHDRAWAL_PUBLIC_KEY,
  VALIDATOR_COUNT,
  BATCHING_CONTRACT_ADDR,
  ETH1_GOERLI_PRIVATE_KEY,
  GAS_PRICE
} = process.env;

const web3 = new Web3(GOERLI_RPC_URL);

async function main() {
  var account;
  try {
    account = await setETH1GoerliAccount();
    try {
      const validators = await postProvisioningRequest();
      console.log(validators);
      await submitBatchTransactions(validators);
    }catch(error) {
      console.log(error);
    }
  }catch(newAccount) {
    console.log("No private key set, generated new Goerli account \n", newAccount);
  }
}

async function setETH1GoerliAccount() {
  var account;
  if (typeof ETH1_GOERLI_PRIVATE_KEY === 'undefined' || ETH1_GOERLI_PRIVATE_KEY === null) {
    account = await web3.eth.accounts.create(web3.utils.randomHex(32));
    throw(account);
  }else {
    account = await web3.eth.accounts.privateKeyToAccount(ETH1_GOERLI_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    return account;
  }
}

async function postProvisioningRequest() {
  const endpoint = "/provisioning_requests/eth2";
  const attributes = {
		"attributes":{
		  "withdrawalKey": WITHDRAWAL_PUBLIC_KEY, 
			"validators": [
				{
					"cloud": "amazon", 
					"count": VALIDATOR_COUNT
				}
			]
		}
	}
  try {
    var response = await axios.post(STAKED_API_URL + endpoint, {
      params: {
        api_key: STAKED_API_KEY
      }
    }, { attributes });
    return response.attributes.validators;
  }catch(error){
    throw error;
  }
}

async function submitBatchTransactions(validators) {
  var pubkeys = []; 
  var withdraw_credentials = [];
  var signatures = [];
  var deposit_data_roots = [];
  
  for (let i = 0; i < validators.length; i++) {
    let decoded = decodeDepositInput(validator[i].depositInput);
    pubkeys.push(decoded.pubkey);
    withdraw_credentials.push(decoded.withdrawal_credentials);
    signatures.push(decoded.withdrawal_credentials);
    deposit_data_roots.push(decoded.deposit_data_roots);
  }
  
  const batchingABI = require("./build/contracts/BatchDeposit_Goerli.json").abi;
  const batchingContract = new web3.eth.Contract(batchingABI, BATCHING_CONTRACT_ADDR);
  try {
    const ether = n => new web3Goerli.utils.BN(web3Goerli.utils.toWei(n, 'ether'));
    const tx = await batchingContract.methods.batchDeposit(
      pubkeys,
      withdrawal_credentials,
      signatures,
      deposit_data_roots)
      .send({ from: web3.eth.accounts[0].address, value: ether(web3.utils.toBN(32 * validators.length)), gasPrice: GAS_PRICE, gas: 7999999 });
    console.log(tx);
  }catch(error) {
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
