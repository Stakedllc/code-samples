async function batchDeposits(web3, delegations) {
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
      const batch_tx = await submitBatchTransaction(
        web3,
        delegations.slice(deposited, deposited + batch)
      );
      console.log(
        "etherscan link:",
        `https://goerli.etherscan.io/tx/${batch_tx.transactionHash}`
      );
      deposited += batch;
    } catch (error) {
      throw error;
    }
  }
}

async function submitBatchTransaction(web3, delegations) {
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
  const batching_abi = require("../eth2/BatchDeposit.json");
  const batching_contract = new web3.eth.Contract(
    batching_abi,
    BATCHING_CONTRACT_ADDRESS
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
        gasPrice: gas_price * GAS_PRICE_SCALAR,
        gas: 21000 + 64000 * delegations.length,
      });
    return tx;
  } catch (error) {
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
