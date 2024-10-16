import { BlockchainService } from "./BlockchainService";
import { ContractService } from "./ContractService";
import { RedisService } from "./RedisService";
import { MongoService } from "./MongoService";
import { ContractRegistry } from "../contracts/ContractRegistry";
import { ContractConfig } from "../config/config";

interface IndexerContract {
  name: string;
  config: ContractConfig;
}

export class Indexer {
  private blockchainService: BlockchainService;
  private redisService: RedisService;
  private contractService: ContractService;
  private mongoService: MongoService;
  private isCatchingUp: boolean = false;

  constructor() {
    this.blockchainService = new BlockchainService();
    this.redisService = new RedisService();
    this.mongoService = new MongoService();
    this.contractService = new ContractService(
      this.blockchainService,
      this.redisService
    );
  }

  async initialize() {
    await this.mongoService.connect();
    const contracts = ContractRegistry.getAllContracts();
    for (const contract of contracts) {
      const lastProcessedBlock =
        (await this.mongoService.getLastProcessedBlock(contract.name)) ??
        BigInt(contract.config.startBlock);
      console.log(
        `Indexer initialized for ${contract.name}. Starting from block ${Number(
          lastProcessedBlock
        )}`
      );
    }
  }

  async catchUpBlocks(
    contract: IndexerContract,
    lastProcessedBlock: bigint,
    currentBlock: bigint
  ) {
    const batchSize = BigInt(100);
    this.isCatchingUp = true;

    for (
      let fromBlock = lastProcessedBlock + BigInt(1);
      fromBlock <= currentBlock;
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

      console.log(
        `[Indexer] Processed blocks ${fromBlock} to ${toBlock} for ${contract.name}. Found ${logsCount} logs.`
      );

      await this.mongoService.updateLastProcessedBlock(contract.name, toBlock);
    }

    this.isCatchingUp = false;
    console.log(`[Indexer] Catch-up complete for ${contract.name}`);
  }

  async processNewBlocks() {
    const contracts = ContractRegistry.getAllContracts();
    for (const contract of contracts) {
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
          this.catchUpBlocks(contract, lastProcessedBlock, currentBlock);
        } else if (!this.isCatchingUp) {
          const logsCount = await this.contractService.indexContractLogs(
            contract.name,
            contract.config,
            Number(lastProcessedBlock + BigInt(1)),
            Number(currentBlock)
          );
          console.log(
            `[Indexer] Processed blocks ${
              lastProcessedBlock + BigInt(1)
            } to ${currentBlock} for ${contract.name}. Found ${logsCount} logs.`
          );
          await this.mongoService.updateLastProcessedBlock(
            contract.name,
            currentBlock
          );
        }
      } else {
        console.log(`[Indexer] No new blocks to process for ${contract.name}.`);
      }
    }
  }

  async run() {
    await this.initialize();

    while (true) {
      try {
        await this.processNewBlocks();
      } catch (error) {
        console.error("Error processing blocks:", error);
      }
      console.log("interval");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async stop() {
    await this.mongoService.close();
  }
}
