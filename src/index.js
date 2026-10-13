const { loadSecrets } = require('./secrets');

async function boot() {
  try {
    const result = await loadSecrets();
    if (result.loaded) {
      console.log(`Loaded ${result.fetched} secrets from Key Vault using Managed Identity.`);
    }
  } catch (error) {
    console.error('Failed to load secrets from Key Vault:', error.message || error);
    process.exit(1);
  }
  const { startServer } = require('./server');
  return startServer();
}

if (require.main === module) {
  boot();
}

module.exports = { boot };
