export interface IIndexerService {
  initialize(): Promise<void>;
  run(): Promise<void>;
  stop(): Promise<void>;
}
