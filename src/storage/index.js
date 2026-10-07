const config = require('../config');
const excelStore = require('./excel');
const azureSqlStore = require('./azure-sql');

function getStore() {
  if (config.storageDriver === 'azure-sql' || config.storageDriver === 'sql') {
    return azureSqlStore;
  }
  return excelStore;
}

module.exports = { getStore, excelStore, azureSqlStore };
