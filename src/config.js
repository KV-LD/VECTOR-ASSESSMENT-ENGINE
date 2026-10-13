const path = require('path');

const ROOT = path.join(__dirname, '..');

function env(name, fallback = '') {
  const value = process.env[name];
  return value == null || value === '' ? fallback : value;
}

function buildConfig() {
  const isAzure = Boolean(process.env.WEBSITE_SITE_NAME || process.env.WEBSITE_INSTANCE_ID);
  const nodeEnv = env('NODE_ENV', isAzure ? 'production' : 'development');
  const dataFile = env('VECTOR_DATA_FILE', path.join(ROOT, 'data', 'assessments.xlsx'));
  const next = {
    root: ROOT,
    publicDir: path.join(ROOT, 'public'),
    port: parseInt(env('PORT', '3000'), 10),
    nodeEnv,
    isAzure,
    buildId: env('VECTOR_BUILD', 'V2.3'),
    jwtSecret: env('JWT_SECRET', 'vector-secret-key-change-in-production'),
    adminJwtSecret: env('ADMIN_JWT_SECRET', 'admin-secret-key-change-in-production'),
    adminEmail: env('ADMIN_EMAIL', 'admin@ust.com'),
    adminPassword: env('ADMIN_PASSWORD', 'admin123'),
    storageDriver: env('STORAGE_DRIVER', isAzure ? 'postgres' : 'excel').toLowerCase(),
    dataFile,
    azureSqlConnectionString: env('AZURE_SQL_CONNECTION_STRING'),
    keyVaultUri: env('KEY_VAULT_URI', env('AZURE_KEY_VAULT_URI')),
    postgres: {
      connectionString: env('POSTGRES_CONNECTION_STRING', env('DATABASE_URL')),
      host: env('POSTGRES_HOST'),
      port: parseInt(env('POSTGRES_PORT', '5432'), 10),
      database: env('POSTGRES_DB', env('POSTGRES_DATABASE', 'vector')),
      user: env('POSTGRES_USER'),
      password: env('POSTGRES_PASSWORD'),
      ssl: env('POSTGRES_SSL', 'require')
    },
    smtp: {
      host: env('SMTP_HOST'),
      port: parseInt(env('SMTP_PORT', '587'), 10),
      secure: env('SMTP_SECURE') === '1',
      user: env('SMTP_USER'),
      pass: env('SMTP_PASS'),
      from: env('SMTP_FROM')
    }
  };
  next.jsonlFile = dataFile.replace(/\.xlsx$/i, '.jsonl');
  next.smtpConfigured = Boolean(next.smtp.host && next.smtp.user && next.smtp.pass);
  next.postgresConfigured = Boolean(
    next.postgres.connectionString
    || (next.postgres.host && next.postgres.user && next.postgres.password)
  );
  return next;
}

const config = buildConfig();

function reload() {
  const next = buildConfig();
  Object.keys(config).forEach((key) => {
    if (typeof config[key] !== 'function') delete config[key];
  });
  Object.assign(config, next);
  return config;
}

config.reload = reload;

module.exports = config;
