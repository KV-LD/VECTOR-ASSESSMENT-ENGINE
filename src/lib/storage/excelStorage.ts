import { StorageProvider } from './index';

export class ExcelStorage implements StorageProvider {
  async saveAttempt(attempt: any): Promise<void> {}
  async getAttemptsByEmail(email: string): Promise<any[]> {
    return [];
  }
}
