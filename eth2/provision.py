import os
import json
import requests
from web3 import Web3
from web3.middleware import geth_poa_middleware
from web3.middleware import construct_sign_and_send_raw_middleware
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

web3 = Web3(Web3.HTTPProvider(os.environ["GOERLI_RPC_URL"]))
web3.middleware_onion.inject(geth_poa_middleware, layer=0)
acct = Account.create(os.environ["GOERLI_PRIVATE_KEY"])
web3.middleware_onion.add(construct_sign_and_send_raw_middleware(acct))
web3.eth.defaultAccount = acct.address

eth2_url = "https://eth2.staging.staked.cloud/api"


def post_provisioning_request(validator_count):  # Step 1: Post Provisioning Request
    endpoint = "/provisioning_requests/eth2"
    params = {"api_key": os.environ["STAKED_API_KEY"]}
    data = {
        "attributes": {
            "withdrawalKey": os.environ["WITHDRAWAL_PUBLIC_KEY"],
            "validators": [{"cloud": "amazon", "count": int(validator_count)}],
        }
    }
    r = requests.post(eth2_url + endpoint, params=params, json=data)
    return r.json()


def batch_transactions(validators):  # Step 2: Batch Staking Transactions
    pubkeys = []
    withdrawal_credentials = []
    signatures = []
    deposit_data_roots = []

    with open("./Deposit.json") as abi:
        deposit_abi = json.load(abi)
        deposit_contract = web3.eth.contract(address="0x07b39F4fDE4A38bACe212b546dAc87C58DfE3fDC", abi=deposit_abi)

        for _, validator in enumerate(validators):
            decoded = deposit_contract.decode_function_input("0x" + validator["depositInput"])
            pubkeys.append(decoded[1]["pubkey"].hex())
            withdrawal_credentials.append(decoded[1]["withdrawal_credentials"].hex())
            signatures.append(decoded[1]["signature"].hex())
            deposit_data_roots.append(decoded[1]["deposit_data_root"].hex())

    print(pubkeys)
    print(withdrawal_credentials)
    print(signatures)
    print(deposit_data_roots)

    with open("./BatchDeposit.json") as abi:
        batching_abi = json.load(abi)
        batching_contract = web3.eth.contract(address="0xD3e5AA84e0E6f4247B3609F88ff157c258E1fE89", abi=batching_abi)
        tx_hash = batching_contract.functions.batchDeposit(
            pubkeys, withdrawal_credentials, signatures, deposit_data_roots
        ).transact({"value": 32})
        print(tx_hash)


provision = post_provisioning_request(os.environ["VALIDATOR_COUNT"])
batch_transactions(provision["attributes"]["validators"])
