# VECTOR Assessment Engine

Human-AI capability assessment for UST practitioners. This is a clean V2 rebuild: Node/Express API, static UST-branded UI, **Excel storage on localhost**, and a storage adapter so the same app can move to **Azure Web App + SQL** when credentials are ready.

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

The terminal prints a **VECTOR BUILD V2** box. If that box is missing, an old process is still holding port 3000.

Without SMTP, the 6-digit email code is shown in large type on the start screen and in the terminal.

Data is stored in `data/assessments.xlsx` (gitignored). Close the file in Excel before finishing an assessment.

Workbook sheets:

- **Users** — login identity, attempt number, latest VECTOR sign
- **Results** — one row per completed attempt: scores, VECTOR sign/class, and each question choice such as `C (4)`
- **Responses** — one row per question with the chosen letter, score, option text, question text, and VECTOR sign

## What it does

- 30 role-calibrated questions (5 professional roles)
- Email OTP login (no Pre/Post attempt type)
- PRD scoring: VECTOR class (V1-V5) and signature such as `V4-V`
- Report with framework labels (Emerging → Defining), not n/5
- Single **Download as PDF**
- Admin list/export of Excel results

## Azure later

Keep `STORAGE_DRIVER=excel` for localhost. When you have a database and Azure credentials:

1. Create an Azure Web App and set Application Settings from `.env.example`
2. Set `STORAGE_DRIVER=azure-sql` and `AZURE_SQL_CONNECTION_STRING`
3. Deploy this same Node app (`npm start`, or the included `web.config`)

See [docs/AZURE.md](docs/AZURE.md).

## Tests

```bash
npm test
```

## Brand

UST teal (`#006E74`, `#0097AC`), soft black (`#231F20`), off-white (`#EEF6F7`), Source Sans 3 / Source Serif 4.
