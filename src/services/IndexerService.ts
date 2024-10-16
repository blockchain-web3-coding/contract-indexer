import { IIndexerService } from "../interfaces/IIndexerService";
import { IBlockchainService } from "../interfaces/IBlockchainService";
import { IContractService } from "../interfaces/IContractService";
import { IMongoService } from "../interfaces/IMongoService";
import { ContractRegistry } from "../contracts/ContractRegistry";
import { IndexerContract } from "../types";
import { BlockchainError, ContractError } from "../utils/errors";

export class IndexerService implements IIndexerService {
  private isCatchingUp: boolean = false;
  private isShuttingDown: boolean = false;

  constructor(
    private blockchainService: IBlockchainService,
    private contractService: IContractService,
    private mongoService: IMongoService
  ) {}

  async initialize(): Promise<void> {
    await this.mongoService.connect();
    const contracts = ContractRegistry.getAllContracts();
    for (const contract of contracts) {
      const lastProcessedBlock =
        (await this.mongoService.getLastProcessedBlock(contract.name)) ??
        BigInt(contract.config.startBlock);
      const startBlock = BigInt(contract.config.startBlock);
      console.log(
        `Indexer initialized for ${
          contract.name
        }. Starting from block ${Math.max(
          Number(lastProcessedBlock),
          Number(startBlock)
        )}`
      );
    }
  }

  async run(): Promise<void> {
    await this.initialize();

    while (!this.isShuttingDown) {
      try {
        await this.processNewBlocks();
      } catch (error) {
        console.error("Error processing blocks:", error);
      }
      if (!this.isShuttingDown) {
        console.log("interval");
        // Wait for 2 seconds before the next iteration
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  async stop(): Promise<void> {
    console.log("Initiating graceful shutdown...");
    this.isShuttingDown = true;

    // Wait for any ongoing processing to complete
    while (this.isCatchingUp) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await this.mongoService.close();
    console.log("Indexer stopped");
  }

  private async processNewBlocks(): Promise<void> {
    const contracts = ContractRegistry.getAllContracts();
    for (const contract of contracts) {
      try {
        const currentBlock = await this.blockchainService.getCurrentBlockNumber(
          contract.config.chainRpcUrl
        );
        const lastProcessedBlock =
          (await this.mongoService.getLastProcessedBlock(contract.name)) ??
          BigInt(contract.config.startBlock);

        if (currentBlock > lastProcessedBlock) {
          if (
            currentBlock - lastProcessedBlock > BigInt(100) &&
            !this.isCatchingUp
          ) {
            await this.catchUpBlocks(
              contract,
              lastProcessedBlock,
              currentBlock
            );
          } else if (!this.isCatchingUp) {
            const logsCount = await this.contractService.indexContractLogs(
              contract.name,
              contract.config,
              Number(lastProcessedBlock + BigInt(1)),
              Number(currentBlock)
            );
            await this.mongoService.updateLastProcessedBlock(
              contract.name,
              currentBlock
            );
            console.log(
              `[Indexer] Processed ${logsCount} logs for ${contract.name}`
            );
          }
        } else {
          console.log(
            `[Indexer] No new blocks to process for ${contract.name}.`
          );
        }
      } catch (error) {
        if (error instanceof BlockchainError) {
          console.error(
            `[Indexer] Blockchain error for ${contract.name}: ${error.message}`
          );
        } else if (error instanceof ContractError) {
          console.error(
            `[Indexer] Contract error for ${contract.name}: ${error.message}`
          );
        } else {
          console.error(
            `[Indexer] Unexpected error for ${contract.name}: ${error}`
          );
        }
      }
    }
  }

  private async catchUpBlocks(
    contract: IndexerContract,
    lastProcessedBlock: bigint,
    currentBlock: bigint
  ): Promise<void> {
    const batchSize = BigInt(100);
    this.isCatchingUp = true;

    try {
      for (
        let fromBlock = lastProcessedBlock + BigInt(1);
        fromBlock <= currentBlock && !this.isShuttingDown;
        fromBlock += batchSize
      ) {
        const toBlock =
          fromBlock + batchSize - BigInt(1) > currentBlock
            ? currentBlock
            : fromBlock + batchSize - BigInt(1);

        const logsCount = await this.contractService.indexContractLogs(
          contract.name,
          contract.config,
          Number(fromBlock),
          Number(toBlock)
        );

        await this.mongoService.updateLastProcessedBlock(
          contract.name,
          toBlock
        );

        if (this.isShuttingDown) {
          console.log(`Gracefully stopping catch-up for ${contract.name}`);
          break;
        }
      }
    } finally {
      this.isCatchingUp = false;
    }

    if (!this.isShuttingDown) {
      console.log(`[Indexer] Catch-up complete for ${contract.name}`);
    }
  }
}
