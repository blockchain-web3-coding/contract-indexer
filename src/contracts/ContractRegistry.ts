import { ethers } from "ethers";
import { config, ContractConfig } from "../config/config";

interface ContractInfo {
  name: string;
  config: ContractConfig;
  abi: any[];
  interface: ethers.utils.Interface;
  queueName: string;
}

export class ContractRegistry {
  private static contracts: Map<string, ContractInfo> = new Map();

  static registerContract(name: string, abi: any[]): void {
    const contractConfig = config.contracts[name];
    if (!contractConfig) {
      console.warn(`Contract configuration not found for: ${name}. Skipping.`);
      return;
    }

    const contractInterface = new ethers.utils.Interface(abi);
    this.contracts.set(name, {
      name,
      config: contractConfig,
      abi,
      interface: contractInterface,
      queueName: `logs:${name}`,
    });
  }

  static getContractInfo(name: string): ContractInfo {
    const contractInfo = this.contracts.get(name);
    if (!contractInfo) {
      throw new Error(`Contract not registered: ${name}`);
    }
    return contractInfo;
  }

  static getAllContracts(): ContractInfo[] {
    return Array.from(this.contracts.values());
  }
}

// Register only the contracts specified in the config
Object.keys(config.contracts).forEach((contractName) => {
  ContractRegistry.registerContract(contractName, [
    // TODO: add abi for each contract
  ]);
});
