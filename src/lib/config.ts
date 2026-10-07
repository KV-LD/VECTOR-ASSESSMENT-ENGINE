export const config = {
  appMode: process.env.APP_MODE || 'dev',
  storageProvider: process.env.STORAGE_PROVIDER || 'excel',
  excelFilePath: process.env.EXCEL_FILE_PATH || 'data/assessments.xlsx',
};
