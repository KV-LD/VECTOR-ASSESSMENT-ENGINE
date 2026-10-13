# Put VECTOR secrets in Azure Key Vault (do not paste them in chat)

The app never needs you to paste passwords into Cursor or GitHub. You put them in a **local file that is gitignored**, upload that file to Key Vault, and the Web App reads them with **Managed Identity**.

The only Application setting on the Web App is:

```
KEY_VAULT_URI=https://<your-vault-name>.vault.azure.net/
```

## File to fill in

1. In the repo root, copy the template:

```powershell
cd C:\Users\305198\Documents\GitHub\VECTOR-ASSESSMENT-ENGINE
copy key-vault-secrets.env.example key-vault-secrets.env
notepad key-vault-secrets.env
```

2. Fill **only** `key-vault-secrets.env` (this file is gitignored). Leave `JWT-SECRET` and `ADMIN-JWT-SECRET` blank if you want the upload script to generate them.

3. Do not commit, email, or paste that file.

## Step by step in Azure

### A. Enable Managed Identity on the Web App

1. Azure Portal → your Web App → **Identity**
2. **System assigned** → **On** → Save
3. Copy the Object (principal) ID if you need it

### B. Let that identity read the vault

On the Key Vault:

**If the vault uses RBAC (recommended)**

1. Key Vault → **Access control (IAM)** → **Add role assignment**
2. Role: **Key Vault Secrets User**
3. Assign access to: **Managed identity**
4. Select your Web App → Review + assign

**If the vault uses Access policies**

1. Key Vault → **Access policies** → Create
2. Secret permissions: **Get**, **List**
3. Principal: your Web App's system identity

### C. Upload secrets from your filled file

Install [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli), then:

```powershell
az login
powershell -File scripts\Set-KeyVaultSecrets.ps1 -VaultName YOUR-VAULT-NAME
```

`YOUR-VAULT-NAME` is the vault name only, not the full URL.

### D. Application settings on the Web App

Web App → **Configuration** → **Application settings** → New application setting:

| Name | Value |
| --- | --- |
| `KEY_VAULT_URI` | `https://YOUR-VAULT-NAME.vault.azure.net/` |

Do not put Postgres or SMTP passwords in Application settings. Restart the Web App after saving.

`PORT` is set by Azure. Do not add it.

### E. Postgres network

On Azure Database for PostgreSQL, allow the Web App to connect (usually **Allow public access from Azure services**, or the app outbound IPs). SSL should stay on (`POSTGRES-SSL=require`).

## What the app reads from Key Vault

| Key Vault secret | Used for |
| --- | --- |
| `STORAGE-DRIVER` | `postgres` |
| `POSTGRES-CONNECTION-STRING` | full URL (optional if host fields are set) |
| `POSTGRES-HOST` `POSTGRES-PORT` `POSTGRES-DB` `POSTGRES-USER` `POSTGRES-PASSWORD` `POSTGRES-SSL` | Postgres when no connection string |
| `JWT-SECRET` `ADMIN-JWT-SECRET` | session tokens |
| `ADMIN-EMAIL` `ADMIN-PASSWORD` | `/admin` login |
| `SMTP-HOST` `SMTP-PORT` `SMTP-SECURE` `SMTP-USER` `SMTP-PASS` `SMTP-FROM` | OTP email |

## Localhost

Leave `KEY_VAULT_URI` unset. `npm start` still uses Excel on your PC. Key Vault is only for Azure.
