import { IBlockchainService } from "../interfaces/IBlockchainService";
import { ethers } from "ethers";
import { BlockchainError } from "../utils/errors";

export class BlockchainService implements IBlockchainService {
  private providers: Map<string, ethers.providers.JsonRpcProvider> = new Map();

  getProvider(rpcUrl: string): ethers.providers.JsonRpcProvider {
    if (!this.providers.has(rpcUrl)) {
      this.providers.set(rpcUrl, new ethers.providers.JsonRpcProvider(rpcUrl));
    }
    return this.providers.get(rpcUrl)!;
  }

  private async runWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw new BlockchainError(
      `Operation failed after ${maxRetries} attempts`,
      lastError
    );
  }

  async getLogsForContract(
    contractAddress: string,
    fromBlock: number,
    toBlock: number,
    rpcUrl: string
  ): Promise<ethers.providers.Log[]> {
    return this.runWithRetry(async () => {
      const provider = this.getProvider(rpcUrl);
      return provider.getLogs({
        address: contractAddress,
        fromBlock,
        toBlock,
      });
    });
  }

  async getCurrentBlockNumber(rpcUrl: string): Promise<bigint> {
    return this.runWithRetry(async () => {
      const provider = this.getProvider(rpcUrl);
      const blockNumber = await provider.getBlockNumber();
      return BigInt(blockNumber);
    });
  }
}
