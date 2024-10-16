import { ContractConfig } from "../config/config";

export interface IContractService {
  indexContractLogs(
    contractName: string,
    contractConfig: ContractConfig,
    fromBlock: number,
    toBlock: number
  ): Promise<number>;
}
