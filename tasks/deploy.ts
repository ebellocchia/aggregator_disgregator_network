import { Contract, ContractFactory } from "ethers";
import { task } from "hardhat/config";

task("deploy", "Deploy contract")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying contract...");

    const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NetworkFactory");
    const instance: Contract = await contract_factory.deploy();
  
    await instance.deployed();
  
    console.log(`NetworkFactory deployed to ${instance.address}`);
  });
