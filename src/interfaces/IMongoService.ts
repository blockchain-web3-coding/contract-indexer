export interface IMongoService {
  connect(): Promise<void>;
  getLastProcessedBlock(contractName: string): Promise<bigint | null>;
  updateLastProcessedBlock(
    contractName: string,
    blockNumber: bigint
  ): Promise<void>;
  close(): Promise<void>;
}
