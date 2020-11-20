module.exports.batchDeposits = async function batchDeposits(
  network,
  web3,
  gas_price_scalar,
  delegations
) {
  /*
      The batching contract can handle a maximum (safe limit)
      of 185 deposits per transaction. This is due to the gas
      limit per block on Ethereum.
  */

  let max_deposits_per_tx = 185;

  let deposited = 0;
  while (deposited < delegations.length) {
    let remaining = delegations.length - deposited;
    let batch =
      remaining > max_deposits_per_tx ? max_deposits_per_tx : remaining;
    try {
      let batch_tx = await submitBatchTransaction(
        network,
        web3,
        gas_price_scalar,
        delegations.slice(deposited, deposited + batch)
      );
      deposited += batch;
    } catch (error) {
      throw error;
    }
  }
};

async function submitBatchTransaction(
  network,
  web3,
  gas_price_scalar,
  delegations
) {
  /*
        Each delegation object contains encoded transaction data 
        to sign and send to the canonical ETH2 deposit contract.
        To use the batching contract, this data must be decoded
        and constructed in a batch transaction.
    */
  var pubkeys = [];
  var withdrawal_credentials = [];
  var signatures = [];
  var deposit_data_roots = [];
  for (let i = 0; i < delegations.length; i++) {
    let decoded = decodeDepositInput(
      web3,
      delegations[i].attributes.depositInput
    );
    pubkeys.push(decoded.pubkey);
    withdrawal_credentials.push(decoded.withdrawal_credentials);
    signatures.push(decoded.signature);
    deposit_data_roots.push(decoded.deposit_data_root);
  }
  /*
        After decoding the information on each delegation object, construct
        the transaction to the batching contract.
    */
  const batching_abi = require("./contracts/BatchDeposit.json");
  const batching_address = getBatchAddress(network);
  const batching_contract = new web3.eth.Contract(
    batching_abi,
    batching_address
  );
  try {
    const ether = (n) => new web3.utils.BN(web3.utils.toWei(n, "ether"));
    const gas_price = await web3.eth.getGasPrice();
    const tx = await batching_contract.methods
      .batchDeposit(
        pubkeys,
        withdrawal_credentials,
        signatures,
        deposit_data_roots
      )
      .send({
        from: web3.eth.accounts.wallet[0].address,
        value: ether(web3.utils.toBN(32 * delegations.length)),
        gasPrice: gas_price * gas_price_scalar,
        gas: 21000 + 64000 * delegations.length,
      });
    return tx;
  } catch (error) {
    throw error;
  }
}

function getBatchAddress(network) {
  switch (network) {
    case "testnet":
      return "0x061e6993baFD5858242a4A10b757c870Eb2A8041";
    case "dev-testnet":
      return "0x061e6993baFD5858242a4A10b757c870Eb2A8041";
    default:
      throw error;
  }
}

function decodeDepositInput(web3, deposit_tx) {
  return web3.eth.abi.decodeParameters(
    [
      {
        type: "bytes",
        name: "pubkey",
      },
      {
        type: "bytes",
        name: "withdrawal_credentials",
      },
      {
        type: "bytes",
        name: "signature",
      },
      {
        type: "bytes32",
        name: "deposit_data_root",
      },
    ],
    "0x" + deposit_tx.substring(8)
  );
}
