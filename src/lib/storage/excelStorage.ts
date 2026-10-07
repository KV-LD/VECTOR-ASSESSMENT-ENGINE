'use client';

import * as XLSX from 'xlsx';
import type { StorageProvider } from './index';
import type { OtpRecord, AttemptRecord } from '../types';
import { config } from '../config';

export class ExcelStorage implements StorageProvider {
  private filePath: string;

  constructor() {
    this.filePath = config.excelFilePath;
  }

  private async getWorkbook() {
    try {
      if (typeof window === 'undefined') {
        // Server-side: use Node.js file system
        const fs = await import('fs').then(m => m.promises);
        const path = await import('path');
        const fullPath = path.join(process.cwd(), 'public', this.filePath);

        try {
          const buffer = await fs.readFile(fullPath);
          return XLSX.read(buffer, { type: 'buffer' });
        } catch {
          return this.createEmptyWorkbook();
        }
      } else {
        // Client-side: use localStorage as fallback
        return this.createEmptyWorkbook();
      }
    } catch {
      return this.createEmptyWorkbook();
    }
  }

  private createEmptyWorkbook() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['email', 'code', 'created_at', 'expires_at', 'attempts', 'consumed']]), 'otps');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['id', 'email', 'role', 'attempted_at', 'level_V', 'level_E', 'level_C', 'level_T', 'level_O', 'level_R', 'class', 'dominant', 'signature', 'floor_check_applied', 'next_move_dimension', 'next_move_technique', 'answers_json']]), 'attempts');
    return wb;
  }

  async saveOtp(record: OtpRecord): Promise<void> {
    const wb = await this.getWorkbook();
    const otpsSheet = wb.Sheets['otps'] || XLSX.utils.aoa_to_sheet([['email', 'code', 'created_at', 'expires_at', 'attempts', 'consumed']]);
    const otpsData = XLSX.utils.sheet_to_json(otpsSheet);

    const existing = otpsData.findIndex((r: any) => r.email === record.email);
    if (existing >= 0) {
      otpsData[existing] = record;
    } else {
      otpsData.push(record);
    }

    wb.Sheets['otps'] = XLSX.utils.json_to_sheet(otpsData);
  }

  async getActiveOtpByEmail(email: string): Promise<OtpRecord | null> {
    const wb = await this.getWorkbook();
    const otpsSheet = wb.Sheets['otps'];
    if (!otpsSheet) return null;

    const otpsData = XLSX.utils.sheet_to_json(otpsSheet) as OtpRecord[];
    const record = otpsData.find(r => r.email === email && !r.consumed);

    if (record && new Date(record.expires_at) > new Date()) {
      return record;
    }
    return null;
  }

  async updateOtp(email: string, updates: Partial<OtpRecord>): Promise<void> {
    const wb = await this.getWorkbook();
    const otpsSheet = wb.Sheets['otps'];
    if (!otpsSheet) return;

    const otpsData = XLSX.utils.sheet_to_json(otpsSheet);
    const idx = otpsData.findIndex((r: any) => r.email === email);
    if (idx >= 0) {
      otpsData[idx] = { ...otpsData[idx], ...updates };
      wb.Sheets['otps'] = XLSX.utils.json_to_sheet(otpsData);
    }
  }

  async saveAttempt(attempt: AttemptRecord): Promise<void> {
    const wb = await this.getWorkbook();
    const attemptsSheet = wb.Sheets['attempts'] || XLSX.utils.aoa_to_sheet([['id', 'email', 'role', 'attempted_at', 'level_V', 'level_E', 'level_C', 'level_T', 'level_O', 'level_R', 'class', 'dominant', 'signature', 'floor_check_applied', 'next_move_dimension', 'next_move_technique', 'answers_json']]);
    const attemptsData = XLSX.utils.sheet_to_json(attemptsSheet);

    attemptsData.push(attempt);
    wb.Sheets['attempts'] = XLSX.utils.json_to_sheet(attemptsData);
  }

  async getAttemptsByEmail(email: string): Promise<AttemptRecord[]> {
    const wb = await this.getWorkbook();
    const attemptsSheet = wb.Sheets['attempts'];
    if (!attemptsSheet) return [];

    const attemptsData = XLSX.utils.sheet_to_json(attemptsSheet) as AttemptRecord[];
    return attemptsData.filter(a => a.email === email).sort((a, b) =>
      new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime()
    );
  }
}
