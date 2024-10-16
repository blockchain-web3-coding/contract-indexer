import { createClient, RedisClientType } from "redis";
import { config } from "../config/config";

export class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({ url: config.redisUrl });
    this.client.connect();
  }

  async addToQueue(queueName: string, data: string): Promise<void> {
    await this.client.lPush(queueName, data);
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}
