# Azure Key Vault for VECTOR (Portal)

`KEY_VAULT_URI` is **not** where you paste passwords. It is only the vault URL on the Web App. Each password is a **separate secret** inside that vault.

## Two places

| Where | What you add |
| --- | --- |
| **Web App → Environment variables** | One setting named `KEY_VAULT_URI` whose value is the vault URL |
| **Key Vault → Secrets** | Postgres connection string, SMTP, JWT, admin login |

## 1. Put the vault URL on the Web App

1. Open the Key Vault in Azure Portal  
2. Copy **Vault URI** from the Overview page. It looks like:

   `https://your-vault-name.vault.azure.net/`

3. Web App → **Settings** → **Environment variables** (or Configuration → Application settings)  
4. **Add**:

   | Name | Value |
   | --- | --- |
   | `KEY_VAULT_URI` | `https://your-vault-name.vault.azure.net/` |

5. Save, then **Restart** the Web App after the secrets in step 3 exist  

Do not put the Postgres URL or SMTP password in Application settings.

## 2. Turn on Managed Identity

1. Web App → **Identity** → **System assigned** → **On** → Save  
2. Key Vault → **Access control (IAM)** → **Add role assignment**  
   - Role: **Key Vault Secrets User**  
   - Assign to the **Web App** managed identity  

If the vault still uses Access policies: grant **Get** and **List** on secrets to that identity.

## 3. Create these secrets in the vault

Key Vault → **Objects** → **Secrets** → **Generate/Import** → **Manual**.

**Name** must match the left column exactly.

### You already have these values

| Name | Secret value |
| --- | --- |
| `POSTGRES-CONNECTION-STRING` | your full Postgres URL (include user, password, host, database, `sslmode=require`) |
| `SMTP-HOST` | SMTP host |
| `SMTP-PORT` | `587` or `465` |
| `SMTP-USER` | SMTP username |
| `SMTP-PASS` | SMTP password |

`SMTP-FROM` is optional. If you skip it, the app uses `SMTP-USER`. For port `465` the app enables SSL automatically. For `587` it uses STARTTLS.

### Also create these (not in Postgres/SMTP)

| Name | Secret value |
| --- | --- |
| `JWT-SECRET` | a long random string you invent (32+ characters) |
| `ADMIN-JWT-SECRET` | a **different** long random string |
| `ADMIN-EMAIL` | email you will type at `/admin` |
| `ADMIN-PASSWORD` | password you will type at `/admin` |

You do **not** need `STORAGE-DRIVER`. When `KEY_VAULT_URI` is set, the app uses Postgres.

## 4. Confirm

After restart, Log stream should show secrets loaded from Key Vault and `Storage: postgres`. `/health` should include `"keyVault": true`.

Local `npm start` without `KEY_VAULT_URI` still uses Excel.
