import type { StorageProvider } from './index';
import type { OtpRecord, AttemptRecord } from '../types';

/**
 * PostgreSQL storage provider (stub for future implementation)
 * Will be implemented when migrating to Azure WebApp + Postgres
 */
export class PostgresStorage implements StorageProvider {
  async saveOtp(record: OtpRecord): Promise<void> {
    throw new Error(
      'PostgreSQL storage not yet implemented in prototype. Use STORAGE_PROVIDER=excel'
    );
  }

  async getActiveOtpByEmail(email: string): Promise<OtpRecord | null> {
    throw new Error('PostgreSQL storage not yet implemented');
  }

  async updateOtp(email: string, updates: Partial<OtpRecord>): Promise<void> {
    throw new Error('PostgreSQL storage not yet implemented');
  }

  async saveAttempt(attempt: AttemptRecord): Promise<void> {
    throw new Error('PostgreSQL storage not yet implemented');
  }

  async getAttemptsByEmail(email: string): Promise<AttemptRecord[]> {
    throw new Error('PostgreSQL storage not yet implemented');
  }
}
