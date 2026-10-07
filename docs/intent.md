# VECTOR Assessment Engine — Intent

Working name: VECTOR Assessment Engine.
Framework owner: Krishnan Nilakantan (NK). Free to use with credit.

## Problem

The previous prototype mixed client and server scoring, cached stale HTML, concatenated Vector signs, left Excel empty, and still showed gold/navy plus Pre/Post. This V2 rebuild is a clean replacement.

## Outcome

A UST practitioner completes 30 role-calibrated questions in about 15 minutes, receives a VECTOR class (V1–V5) and signature (for example `V4-V`), downloads one PDF report, and has login plus scores stored for admin review.

## Prototype vs later production

| Now (localhost) | Later (Azure) |
| --- | --- |
| `npm start` on port 3000 | Azure Web App (`process.env.PORT`) |
| Excel file `data/assessments.xlsx` | Azure SQL via `STORAGE_DRIVER=azure-sql` |
| OTP shown on screen if SMTP is unset | SMTP (or equivalent) for real email codes |
| Placeholder JWT/admin secrets | Secrets in App Service settings |

Scoring, questions, and UI do not change when storage moves.

## Users

- Practitioners in five roles: Software Engineer / Technology; Consultant / Strategy; Finance / Risk; HR / L&D / People; Delivery / Project Management
- Internal admin at `/admin`

## Non-goals for V2

- Opening a raw HTML file from disk as the primary run path
- Pre-Program / Post-Program attempt labels
- Concatenated signs such as `V4E4C3T4O3R4`
- Numeric n/5 scores on the report
- Multiple download files per click
