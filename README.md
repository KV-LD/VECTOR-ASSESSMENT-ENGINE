# VECTOR Assessment Engine

The working UI is on branch `cursor/fix-npm-install-jsonwebtoken-03fa`. If you run `main`, you will still see `#` in answers, a concatenated Vector string, and a broken download.

```bash
git fetch origin
git checkout cursor/fix-npm-install-jsonwebtoken-03fa
git pull origin cursor/fix-npm-install-jsonwebtoken-03fa
npm install
npm start
```

Then open `http://localhost:3000/VECTORASSESSMENTENGINE` and hard-refresh (Ctrl+Shift+R). The welcome page must show a gold bar: **BUILD FIX-6**.

To send OTP by email, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. Without those, the 6-digit code is printed in the terminal and shown on the welcome screen for local testing.

## Quick Start (Prototype)

A Node.js web application for conducting VECTOR capability assessments with role-based questions, real-time scoring, and Excel data storage.

## Quick Start (Prototype)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Server
```bash
npm start
```

Server runs on: `http://localhost:3000/VECTORASSESSMENTENGINE`

### 3. Use the App
- Users go to the static link
- Login with name, work email, employee ID, and role, then a 6-digit OTP sent to that email (if SMTP is not configured, the code is shown on screen for local use)
- Answer 30 role-specific questions
- Get VECTOR class (V1–V5) as the large report heading and Vector signature (for example `V4-V`)
- Data auto-saves to **`data/assessments.xlsx`** only after you finish all 30 questions with `npm start` running. Close the Excel file first if you have it open.
- On the report screen, use **Download PDF** (one PDF file)

Admin Excel export: `http://localhost:3000/admin` → Download All Results (Excel), which is the same file.

## Project Structure

```
├── backend/
│   ├── server.js          # Express server & API
│   ├── scoring.js         # Scoring logic & calculations
│   └── questions.js       # Question bank by role
├── frontend/
│   └── index.html         # Assessment UI + Report
├── data/
│   └── assessments.xlsx   # Data storage (auto-created)
└── package.json
```

## Features (v1.0)

✅ Role-based question branching (5 roles × 30 questions each)
✅ Silent scoring with real-time calculation
✅ VECTOR sign generation + class assignment
✅ HTML report with downloadable link
✅ Excel tracking (user, role, scores, timestamp, attempt type)
✅ Duplicate attempt detection (by email/ID + timestamp)

## Next Steps

- [ ] PDF export from HTML report
- [ ] Admin dashboard (view all results)
- [ ] Authentication for admin
- [ ] Azure WebApp deployment
- [ ] Power Automate integration
