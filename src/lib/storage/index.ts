export interface StorageProvider {
  saveAttempt(attempt: any): Promise<void>;
  getAttemptsByEmail(email: string): Promise<any[]>;
}

export function getStorageProvider(): StorageProvider {
  return {} as StorageProvider;
}
