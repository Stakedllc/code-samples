import os
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
    res = requests.post(eth2_url + endpoint, params=params, json=data)
    return res.json()
