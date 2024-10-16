# Blockchain Indexer

This project is a blockchain indexer that allows you to index and track events from multiple smart contracts across different blockchain networks.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

### Running with Docker

1. Clone the repository:

   ```bash
   //TODO: add repo link to clone <repo link>
   cd blockchain-indexer
   ```

2. Build and run the Docker containers:

   ```bash
   docker-compose up --build
   ```

   This command will build the Docker image and start the containers defined in the `docker-compose.yml` file.

3. The indexer should now be running and processing blocks for each contract in separate containers. You can view the logs in the console.

### Scaling

To process different contracts on separate instances:

1. Modify the `docker-compose.yml` file to add or remove services for each contract you want to process.

2. For each service, set the `CONTRACTS_TO_PROCESS` environment variable to the name of the contract you want that instance to process.

3. Run `docker-compose up --scale indexer-contract1=1 indexer-contract2=1` to start one instance for each contract.

### Adding New Contracts

To add a new contract to the indexer:

1. Open `src/config/config.ts`

2. Add a new entry to the `allContracts` object:

   ```typescript
   const allContracts = {
     // ... existing contracts
     newContract: {
       address: "0x1234567890123456789012345678901234567890",
       chainRpcUrl: "https://your-rpc-url.com/",
       startBlock: 1000000, // The block to start indexing from
     },
   };
   ```

3. Create a new file in `src/contracts/` directory for your contract's ABI:

   ```typescript
   // src/contracts/NewContract.ts
   export const NewContractABI = [
     // Your contract ABI here
   ];
   ```

4. In `src/contracts/ContractRegistry.ts`, import and register your new contract:

   ```typescript
   import { NewContractABI } from "./NewContract";

   // The registration is now done automatically for all contracts in the config
   ```

5. Update the `docker-compose.yml` file to add a new service for the new contract if you want to process it separately.

6. Rebuild and restart the Docker containers:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

## Configuration

You can modify the following environment variables in the `docker-compose.yml` file:

- `REDIS_URL`: The URL for your Redis instance
- `MONGO_URL`: The URL for your MongoDB instance
- `MONGO_DB_NAME`: The name of the MongoDB database to use
- `CONTRACTS_TO_PROCESS`: Comma-separated list of contract names to process in each instance

## Troubleshooting

If you encounter any issues:

1. Check the console logs for any error messages.
2. Ensure all the required environment variables are set correctly.
3. Verify that the contract addresses and RPC URLs are correct and accessible.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
