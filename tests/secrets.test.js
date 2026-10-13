const { SECRET_MAP, OPTIONAL_SECRETS, vaultUri } = require('../src/secrets');
const { getStore } = require('../src/storage');
const config = require('../src/config');

describe('Key Vault secret map', () => {
  test('secret names are Key Vault safe and map to env vars', () => {
    Object.entries(SECRET_MAP).forEach(([vaultName, envName]) => {
      expect(vaultName).toMatch(/^[A-Z0-9-]+$/);
      expect(envName).toMatch(/^[A-Z0-9_]+$/);
    });
    expect(SECRET_MAP['JWT-SECRET']).toBe('JWT_SECRET');
    expect(SECRET_MAP['POSTGRES-PASSWORD']).toBe('POSTGRES_PASSWORD');
    expect(SECRET_MAP['SMTP-PASS']).toBe('SMTP_PASS');
    expect(OPTIONAL_SECRETS.has('SMTP-PASS')).toBe(true);
    expect(OPTIONAL_SECRETS.has('JWT-SECRET')).toBe(false);
  });

  test('does not treat Key Vault URI as a secret to fetch', () => {
    expect(SECRET_MAP['KEY-VAULT-URI']).toBeUndefined();
    expect(vaultUri()).toBe('');
  });
});

describe('storage driver', () => {
  test('localhost tests keep Excel', () => {
    expect(config.storageDriver).toBe('excel');
    expect(getStore().driver).toBe('excel');
  });
});
