import { BlockchainService } from "./services/BlockchainService";
import { ContractService } from "./services/ContractService";
import { IndexerService } from "./services/IndexerService";
import { MongoService } from "./services/MongoService";
import { RedisService } from "./services/RedisService";

async function main() {
  const blockchainService = new BlockchainService();
  const redisService = new RedisService();
  const mongoService = new MongoService();
  const contractService = new ContractService(blockchainService, redisService);
  const indexerService = new IndexerService(
    blockchainService,
    contractService,
    mongoService
  );

  async function gracefulShutdown(signal: string) {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    try {
      await indexerService.stop();
      await redisService.disconnect();
      console.log("Graceful shutdown completed.");
      process.exit(0);
    } catch (error) {
      console.error("Error during graceful shutdown:", error);
      process.exit(1);
    }
  }

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  try {
    await indexerService.run();
  } catch (error) {
    console.error("Error in indexer service:", error);
    await gracefulShutdown("ERROR");
  }
}

main().catch((error) => {
  console.error("Unhandled error in main function:", error);
  process.exit(1);
});
