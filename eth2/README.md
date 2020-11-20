# ETH2

Provision ETH2 validators on Staked's secure cloud infrastructure.

## Getting Started

First thing's first: clone `code-samples`, open the command line, and navigate to the ETH2 folder.

The scripts are written with node.js v10.15.0.

### API Key
An API key with ETH2 permissions is required to provision validators - please email sam@staked.us for an API key with access.

### Generate a Withdrawal Key
An ETH2 withdrawal key is required to control stake on ETH2, and can be used for many validators.

Follow our [guide](https://staked.us/faq/eth2/#withdrawal-address) to generate a withdrawal key which be can used in testing.

### Goerli ETH
Goerli ETH is the staking asset on ETH2 testnets, which means a Goerli account is required for testing.

The ETH Staker discord ([link](https://discord.gg/eAuDepM)) is a fantastic testing resource for acquiring Goerli ETH. Select the #request-goerli-eth faucet channel and enter the following message into the chat:

```
!goerliEth {YOUR GOERLI ADDRESS}
```

The faucet will send enough Goerli ETH for a validator (32 Goerli ETH) plus gas costs.

## Provision Validators, Get Associated Delegation Objects, and Deposit

With an `api_key`, `withdrawal_public_key`, `goerli_rpc_url`, and `goerli_private_key`, you can use the `code-samples` CLI tool to provision validators on Pyrmont.

In the ETH2 folder, run `npm run stake`!
