// Maps Key Vault secret names (hyphens) to process.env keys (underscores).
// The Web App only needs KEY_VAULT_URI in Application settings.
// Managed Identity fetches every secret below at startup.

const SECRET_MAP = {
  'STORAGE-DRIVER': 'STORAGE_DRIVER',
  'POSTGRES-CONNECTION-STRING': 'POSTGRES_CONNECTION_STRING',
  'POSTGRES-HOST': 'POSTGRES_HOST',
  'POSTGRES-PORT': 'POSTGRES_PORT',
  'POSTGRES-DB': 'POSTGRES_DB',
  'POSTGRES-USER': 'POSTGRES_USER',
  'POSTGRES-PASSWORD': 'POSTGRES_PASSWORD',
  'POSTGRES-SSL': 'POSTGRES_SSL',
  'JWT-SECRET': 'JWT_SECRET',
  'ADMIN-JWT-SECRET': 'ADMIN_JWT_SECRET',
  'ADMIN-EMAIL': 'ADMIN_EMAIL',
  'ADMIN-PASSWORD': 'ADMIN_PASSWORD',
  'SMTP-HOST': 'SMTP_HOST',
  'SMTP-PORT': 'SMTP_PORT',
  'SMTP-SECURE': 'SMTP_SECURE',
  'SMTP-USER': 'SMTP_USER',
  'SMTP-PASS': 'SMTP_PASS',
  'SMTP-FROM': 'SMTP_FROM',
  'VECTOR-BUILD': 'VECTOR_BUILD'
};

const OPTIONAL_SECRETS = new Set([
  'STORAGE-DRIVER',
  'POSTGRES-CONNECTION-STRING',
  'POSTGRES-HOST',
  'POSTGRES-PORT',
  'POSTGRES-DB',
  'POSTGRES-USER',
  'POSTGRES-PASSWORD',
  'POSTGRES-SSL',
  'SMTP-HOST',
  'SMTP-PORT',
  'SMTP-SECURE',
  'SMTP-USER',
  'SMTP-PASS',
  'SMTP-FROM',
  'VECTOR-BUILD'
]);

function vaultUri() {
  return String(process.env.KEY_VAULT_URI || process.env.AZURE_KEY_VAULT_URI || '').trim();
}

function loadAzureSdk() {
  try {
    return {
      DefaultAzureCredential: require('@azure/identity').DefaultAzureCredential,
      SecretClient: require('@azure/keyvault-secrets').SecretClient
    };
  } catch (error) {
    return null;
  }
}

function reloadAppConfig() {
  try {
    const config = require('./config');
    if (typeof config.reload === 'function') config.reload();
  } catch (error) {
    /* config not loaded yet */
  }
  try {
    const auth = require('./auth');
    if (typeof auth.refreshAdminCredentials === 'function') auth.refreshAdminCredentials();
  } catch (error) {
    /* auth not loaded yet */
  }
}

async function loadSecrets() {
  const uri = vaultUri();
  if (!uri) {
    return { loaded: false, source: 'env', fetched: 0 };
  }

  const sdk = loadAzureSdk();
  if (!sdk) {
    throw new Error(
      'KEY_VAULT_URI is set but Azure SDK packages are missing. Run: npm install @azure/identity @azure/keyvault-secrets'
    );
  }

  const client = new sdk.SecretClient(uri.replace(/\/+$/, ''), new sdk.DefaultAzureCredential());
  const missing = [];
  let fetched = 0;

  for (const [secretName, envName] of Object.entries(SECRET_MAP)) {
    if (process.env[envName]) continue;
    try {
      const secret = await client.getSecret(secretName);
      if (secret && secret.value != null && secret.value !== '') {
        process.env[envName] = secret.value;
        fetched += 1;
      } else if (!OPTIONAL_SECRETS.has(secretName)) {
        missing.push(secretName);
      }
    } catch (error) {
      if (OPTIONAL_SECRETS.has(secretName)) continue;
      missing.push(secretName);
    }
  }

  reloadAppConfig();

  if (missing.length) {
    throw new Error(
      'Key Vault is missing required secrets: ' + missing.join(', ') + '. See key-vault-secrets.env.example.'
    );
  }

  return { loaded: true, source: 'keyvault', fetched, uri };
}

module.exports = { SECRET_MAP, OPTIONAL_SECRETS, vaultUri, loadSecrets };
