import { StorageProvider } from './index';

export class PostgresStorage implements StorageProvider {
  async saveAttempt(attempt: any): Promise<void> {
    throw new Error('PostgreSQL storage not yet implemented');
  }
  async getAttemptsByEmail(email: string): Promise<any[]> {
    throw new Error('PostgreSQL storage not yet implemented');
  }
}
