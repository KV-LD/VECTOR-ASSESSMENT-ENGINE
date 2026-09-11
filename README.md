# VECTOR Assessment Engine

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
- Login with: Email, Employee ID, Name, Role, Attempt Type
- Answer 30 role-specific questions
- Get VECTOR class (V1–V5) and Vector signature (for example `V3 - V`)
- Data auto-saves to **`data/assessments.xlsx`** on the machine running the server (created automatically; this folder is gitignored)
- On the report screen, use **Save as PDF** (browser print dialog)

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
