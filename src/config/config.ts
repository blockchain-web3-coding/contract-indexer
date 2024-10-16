import dotenv from "dotenv";

dotenv.config();

export interface ContractConfig {
  address: string;
  chainRpcUrl: string;
  startBlock: number;
}

const allContracts = {
  contract1: {
    address: "0x0000000000000000000000000000000000000000",
    chainRpcUrl: "<chainRpcUrl>",
    startBlock: 0,
  },
  contract2: {
    address: "0x0000000000000000000000000000000000000000",
    chainRpcUrl: "<chainRpcUrl>",
    startBlock: 0,
  },
  // Add more contracts here
} as Record<string, ContractConfig>;

const contractsToProcess = process.env.CONTRACTS_TO_PROCESS
  ? process.env.CONTRACTS_TO_PROCESS.split(",")
  : Object.keys(allContracts);

export const config = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017",
  mongoDbName: process.env.MONGO_DB_NAME || "blockchain_indexer",
  contracts: Object.fromEntries(
    contractsToProcess.map((name) => [name, allContracts[name]])
  ) as Record<string, ContractConfig>,
};
