import os
import json
import requests
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

web3 = Web3(Web3.WebsocketProvider(os.environ["GOERLI_RPC_URL"]))
eth2_url = "https://eth2.staging.staked.cloud/api"


def post_provisioning_request(validator_count):  # Step 1: Post Provisioning Request
    endpoint = "/provisioning_requests/eth2"
    params = {"api_key": os.environ["STAKED_API_KEY"]}
    data = {
        "attributes": {
            "withdrawalKey": os.environ["WITHDRAWAL_PUBLIC_KEY"],
            "validators": [{"cloud": "amazon", "count": validator_count}],
        }
    }
    return requests.post(eth2_url + endpoint, params=params, json=data)


def batch_transactions(validators):  # Step 2: Batch Staking Transactions
    pubkeys = []
    withdrawal_credentials = []
    signatures = []
    deposit_data_roots = []

    def decode(validator_tx):
        return web3.eth.abi.decodeParameters(
            [
                {"type": "bytes", "name": "pubkey"},
                {"type": "bytes", "name": "withdrawal_credentials"},
                {"type": "bytes", "name": "signature"},
                {"type": "bytes32", "name": "deposit_data_root"},
            ],
            "0x" + validator_tx.substring(8),
        )

    for i in range(validators.length):
        decoded = decode(validators[i].depositInput)
        pubkeys.append(decoded.pubkey)
        withdrawal_credentials.append(decoded.withdrawal_credentials)
        signatures.append(decoded.signature)
        deposit_data_roots.append(decoded.deposit_data_root)

    with open("./build/contracts/BatchDeposit_Goerli.json") as abi:
        batching_abi = json.load(abi)
        batching_contract = web3.eth.contract(address="0x8044f3513E32701908C3E8F745b507E619F5a519", abi=batching_abi)
        tx_hash = batching_contract.functions.batchDeposit(
            pubkeys, withdrawal_credentials, signatures, deposit_data_roots
        ).transact()
        print(tx_hash)


provision_res = post_provisioning_request(os.environ["VALIDATOR_COUNT"])
print(provision_res)
# batch_transactions(validators)
