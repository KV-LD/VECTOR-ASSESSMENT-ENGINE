const { app, config } = require('./app');
const { getStore } = require('./storage');
const { loadNodemailer } = require('./auth');

function startServer() {
  const store = getStore();
  const server = app.listen(config.port, async () => {
    try {
      if (store.driver === 'excel') {
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

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
