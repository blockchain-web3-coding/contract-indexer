export class BlockchainError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "BlockchainError";
  }
}

export class ContractError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "ContractError";
  }
}
