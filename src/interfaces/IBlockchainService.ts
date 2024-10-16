import { ethers } from "ethers";

export interface IBlockchainService {
  getProvider(rpcUrl: string): ethers.providers.JsonRpcProvider;
  getLogsForContract(
    contractAddress: string,
    fromBlock: number,
    toBlock: number,
    rpcUrl: string
  ): Promise<ethers.providers.Log[]>;
  getCurrentBlockNumber(rpcUrl: string): Promise<bigint>;
}
