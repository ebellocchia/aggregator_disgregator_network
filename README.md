# Introduction

Smart contract that creates a custom network of nodes that automatically transfers the received ETH among them and finally to some specified output addresses.\
The network is completely customizable.

The idea is to make more difficult to track the funds by disgregating and aggregating them multiple times, even if it'll be always possible to do it since there is no obfuscation.\
Funds got back from the network can also be sent again to the network again and so on.

Clearly, this works well only on cheap EVM-compatible blockchains like Polygon.

# Setup

Install `yarn` if not installed:

    npm install -g yarn

## Install package

Simply run:

    npm i --include=dev

## Compile

- To compile the contract:

        yarn compile

- To compile by starting from a clean build:

        yarn recompile

## Run tests

- To run tests without coverage:

        yarn test

- To run tests with coverage:

        yarn coverage

## Deploy

To deploy the contract:

    yarn deploy <NETWORK>

# Configuration

Hardhat is configured with the following networks:

|Network name|Description|
|---|---|
|`hardhat`|Hardhat built-in network|
|`locahost`|Localhost network (address: `127.0.0.1:8545`, it can be run with the following command: `yarn run-node`)|
|`bscTestnet`|Zero address|
|`bsc`|BSC mainnet|
|`ethereumSepolia`|ETH testnet (Sepolia)|
|`ethereum`|ETH mainnet|
|`polygonMumbai`|Polygon testnet (Mumbai)|
|`polygon`|Polygon mainnet|

The API keys, RPC nodes and mnemonic shall be configured in the `.env` file.\
You may need to modify the gas limit and price in the Hardhat configuration file for some networks (e.g. Polygon), to successfully execute the transactions (you'll get a gas error).

# How it works

## "NetworkNode" smart contract

The `NetworkNode` is the contract that receives ETH and sends it to some output addresses.\
The output addresses are fixed in the contract at cannot be changed anymore once initialized.

Depending on the number of output addresses, the node is called:

- __Aggregator__ if the there is only one output address. This means that any received ETH is "aggregated" to one output address.
- __Disgregator__ if the there is more than one output address. This means that any received ETH is "disgregated" amount multiple output addresses.

## "NetworkFactory" smart contract

The `NetworkFactory` allows deploying `NetworkNode` contracts. It can both deploy single nodes or a layer of nodes.

To minimize gas cost, the deployed `NetworkNode` are [minimal proxy contracts](https://eips.ethereum.org/EIPS/eip-1167).

The deployment of `Forwarder` is very cheap: in fact, at construction, the factory deploys a `Forwarder` contract that is then used to clone the other contracts.\
In other words, the deployed `Forwarder` contracts will only be proxies (in particular ) of the parent `Forwarder` contract.

The `NetworkFactory` is the only contract that you have to deploy.

### "NetworkFactory" functions

    function cloneAggregatorNode(
        address payable outputAddress_
    ) public returns (address payable)

Deploy a new `NetworkNode` contract behaving as an aggregator, using the specified `outputAddress_` as single output address.

___

    function cloneDisgregatorNode(
        address payable[] memory outputAddresses_
    ) public returns (address payable)

Deploy a new `NetworkNode` contract behaving as a disgregator, using the specified `outputAddresses_` as multiple output addresses.

___

    function createAggregatorLayer(
        address payable[] memory outputAddresses_,
        uint256 layersMul_
    ) public onlyOwner returns (address payable[] memory) 

Deploy a layer of `NetworkNode` contracts behaving as aggregators.\
The number of nodes in the layer will be the length of `outputAddresses_` multiplied by `layersMul_`. The minimum `layersMul_` value is 1.\
Each node will have `outputAddresses_[node_index / layersMul_]` as output address.
So, if you have 2 `outputAddresses_` and `layersMul_` equal to 2, the result will be:

- __Node 0__ output address: `outputAddresses_[0]`
- __Node 1__ output address: `outputAddresses_[0]`
- __Node 2__ output address: `outputAddresses_[1]`
- __Node 3__ output address: `outputAddresses_[1]`
___

    function createDisgregatorLayer(
        address payable[] memory outputAddresses_,
        uint256 layersMul_
    ) public onlyOwner returns (address payable[] memory)

Deploy a layer of `NetworkNode` contracts behaving as disgregators.\
The number of nodes in the layer will be the length of `outputAddresses_` divided by `layersMul_`. The minimum `layersMul_` value is 1.\
Each node will have `outputAddresses_` as output addresses.
