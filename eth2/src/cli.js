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

const web3_prompts = [
  {
    type: "input",
    name: "rpc_url",
    message: "Please enter your ETH1 RPC url",
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
      let request_data = await provisionAPI.postProvisioningRequest(
        config["network"],
        config["api_key"],
        config["withdrawal_public_key"],
        config["num_validators"]
      );
      spinner.succeed(
        `Success. Provisioning Request UUID: ${request_data.uuid}`
      );
      return request_data.uuid;
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
        config["request_uuid"],
        config["num_validators"]
      );
      spinner.succeed(`Success. Received all delegation objects.`);
      console.log(delegations_data);
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
      const spinner = ora("Sending Batch Transaction/s").start();
      try {
        await batchAPI.batchDeposits(web3, config["delegations"]);
        spinner.succeed(`Success. Transactions confirmed.`);
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
    let api_config = await inquirer.prompt(api_prompts);
    try {
      let provision_config = await inquirer.prompt(provision_prompts);
      let provision_uuid = await provision({
        ...api_config,
        ...provision_config,
      });
      try {
        let delegations_config = {
          ...api_config,
          ...{
            request_uuid: provision_uuid,
            num_validators: provision_config["num_validators"],
          },
        };
        let delegations_data = await delegations(delegations_config);
        try {
          let web3_config = await inquirer.prompt(web3_prompts);
          let batch_config = {
            ...web3_config,
            ...{
              delegations: delegations_data,
            },
          };
          await batch(batch_config);
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
