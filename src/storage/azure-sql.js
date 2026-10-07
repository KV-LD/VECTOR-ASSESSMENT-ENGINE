const config = require('../config');

function notConfigured() {
  const error = new Error(
    'Azure SQL is not ready yet. Keep STORAGE_DRIVER=excel for localhost, then set STORAGE_DRIVER=azure-sql and AZURE_SQL_CONNECTION_STRING when credentials are available. See docs/AZURE.md.'
  );
  error.status = 501;
  return error;
}

function loadMssql() {
  try {
    return require('mssql');
  } catch (error) {
    return null;
  }
}

const azureSqlStore = {
  driver: 'azure-sql',
  location: () => 'azure-sql',

  async initialize() {
    if (!config.azureSqlConnectionString) {
      throw notConfigured();
    }
    const sql = loadMssql();
    if (!sql) {
      const error = new Error('Azure SQL driver is missing. Run: npm install mssql');
      error.status = 501;
      throw error;
    }
    // Connection and schema creation land here once credentials are provided.
    throw notConfigured();
  },

  async saveLogin() {
    throw notConfigured();
  },

  async saveResult() {
    throw notConfigured();
  },

  async listResults() {
    throw notConfigured();
  },

  async listUserAttempts() {
    throw notConfigured();
  },

  async exportWorkbook() {
    throw notConfigured();
  }
};

module.exports = azureSqlStore;
