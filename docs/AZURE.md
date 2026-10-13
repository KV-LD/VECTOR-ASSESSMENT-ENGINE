# Azure Web App + Postgres + Key Vault

Localhost still uses Excel. Azure uses **Postgres**, with secrets in **Key Vault**, fetched by the Web App **Managed Identity**.

Do not paste passwords into chat. Create secrets in the Azure Portal. Follow [KEY-VAULT.md](KEY-VAULT.md).

## Architecture

```
Browser → Azure Web App (Node)
              │
              │ Application setting: KEY_VAULT_URI
              │ Managed Identity (system assigned)
              ▼
         Azure Key Vault  →  JWT, admin, SMTP, Postgres
              │
              ▼
         Azure Database for PostgreSQL
```

Startup command: `node src/index.js`  
Health check: `/health`  
Windows App Service: `web.config` already points at `src/index.js`.

## Application settings

Only this secret-location setting is required:

| Name | Value |
| --- | --- |
| `KEY_VAULT_URI` | `https://<vault>.vault.azure.net/` |

Optional non-secrets (safe in App Settings):

| Name | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `VECTOR_BUILD` | `V2.3` |

Azure sets `PORT` and `WEBSITE_SITE_NAME` itself.

## After deploy

The log should show:

```
Loaded N secrets from Key Vault using Managed Identity.
VECTOR BUILD V2.3
Storage: postgres -> <host>/<database>
Key Vault: https://<vault>.vault.azure.net/
```

`/health` returns `{ "ok": true, "storage": "postgres", "keyVault": true }`.
