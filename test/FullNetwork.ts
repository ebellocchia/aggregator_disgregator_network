import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import hre from "hardhat";
// Project
import * as utils from "./Utils";

//
// Tests for full network
//
describe("FullNetwork", () => {
  let test_ctx: utils.TestContext;

  beforeEach(async () => {
    test_ctx = await utils.initTestContext();
  });

  it("should create a full network", async () => {
    const output_num: number = 4;
    const output_accounts: Signer[] = await utils.generateOutputAccounts(test_ctx.accounts, output_num);
    const output_addresses: string[] = await utils.generateOutputAddresses(test_ctx.accounts, output_num);

    // Aggregators layer 1
    const aggr_layer_1: string[] = await test_ctx.network_factory.callStatic.createAggregatorLayer(
      output_addresses, 
      2,
    );
    await test_ctx.network_factory.createAggregatorLayer(output_addresses, 2);
    // Aggregators layer 2
    const aggr_layer_2: string[] = await test_ctx.network_factory.callStatic.createAggregatorLayer(
      aggr_layer_1,
      2
    );
    await test_ctx.network_factory.createAggregatorLayer(aggr_layer_1, 2);
    // Aggregators layer 3
    const aggr_layer_3: string[] = await test_ctx.network_factory.callStatic.createAggregatorLayer(
      aggr_layer_2,
      1
    );
    await test_ctx.network_factory.createAggregatorLayer(aggr_layer_2, 1);

    // Disgregators layer 1
    const disgr_layer_1: string[] = await test_ctx.network_factory.callStatic.createDisgregatorLayer(
      aggr_layer_3, 
      4
    );
    await test_ctx.network_factory.createDisgregatorLayer(aggr_layer_3,  4);
    // Disgregators layer 2
    const disgr_layer_2: string[] = await test_ctx.network_factory.callStatic.createDisgregatorLayer(
      disgr_layer_1,
      4
    );
    await test_ctx.network_factory.createDisgregatorLayer(disgr_layer_1, 4);

    // Get initial amounts
    const initial_amounts: BigNumber[] = [];
    for (let i = 0; i < output_addresses.length; i++) {
      initial_amounts.push(await output_accounts[i].getBalance())
    }
    // Transfer ETH to the first disgregator node
    const eth_amount: BigNumber = hre.ethers.utils.parseEther("1.0");
    await test_ctx.accounts.owner.sendTransaction({
      to: disgr_layer_2[0],
      value: eth_amount,
    });

    for (let i = 0; i < output_addresses.length; i++) {
        expect(await output_accounts[i].getBalance())
        .to.equal(initial_amounts[i].add(eth_amount.div(output_num)));
    }
  });
});
