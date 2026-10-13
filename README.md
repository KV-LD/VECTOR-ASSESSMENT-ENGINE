# VECTOR Assessment Engine

Human-AI capability assessment for UST practitioners. Node/Express API, UST-branded UI, **Excel on localhost**, **Postgres + Key Vault on Azure**.

Framework by **Krishnan Nilakantan (NK)**. Free to use with credit.

## Run locally (prototype)

```bash
npm install
npm start
```

Open:

- Assessment: http://localhost:3000/
- Admin: http://localhost:3000/admin (`admin@ust.com` / `admin123`)
- Health: http://localhost:3000/health

The terminal prints a **VECTOR BUILD V2.3** box. If that box is missing, an old process is still holding port 3000.

Without SMTP, the 6-digit email code is shown on the start screen. Data is stored in `data/assessments.xlsx` (gitignored). Close the file in Excel before finishing an assessment.

## Azure (Postgres + Key Vault)

Do **not** paste passwords into chat. Create the secrets in the Azure Portal Key Vault UI. The Web App only gets `KEY_VAULT_URI` and reads the rest with Managed Identity.

See [docs/KEY-VAULT.md](docs/KEY-VAULT.md) and [docs/AZURE.md](docs/AZURE.md).

## Tests

```bash
npm test
```

## Brand

UST teal (`#006E74`, `#0097AC`), soft black (`#231F20`), off-white (`#EEF6F7`), Source Sans 3 / Source Serif 4.
