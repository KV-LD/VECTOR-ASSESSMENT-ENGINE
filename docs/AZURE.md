# Moving VECTOR from localhost Excel to Azure Web App

The prototype stores logins and scores in `data/assessments.xlsx` on the machine running `npm start`. The app is already structured so storage can switch without rewriting the UI or scoring engine.

## What stays the same

- Node 18+ Express app (`src/index.js`)
- UST UI in `public/`
- Scoring in `src/scoring.js`
- OTP + JWT in `src/auth.js`
- REST routes in `src/routes/`

Azure App Service sets `PORT`. The server already uses `process.env.PORT`.

## Application settings

Copy `.env.example` into Azure **Configuration → Application settings**:

| Setting | Local prototype | Azure production |
| --- | --- | --- |
| `PORT` | `3000` | set by App Service |
| `NODE_ENV` | `development` | `production` |
| `JWT_SECRET` | placeholder | new secret |
| `ADMIN_JWT_SECRET` | placeholder | new secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@ust.com` / `admin123` | your admin |
| `STORAGE_DRIVER` | `excel` | `azure-sql` |
| `AZURE_SQL_CONNECTION_STRING` | empty | SQL connection string |
| SMTP_* | optional | recommended so OTP emails actually send |

## Switch storage

1. Create Azure SQL (or another SQL database) and collect the connection string.
2. `npm install mssql`
3. Implement the methods in `src/storage/azure-sql.js` (`saveLogin`, `saveResult`, `listResults`, `listUserAttempts`, `exportWorkbook`).
4. Set `STORAGE_DRIVER=azure-sql`.
5. Deploy.

Until those methods are implemented, `azure-sql` returns HTTP 501 with a clear message so the Excel prototype cannot be silently replaced by a broken backend.

## Deploy

Windows App Service (IISNode): this repo includes `web.config` pointing at `src/index.js`.

Linux App Service:

```
npm install --omit=dev
npm start
```

Startup command: `node src/index.js`

Health check path: `/health`
