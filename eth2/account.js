require("dotenv").config()

const Web3 = require("web3");

const {
  GOERLI_RPC_URL,
} = process.env;

const web3 = new Web3(GOERLI_RPC_URL);

module.exports.create = async function () {
  const account = await web3.eth.accounts.create(web3.utils.randomHex(32));
  console.log(account);
}