export const config = {
  appMode: (process.env.APP_MODE || 'dev') as 'dev' | 'prod',
  storageProvider: (process.env.STORAGE_PROVIDER || 'excel') as 'excel' | 'postgres',
  excelFilePath: process.env.EXCEL_FILE_PATH || 'data/assessments.xlsx',
  otpMode: (process.env.OTP_MODE || 'dev') as 'dev' | 'smtp',
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
  otpResendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN || '30'),
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5'),
} as const;

export type Config = typeof config;
