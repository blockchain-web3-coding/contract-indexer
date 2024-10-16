import { MongoClient, Db } from "mongodb";
import { config } from "../config/config";

export class MongoService {
  private client: MongoClient;
  private db!: Db;

  constructor() {
    this.client = new MongoClient(config.mongoUrl);
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db(config.mongoDbName);
    console.log("Connected to MongoDB");
  }

  async getLastProcessedBlock(contractName: string): Promise<bigint | null> {
    const collection = this.db.collection("lastProcessedBlocks");
    const result = await collection.findOne({ contractName });
    return result?.blockNumber ? BigInt(result.blockNumber) : null;
  }

  async updateLastProcessedBlock(
    contractName: string,
    blockNumber: bigint
  ): Promise<void> {
    const collection = this.db.collection("lastProcessedBlocks");
    await collection.updateOne(
      { contractName },
      { $set: { blockNumber: blockNumber.toString() } },
      { upsert: true }
    );
  }

  async close() {
    await this.client.close();
    console.log("Disconnected from MongoDB");
  }
}
