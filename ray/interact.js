require("dotenv").config()

const Web3 = require("web3");

const {
  KOVAN_RPC_URL,
  KOVAN_PORTFOLIO_MANAGER_ADDR,
  PRIVATE_KEY,
  GAS_PRICE
} = process.env;

const web3 = new Web3(KOVAN_RPC_URL);

const tokens = {
  "ETH": {
    "address": "",
    "portfolioId": "0xf718ab6dc6da441acdc78107a8d317bc03e73837f54f725bd6f6ddd204ddd170",
    "testAmount": .001 * Math.pow(10, 18)
  },
  "DAI": {
    "address": "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa",
    "portfolioId": "0x810522b60dd90f9263d4e301357c9db1e75e63e814939ae109ccb964c96a93d3",
    "testAmount": .001 * Math.pow(10, 18)
  },
  "USDC": {
    "address": "",
    "portfolioId": "0xf718ab6dc6da441acdc78107a8d317bc03e73837f54f725bd6f6ddd204ddd170",
    "testAmount": .001 * Math.pow(10, 6)
  }
}

async function main() {
  try {
    await setAccount();
    try {
       //tx = await approve("DAI");
       tx = await mint("DAI");
       console.log(tx);
    }catch(error) {
      console.log(error);
    }
  }catch(account) {
    console.log(account);
  }
}

async function setAccount() {
  var account;
  if (typeof PRIVATE_KEY === 'undefined' || PRIVATE_KEY === null) {
    account = await web3.eth.accounts.create(web3.utils.randomHex(32));
    throw(account);
  }else {
    account = await web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    return account;
  }
}

async function approve(token) {
  const erc20ABI = require("./build/contracts/ERC20.json").abi;
  const erc20 = new web3.eth.Contract(erc20ABI, tokens[token].address);
  return await erc20.methods.approve(KOVAN_PORTFOLIO_MANAGER_ADDR, -1).send({ from: web3.eth.accounts.wallet[0].address, value: 0, gasPrice: GAS_PRICE, gas: 1100000});
}

async function mint(token) {
  const portfolioManagerABI = require("./build/contracts/PortfolioManager.json").abi;
  const portfolioManager = new web3.eth.Contract(portfolioManagerABI, KOVAN_PORTFOLIO_MANAGER_ADDR);
  return await portfolioManager.methods.mint(
    tokens[token].portfolioId, 
    web3.eth.accounts.wallet[0].address, 
    tokens[token].testAmount
  ).send({ from: web3.eth.accounts.wallet[0].address, value: 0, gasPrice: GAS_PRICE, gas: 1100000});
}

main();