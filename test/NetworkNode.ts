import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import hre from "hardhat";
// Project
import * as constants from "./Constants";
import * as utils from "./Utils";

//
// Tests for network node contract
//
describe("NetworkNode", () => {
  const OUTPUT_ADDRESSES_NUM: number = 3;

  let output_accounts: Signer[];
  let output_addresses: string[];
  let test_ctx: utils.TestContext;

  beforeEach(async () => {
    test_ctx = await utils.initTestContext();
    output_accounts = await utils.generateOutputAccounts(test_ctx.accounts, OUTPUT_ADDRESSES_NUM);
    output_addresses = await utils.generateOutputAddresses(test_ctx.accounts, OUTPUT_ADDRESSES_NUM);
  });

  it("should have empty output addresses and owner when not initialized", async () => {
    expect(await test_ctx.network_node.outputAddressesNum())
      .to.equal(0);
    expect(await test_ctx.network_node.owner())
      .to.equal(constants.NULL_ADDRESS);
  });

  it("should initialize correctly (aggregator)", async () => {
    await test_ctx.network_node.initAsAggregator(output_addresses[0]);

    utils.testNetworkNode(
      test_ctx.network_node,
      await test_ctx.accounts.owner.getAddress(),
      [output_addresses[0]]
    );
  });

  it("should initialize correctly (disgregator)", async () => {
    await test_ctx.network_node.initAsDisgregator(output_addresses);

    utils.testNetworkNode(
      test_ctx.network_node,
      await test_ctx.accounts.owner.getAddress(),
      output_addresses
    );
  });

  it("should aggregate received ETH if initialized", async () => {    
    const initial_amount: BigNumber = await output_accounts[0].getBalance();
    const eth_amount: BigNumber = hre.ethers.utils.parseEther("1.0");

    await test_ctx.network_node.initAsAggregator(output_addresses[0]);
    await test_ctx.accounts.owner.sendTransaction({
      to: test_ctx.network_node.address,
      value: eth_amount,
    });

    expect(await output_accounts[0].getBalance())
      .to.equal(initial_amount.add(eth_amount));
  });

  it("should disgregate received ETH if initialized", async () => {    
    const initial_amounts: BigNumber[] = [];
    for (let i = 0; i < output_addresses.length; i++) {
      initial_amounts.push(await output_accounts[i].getBalance());
    }

    const eth_amount: BigNumber = hre.ethers.utils.parseEther("1.0");
    const rem_amount: BigNumber = eth_amount.mod(OUTPUT_ADDRESSES_NUM);
    const split_amount: BigNumber = eth_amount.div(OUTPUT_ADDRESSES_NUM);

    await test_ctx.network_node.initAsDisgregator(output_addresses);
    await test_ctx.accounts.owner.sendTransaction({
      to: test_ctx.network_node.address,
      value: eth_amount,
    });

    for (let i = 0; i < output_addresses.length; i++) {
      const amount: BigNumber = i == 0 ? initial_amounts[i].add(split_amount).add(rem_amount) : 
                                         initial_amounts[i].add(split_amount);
      expect(await output_accounts[i].getBalance())
        .to.equal(amount);
    }
  });

  it("should revert if initialized more than once (aggregator)", async () => {
    await test_ctx.network_node.initAsAggregator(output_addresses[0]);
    await expect(test_ctx.network_node.initAsAggregator(output_addresses[0]))
      .to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("should revert if initialized more than once (disgregator)", async () => {
    await test_ctx.network_node.initAsDisgregator(output_addresses);
    await expect(test_ctx.network_node.initAsDisgregator(output_addresses))
      .to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("should revert if initialized more than once (disgregator + aggregator)", async () => {
    await test_ctx.network_node.initAsDisgregator(output_addresses);
    await expect(test_ctx.network_node.initAsAggregator(output_addresses[0]))
      .to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("should revert if initialized more than once (aggregator + disgregator)", async () => {
    await test_ctx.network_node.initAsAggregator(output_addresses[0]);
    await expect(test_ctx.network_node.initAsDisgregator(output_addresses))
      .to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("should revert if initializing an aggregator with null address", async () => {
    await expect(test_ctx.network_node.initAsAggregator(constants.NULL_ADDRESS))
      .to.be.revertedWithCustomError(test_ctx.network_node, "NullOutputAddressError");
  });

  it("should revert if initializing a disgregator with empty addresses", async () => {
    await expect(test_ctx.network_node.initAsDisgregator([]))
      .to.be.revertedWithCustomError(test_ctx.network_node, "EmptyOutputAddressesError");
  });

  it("should revert if initializing a disgregator with a null address", async () => {
    const output_addresses: string[] = [await test_ctx.accounts.signers[0].getAddress(), constants.NULL_ADDRESS];
    await expect(test_ctx.network_node.initAsDisgregator(output_addresses))
      .to.be.revertedWithCustomError(test_ctx.network_node, "NullOutputAddressError");
  });

  it("should revert if transferring ETH without being initialized", async () => {
    await expect(test_ctx.accounts.owner.sendTransaction({
      to: test_ctx.network_node.address,
      value: hre.ethers.utils.parseEther("1.0"),
    }))
      .to.revertedWithCustomError(test_ctx.network_node, "EmptyOutputAddressesError");
  });
});
