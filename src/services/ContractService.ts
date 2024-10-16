import { ethers } from "ethers";
import { IBlockchainService } from "../interfaces/IBlockchainService";
import { IRedisService } from "../interfaces/IRedisService";
import { ContractConfig } from "../config/config";
import { IContractService } from "../interfaces/IContractService";
import { convertBigNumberToString } from "../utils/bigNumberUtils";
import { ContractRegistry } from "../contracts/ContractRegistry";
import { ContractError, BlockchainError } from "../utils/errors";

export class ContractService implements IContractService {
  constructor(
    private blockchainService: IBlockchainService,
    private redisService: IRedisService
  ) {}

  private decodeLogs(
    logs: ethers.providers.Log[],
    contractInterface: ethers.utils.Interface
  ) {
    return logs
      .map((log) => {
        try {
          const parsedLog = contractInterface.parseLog(log);
          const convertedArgs = convertBigNumberToString(parsedLog.args);

          return {
            event: parsedLog.name,
            args: convertedArgs,
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber.toString(),
            logIndex: log.logIndex.toString(),
          };
        } catch (error) {
          console.error(`[ContractService] Failed to decode log: ${error}`);
          return null;
        }
      })
      .filter(
        (decodedLog): decodedLog is NonNullable<typeof decodedLog> =>
          decodedLog !== null
      );
  }

  async indexContractLogs(
    contractName: string,
    contractConfig: ContractConfig,
    fromBlock: number,
    toBlock: number
  ): Promise<number> {
    try {
      console.log(
        `[ContractService] Fetching logs for ${contractName} from block ${fromBlock} to ${toBlock}`
      );
      const logs = await this.blockchainService.getLogsForContract(
        contractConfig.address,
        fromBlock,
        toBlock,
        contractConfig.chainRpcUrl
      );
      console.log(
        `[ContractService] Found ${logs.length} logs for ${contractName}`
      );

      const contractInfo = ContractRegistry.getContractInfo(contractName);
      const decodedLogs = this.decodeLogs(logs, contractInfo.interface);

      console.log(
        `[ContractService] Decoded ${decodedLogs.length} logs for ${contractName}`
      );

      for (const decodedLog of decodedLogs) {
        console.log(
          `[ContractService] Processing log: Event=${decodedLog.event}, Block=${decodedLog.blockNumber}, TxHash=${decodedLog.transactionHash}`
        );
        await this.redisService.addToQueue(
          contractInfo.queueName,
          JSON.stringify(decodedLog)
        );
      }

      return decodedLogs.length;
    } catch (error) {
      if (error instanceof BlockchainError) {
        throw new ContractError(
          `Failed to index logs for ${contractName}`,
          error
        );
      }
      throw error;
    }
  }
}
