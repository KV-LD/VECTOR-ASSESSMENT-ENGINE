# VECTOR Assessment Engine

The live UI is on branch `cursor/fix-npm-install-jsonwebtoken-03fa`. **`main` is the old gold/navy app** (Pre/Post dropdown, no OTP panel). If you run `main`, none of the new work will appear.

## See BUILD FIX-9

1. Stop every old Node process on port 3000 (this is the usual reason the old page stays on screen):

```bat
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

2. Pull this branch and start:

```bash
git fetch origin
git checkout cursor/fix-npm-install-jsonwebtoken-03fa
git pull origin cursor/fix-npm-install-jsonwebtoken-03fa
npm install
npm start
```

The terminal must print a box that says **VECTOR BUILD FIX-9**. If that box is missing, you started an old folder.

3. Open **http://localhost:3000/?v=FIX-9** (not `VECTOR.html` from File Explorer).

The top of the page must be a teal bar: **VECTOR BUILD FIX-9 · 26 Sep 2026**. Confirm at http://localhost:3000/api/version — it must return `"build":"FIX-9"`.

Without SMTP, the 6-digit code is shown in large type on the start screen.

Data is stored in `data/assessments.xlsx` (close the file in Excel before finishing an assessment). Admin: http://localhost:3000/admin (`admin@ust.com` / `admin123`).
