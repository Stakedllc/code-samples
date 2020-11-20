const Web3 = require("web3");

module.exports.logTestAccount = async function () {
  const web3 = new Web3();
  const account = await web3.eth.accounts.create(web3.utils.randomHex(32));
  console.log(account);
};

module.exports.initializeWeb3 = async function (rpc_url, eth1_pk) {
  const web3 = new Web3(rpc_url);
  const account = web3.eth.accounts.privateKeyToAccount(eth1_pk);
  web3.eth.accounts.wallet.add(account);
  return web3;
};
