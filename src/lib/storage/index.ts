import type { OtpRecord, AttemptRecord } from '../types';
import { ExcelStorage } from './excelStorage';
import { PostgresStorage } from './postgresStorage';
import { config } from '../config';

export interface StorageProvider {
  // OTP operations
  saveOtp(record: OtpRecord): Promise<void>;
  getActiveOtpByEmail(email: string): Promise<OtpRecord | null>;
  updateOtp(email: string, updates: Partial<OtpRecord>): Promise<void>;

  // Attempt operations
  saveAttempt(attempt: AttemptRecord): Promise<void>;
  getAttemptsByEmail(email: string): Promise<AttemptRecord[]>;

  // User tracking
  touchUser?(email: string): Promise<void>;
}

export function getStorageProvider(): StorageProvider {
  if (config.storageProvider === 'excel') {
    return new ExcelStorage();
  }
  if (config.storageProvider === 'postgres') {
    return new PostgresStorage();
  }
  throw new Error(`Unknown storage provider: ${config.storageProvider}`);
}
