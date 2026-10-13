const { app, config } = require('./app');
const { getStore } = require('./storage');
const { loadNodemailer } = require('./auth');

function assertProductionSecrets() {
  if (!config.isAzure) return;
  if (config.jwtSecret === 'vector-secret-key-change-in-production') {
    throw new Error('JWT-SECRET is missing from Key Vault. See key-vault-secrets.env.example.');
  }
  if (config.adminJwtSecret === 'admin-secret-key-change-in-production') {
    throw new Error('ADMIN-JWT-SECRET is missing from Key Vault. See key-vault-secrets.env.example.');
  }
  if (config.adminPassword === 'admin123') {
    throw new Error('ADMIN-PASSWORD is still the localhost default. Set it in Key Vault before hosting.');
  }
  if ((config.storageDriver === 'postgres' || config.storageDriver === 'postgresql') && !config.postgresConfigured) {
    throw new Error('Postgres secrets are missing from Key Vault (host/user/password or connection string).');
  }
}

function startServer() {
  assertProductionSecrets();
  const store = getStore();
  const server = app.listen(config.port, async () => {
    try {
      if (typeof store.initialize === 'function') {
        await store.initialize();
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      process.exit(1);
    }
    console.log('');
    console.log('========================================');
    console.log(`  VECTOR BUILD ${config.buildId}`);
    console.log('  If this box is missing, an OLD node process is running.');
    console.log(`  Open:  http://localhost:${config.port}/`);
    console.log(`  Admin: http://localhost:${config.port}/admin`);
    console.log(`  Health: http://localhost:${config.port}/health`);
    console.log(`  Storage: ${store.driver} -> ${store.location()}`);
    if (config.keyVaultUri) {
      console.log(`  Key Vault: ${config.keyVaultUri}`);
    }
    if (!loadNodemailer() || !config.smtpConfigured) {
      console.log('  OTP will show on screen (SMTP not configured).');
    }
    console.log('========================================');
    console.log('');
  });
  server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE') {
      console.error(`Port ${config.port} is already in use — stop the old process, then start again.`);
      process.exit(1);
    }
    throw error;
  });
  return server;
}

module.exports = { startServer, assertProductionSecrets };
