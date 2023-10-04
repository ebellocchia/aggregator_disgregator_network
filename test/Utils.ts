import { expect } from "chai";
import { Contract, ContractFactory, Signer } from "ethers";
import hre from "hardhat";

//
// Interfaces
//

export interface Accounts {
  owner: Signer;
  signers: Signer[];
}

export interface TestContext {
  accounts: Accounts;
  network_factory: Contract;
  network_node: Contract;
}

//
// Exported functions
//

export async function testNetworkNode(
  networkNode: Contract,
  ownerAddress: string,
  outputAddresses: string[]
) : Promise<void> {
  expect(await networkNode.owner())
    .to.equal(ownerAddress);
  expect(await networkNode.outputAddressesNum())
    .to.equal(outputAddresses.length);

  for (let i = 0; i < outputAddresses.length; i++) {
    expect(await networkNode.outputAddresses(i))
      .to.equal(outputAddresses[i]);
  }

  if (outputAddresses.length == 1) {
    expect(await networkNode.isAggregator())
      .to.equal(true);
    expect(await networkNode.isDisgregator())
      .to.equal(false);
  }
  else {
    expect(await networkNode.isAggregator())
      .to.equal(false);
    expect(await networkNode.isDisgregator())
      .to.equal(true);
  }
}

export async function generateOutputAccounts(
  accounts: Accounts,
  addressNum: number
) : Promise<Signer[]> {
  const output_accounts: Signer[] = [];
  for (let i = 0; i < addressNum; i++) {
    output_accounts.push(accounts.signers[i]);
  }

  return output_accounts;
}

export async function generateOutputAddresses(
  accounts: Accounts,
  addressNum: number
) : Promise<string[]> {
  const output_addresses: string[] = [];
  for (let i = 0; i < addressNum; i++) {
    output_addresses.push(await accounts.signers[i].getAddress());
  }

  return output_addresses;
}

export async function initTestContext() : Promise<TestContext> {
  const accounts: Accounts = await initAccounts();
  const network_node: Contract = await deployNetworkNodeContract();
  const network_factory: Contract = await deployNetworkFactoryContract();

  return {
    accounts,
    network_factory,
    network_node,
  };
}

export async function getNetworkNodeContractAt(
  address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NetworkNode");
  return await contract_factory.attach(address);
}

//
// Not exported functions
//

async function initAccounts() : Promise<Accounts> {
  const all_signers: Signer[] = await hre.ethers.getSigners();

  const owner: Signer = all_signers[0];
  const signers: Signer[] = [];
  for (let i = 1; i < all_signers.length; i++) {
    signers.push(all_signers[i])
  }

  return {
    owner,
    signers,
  };
}

async function deployNetworkNodeContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NetworkNode");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

async function deployNetworkFactoryContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NetworkFactory");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}
