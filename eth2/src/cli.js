const inquirer = require("inquirer");
const ora = require("ora");

const web3js = require("./web3.js");
const provisionAPI = require("./provision.js");
const delegationsAPI = require("./delegations.js");
const batchAPI = require("./batch.js");

const api_prompts = [
  {
    type: "list",
    name: "network",
    message: "Select the network environment",
    choices: ["Testnet", "Dev-Testnet"],
    filter: function (val) {
      return val.toLowerCase();
    },
  },
  {
    type: "password",
    message: "Enter your Staked api key",
    name: "api_key",
    mask: "*",
  },
];

const provision_prompts = [
  {
    type: "input",
    name: "withdrawal_public_key",
    message: "Please enter your ETH2 withdrawal public key",
  },
  {
    type: "input",
    name: "num_validators",
    message: "Please enter the number of validators to provision",
  },
];

const batch_prompts = [
  {
    type: "input",
    name: "rpc_url",
    message: "Please enter your ETH1 RPC url",
  },
  {
    type: "list",
    name: "gas_speed_scalar",
    message: "Select the gas speed",
    choices: ["Fast", "Normal"],
    filter: function (speed) {
      switch (speed) {
        case "Fast":
          return 1.25;
        case "Normal":
          return 1.1;
        default:
          throw error;
      }
    },
  },
  {
    type: "input",
    name: "eth1_address",
    message: "Please enter your ETH1 address",
  },
  {
    type: "password",
    name: "eth1_private_key",
    message: "Please enter your ETH1 private key",
    mask: "*",
  },
];

async function provision(config) {
  try {
    const spinner = ora("Posting Provisioning Request").start();
    try {
      let provision_data = await provisionAPI.postProvisioningRequest(
        config["network"],
        config["api_key"],
        config["withdrawal_public_key"],
        config["num_validators"]
      );
      spinner.succeed(
        `Success. Provisioning Request UUID: ${provision_data.uuid}`
      );
      return provision_data.uuid;
    } catch (error) {
      spinner.fail(`Request failed`);
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

async function delegations(config) {
  try {
    const spinner = ora("Getting Delegations (this may take a minute)").start();
    try {
      let delegations_data = await delegationsAPI.pollDelegationObjects(
        config["network"],
        config["api_key"],
        config["provision_uuid"],
        config["num_validators"]
      );
      spinner.succeed(`Success. Received all delegation objects.`);
      return delegations_data;
    } catch (error) {
      spinner.fail(`Request failed`);
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

async function batch(config) {
  try {
    let web3 = await web3js.initializeWeb3(
      config["rpc_url"],
      config["eth1_private_key"]
    );
    try {
      const spinner = ora(
        `Sending Batch Transaction/s - https://goerli.etherscan.io/address/${config["eth1_address"]}`
      ).start();
      try {
        await batchAPI.batchDeposits(
          config["network"],
          web3,
          config["gas_price_scalar"],
          config["delegations"]
        );
        spinner.succeed(
          `Success. Transactions confirmed - https://goerli.etherscan.io/address/${config["eth1_address"]}`
        );
        return;
      } catch (error) {
        spinner.fail(`Batch transaction/s failed`);
        throw error;
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

module.exports.stake = async function () {
  try {
    let config = await inquirer.prompt(
      api_prompts.concat(provision_prompts, batch_prompts)
    );
    try {
      let provision_uuid = await provision(config);
      try {
        let delegations_data = await delegations({
          ...config,
          ...{
            provision_uuid: provision_uuid,
          },
        });
        try {
          await batch({
            ...config,
            ...{
              delegations: delegations_data,
            },
          });
        } catch (error) {
          throw error;
        }
      } catch (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.log(error);
  }
};
