const config = require('../config');
const excelStore = require('./excel');
const azureSqlStore = require('./azure-sql');
const postgresStore = require('./postgres');

function getStore() {
  const driver = String(config.storageDriver || '').toLowerCase();
  if (driver === 'postgres' || driver === 'postgresql' || driver === 'pg') {
    return postgresStore;
  }
  if (driver === 'azure-sql' || driver === 'sql') {
    return azureSqlStore;
  }
  return excelStore;
}

module.exports = { getStore, excelStore, azureSqlStore, postgresStore };
