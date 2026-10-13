# Put VECTOR secrets in Azure Key Vault (Portal)

Do not paste passwords into chat, Git, or Application settings. Create each secret in the **Azure Portal Key Vault** UI. The Web App reads them with Managed Identity.

The only Application setting on the Web App is:

```
KEY_VAULT_URI=https://<your-vault-name>.vault.azure.net/
```

Secret **names** must match the table below exactly (hyphens, capital letters).

## 1. Enable Managed Identity on the Web App

1. Azure Portal → your Web App → **Identity**
2. **System assigned** → **On** → Save

## 2. Let that identity read the vault

**If the vault uses RBAC (recommended)**

1. Key Vault → **Access control (IAM)** → **Add role assignment**
2. Role: **Key Vault Secrets User**
3. Assign access to: **Managed identity**
4. Select your Web App → Review + assign

**If the vault uses Access policies**

1. Key Vault → **Access policies** → Create
2. Secret permissions: **Get**, **List**
3. Principal: your Web App's system identity

## 3. Create secrets in the Portal (no PowerShell)

1. Azure Portal → **Key Vault** → your vault
2. Left menu → **Objects** → **Secrets**
3. **Generate/Import**
4. Upload options: **Manual**
5. **Name**: copy from the **Name** column below (do not add extra spaces)
6. **Secret value**: paste the real value only in this Portal box
7. Enabled: **Yes** → **Create**
8. Repeat for each row you need

### Required

| Name | What to put in Secret value |
| --- | --- |
| `STORAGE-DRIVER` | `postgres` |
| `JWT-SECRET` | a long random string (32+ characters). Create one yourself; do not reuse the admin password |
| `ADMIN-JWT-SECRET` | a different long random string |
| `ADMIN-EMAIL` | the email you will use at `/admin` |
| `ADMIN-PASSWORD` | the password you will use at `/admin` |

### Postgres — use either the connection string or the host fields

**Option A (simplest if you already have a URL)**

| Name | What to put in Secret value |
| --- | --- |
| `POSTGRES-CONNECTION-STRING` | your full Postgres URL, including user, password, host, database, and `sslmode=require` |

**Option B (separate fields)**

Skip `POSTGRES-CONNECTION-STRING` if you use this set.

| Name | What to put in Secret value |
| --- | --- |
| `POSTGRES-HOST` | Postgres server host |
| `POSTGRES-PORT` | `5432` unless your server uses another port |
| `POSTGRES-DB` | database name |
| `POSTGRES-USER` | database user |
| `POSTGRES-PASSWORD` | database password |
| `POSTGRES-SSL` | `require` |

### SMTP (OTP email)

| Name | What to put in Secret value |
| --- | --- |
| `SMTP-HOST` | SMTP host |
| `SMTP-PORT` | `587` or `465` |
| `SMTP-SECURE` | `0` for port 587, `1` for port 465 |
| `SMTP-USER` | SMTP username |
| `SMTP-PASS` | SMTP password |
| `SMTP-FROM` | From address (optional if it is the same as `SMTP-USER`) |

### Optional

| Name | What to put in Secret value |
| --- | --- |
| `VECTOR-BUILD` | `V2.3` |

Do not create a secret named `KEY_VAULT_URI`. That value belongs only in Web App Application settings.

## 4. Application settings on the Web App

Web App → **Settings** → **Environment variables** (or **Configuration** → **Application settings**) → New:

| Name | Value |
| --- | --- |
| `KEY_VAULT_URI` | `https://YOUR-VAULT-NAME.vault.azure.net/` |

Do not put Postgres or SMTP passwords here. Restart the Web App after saving. Azure already sets `PORT`.

## 5. Postgres network

On Azure Database for PostgreSQL, allow the Web App to connect (**Allow public access from Azure services**, or the app outbound IPs). Keep SSL on.

## Localhost

Leave `KEY_VAULT_URI` unset. `npm start` still uses Excel on your PC.
