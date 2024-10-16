export interface IRedisService {
  addToQueue(queueName: string, data: string): Promise<void>;
  disconnect(): Promise<void>;
}
