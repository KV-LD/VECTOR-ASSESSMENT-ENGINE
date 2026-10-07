const path = require('path');

const ROOT = path.join(__dirname, '..');

function env(name, fallback = '') {
  const value = process.env[name];
  return value == null || value === '' ? fallback : value;
}

const isAzure = Boolean(process.env.WEBSITE_SITE_NAME || process.env.WEBSITE_INSTANCE_ID);
const nodeEnv = env('NODE_ENV', isAzure ? 'production' : 'development');

const config = {
  root: ROOT,
  publicDir: path.join(ROOT, 'public'),
  port: parseInt(env('PORT', '3000'), 10),
  nodeEnv,
  isAzure,
  buildId: env('VECTOR_BUILD', 'V2'),
  jwtSecret: env('JWT_SECRET', 'vector-secret-key-change-in-production'),
  adminJwtSecret: env('ADMIN_JWT_SECRET', 'admin-secret-key-change-in-production'),
  adminEmail: env('ADMIN_EMAIL', 'admin@ust.com'),
  adminPassword: env('ADMIN_PASSWORD', 'admin123'),
  storageDriver: env('STORAGE_DRIVER', 'excel').toLowerCase(),
  dataFile: env('VECTOR_DATA_FILE', path.join(ROOT, 'data', 'assessments.xlsx')),
  azureSqlConnectionString: env('AZURE_SQL_CONNECTION_STRING'),
  smtp: {
    host: env('SMTP_HOST'),
    port: parseInt(env('SMTP_PORT', '587'), 10),
    secure: env('SMTP_SECURE') === '1',
    user: env('SMTP_USER'),
    pass: env('SMTP_PASS'),
    from: env('SMTP_FROM')
  }
};

config.jsonlFile = config.dataFile.replace(/\.xlsx$/i, '.jsonl');
config.smtpConfigured = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);

module.exports = config;
