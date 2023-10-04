import { expect } from "chai";
import { Signer } from "ethers";
// Project
import * as constants from "./Constants";
import * as utils from "./Utils";

//
// Tests for network factory contract
//
describe("NetworkFactory", () => {
  let test_ctx: utils.TestContext;

  beforeEach(async () => {
    test_ctx = await utils.initTestContext();
  });

  it("should construct correctly", async () => {
    expect(await test_ctx.network_factory.owner())
      .to.equal(await test_ctx.accounts.owner.getAddress());
  });

  it("should revert if functions are not called by the owner", async () => {
    const not_owner_account: Signer = test_ctx.accounts.signers[0];

    await expect(test_ctx.network_factory.connect(not_owner_account).cloneAggregatorNode(constants.NULL_ADDRESS))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await expect(test_ctx.network_factory.connect(not_owner_account).cloneDisgregatorNode([constants.NULL_ADDRESS]))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await expect(test_ctx.network_factory.connect(not_owner_account).createAggregatorLayer([constants.NULL_ADDRESS], 1))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await expect(test_ctx.network_factory.connect(not_owner_account).createDisgregatorLayer([constants.NULL_ADDRESS], 1))
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should clone an aggregator node", async () => {
    const output_address: string = (await utils.generateOutputAddresses(test_ctx.accounts, 1))[0];

    const node_addr: string = await test_ctx.network_factory.callStatic.cloneAggregatorNode(output_address);
    await expect(await test_ctx.network_factory.cloneAggregatorNode(output_address))
      .to.emit(test_ctx.network_factory, "AggregatorNodeCloned")
      .withArgs(node_addr, output_address);

    utils.testNetworkNode(
      await utils.getNetworkNodeContractAt(node_addr),
      test_ctx.network_factory.address,
      [output_address]
    );
  });

  it("should clone a disgregator node", async () => {
    const output_addresses: string[] = await utils.generateOutputAddresses(test_ctx.accounts, 4);

    const node_addr: string = await test_ctx.network_factory.callStatic.cloneDisgregatorNode(output_addresses);
    await expect(await test_ctx.network_factory.cloneDisgregatorNode(output_addresses))
      .to.emit(test_ctx.network_factory, "DisgregatorNodeCloned")
      .withArgs(node_addr, output_addresses);

    utils.testNetworkNode(
      await utils.getNetworkNodeContractAt(node_addr),
      test_ctx.network_factory.address,
      output_addresses
    );
  });

  it("should create a layer of aggregator nodes", async () => {
    const output_addresses: string[] = await utils.generateOutputAddresses(test_ctx.accounts, 4);
    const layer_mul: number = 2;

    const layer: string[] = await test_ctx.network_factory.callStatic.createAggregatorLayer(output_addresses, layer_mul);
    await expect(await test_ctx.network_factory.createAggregatorLayer(output_addresses, layer_mul))
      .to.emit(test_ctx.network_factory, "AggregatorLayerCreated")
      .withArgs(layer, output_addresses, layer_mul);

    expect(layer.length)
      .to.equal(output_addresses.length * layer_mul);

    for (let i = 0; i < layer.length; i++) {
      utils.testNetworkNode(
        await utils.getNetworkNodeContractAt(layer[i]),
        test_ctx.network_factory.address,
        [output_addresses[i / layer_mul]]
      );
    }
  });

  it("should create a layer of disgregator nodes", async () => {
    const output_addresses: string[] = await utils.generateOutputAddresses(test_ctx.accounts, 4);
    const layer_mul: number = 2;

    const layer: string[] = await test_ctx.network_factory.callStatic.createDisgregatorLayer(output_addresses, layer_mul);
    await expect(await test_ctx.network_factory.createDisgregatorLayer(output_addresses, layer_mul))
      .to.emit(test_ctx.network_factory, "DisgregatorLayerCreated")
      .withArgs(layer, output_addresses, layer_mul);

    expect(layer.length)
      .to.equal(output_addresses.length / layer_mul);

    for (let i = 0; i < layer.length; i++) {
      utils.testNetworkNode(
        await utils.getNetworkNodeContractAt(layer[i]),
        test_ctx.network_factory.address,
        output_addresses
      );
    }
  });

  it("should revert if creating a layer with invalid layer multiplier", async () => {
    const dummy_addresses: string[] = [await test_ctx.accounts.signers[0].getAddress()];
    const layer_mul: number = constants.LAYERS_MUL_MIN - 1;

    await expect(test_ctx.network_factory.createAggregatorLayer(dummy_addresses, layer_mul))
      .to.be.revertedWithCustomError(test_ctx.network_factory, "InvalidLayersMulError");
    await expect(test_ctx.network_factory.createDisgregatorLayer(dummy_addresses, layer_mul))
      .to.be.revertedWithCustomError(test_ctx.network_factory, "InvalidLayersMulError");
  });

  it("should revert if creating a layer with invalid number of nodes", async () => {
    const layer_mul: number = constants.LAYERS_MUL_MIN;

    await expect(test_ctx.network_factory.createAggregatorLayer([], layer_mul))
      .to.be.revertedWithCustomError(test_ctx.network_factory, "InvalidNodesNumError");
    await expect(test_ctx.network_factory.createDisgregatorLayer([], layer_mul))
      .to.be.revertedWithCustomError(test_ctx.network_factory, "InvalidNodesNumError");
  });
});
