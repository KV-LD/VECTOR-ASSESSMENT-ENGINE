const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const questionsByRole = require('./questions');
const { calculateScores, generateReport, cleanDisplayText, DIM_LEVELS } = require('./scoring');

const app = express();
const PORT = 3000;
const SECRET = 'vector-secret-key-change-in-production';
const ADMIN_SECRET = 'admin-secret-key-change-in-production';
function dataFile() {
  return process.env.VECTOR_DATA_FILE || path.join(__dirname, '../data/assessments.xlsx');
}
function jsonlFile() {
  return process.env.VECTOR_JSONL_FILE || dataFile().replace(/\.xlsx$/i, '.jsonl');
}
function levelName(level) {
  return DIM_LEVELS[level] || String(level || '');
}
function bindColumns(sheet, columns) {
  columns.forEach((col, i) => {
    const column = sheet.getColumn(i + 1);
    column.key = col.key;
    column.width = col.width;
    const headerCell = sheet.getRow(1).getCell(i + 1);
    if (!headerCell.value) headerCell.value = col.header;
  });
}
function nextRowNumber(sheet) {
  let max = 1;
  sheet.eachRow({ includeEmpty: false }, (row, n) => {
    if (n > max) max = n;
  });
  return max + 1;
}
function appendValues(sheet, values) {
  const row = sheet.getRow(nextRowNumber(sheet));
  values.forEach((value, i) => {
    row.getCell(i + 1).value = value == null ? '' : value;
  });
  row.commit();
  return row.number;
}
function countEmailRows(sheet, emailCol, email) {
  const needle = String(email || '').trim().toLowerCase();
  let n = 0;
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    if (String(row.getCell(emailCol).value || '').trim().toLowerCase() === needle) n += 1;
  });
  return n;
}
function appendJsonl(record) {
  try {
    const file = jsonlFile();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(file, JSON.stringify(record) + '\n');
  } catch (error) {
    console.error('JSONL backup failed', error);
  }
}
function cleanResponses(responses) {
  const out = {};
  Object.keys(responses || {}).forEach((key) => {
    if (key.startsWith('_')) return;
    out[key] = responses[key];
  });
  return out;
}
const USER_COLUMNS = [
  { header: 'ID', key: 'id', width: 5 },
  { header: 'Email', key: 'email', width: 25 },
  { header: 'Employee ID', key: 'emp_id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Role', key: 'role', width: 15 },
  { header: 'Timestamp', key: 'timestamp', width: 20 },
  { header: 'Attempt', key: 'attempt_type', width: 15 }
];
const RESULT_COLUMNS = [
  { header: 'User Email', key: 'email', width: 25 },
  { header: 'Employee ID', key: 'emp_id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Role', key: 'role', width: 15 },
  { header: 'Attempt', key: 'attempt_type', width: 15 },
  { header: 'V Score', key: 'v_score', width: 10 },
  { header: 'E Score', key: 'e_score', width: 10 },
  { header: 'C Score', key: 'c_score', width: 10 },
  { header: 'T Score', key: 't_score', width: 10 },
  { header: 'O Score', key: 'o_score', width: 10 },
  { header: 'R Score', key: 'r_score', width: 10 },
  { header: 'Vector Sign', key: 'vector_sign', width: 15 },
  { header: 'Vector Class', key: 'vector_class', width: 15 },
  { header: 'Timestamp', key: 'timestamp', width: 20 },
  { header: 'V Level', key: 'v_level', width: 14 },
  { header: 'E Level', key: 'e_level', width: 14 },
  { header: 'C Level', key: 'c_level', width: 14 },
  { header: 'T Level', key: 't_level', width: 14 },
  { header: 'O Level', key: 'o_level', width: 14 },
  { header: 'R Level', key: 'r_level', width: 14 }
];
const ADMIN_USER = 'admin@ust.com';
const ADMIN_PASS = bcrypt.hashSync('admin123', 10); // Change in production

app.disable('etag');
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
app.use(express.static(path.join(__dirname, '../frontend'), {
  etag: false,
  lastModified: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    res.setHeader('Cache-Control', 'no-store');
  }
}));

// Initialize Excel file if not exists
async function initializeExcel() {
  const file = dataFile();
  const dataDir = path.dirname(file);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(file)) {
    const workbook = new ExcelJS.Workbook();
    const users = workbook.addWorksheet('Users');
    const results = workbook.addWorksheet('Results');
    bindColumns(users, USER_COLUMNS);
    bindColumns(results, RESULT_COLUMNS);
    await workbook.xlsx.writeFile(file);
    console.log(`Excel file initialized at ${file}`);
  }
}

async function loadWorkbook() {
  await initializeExcel();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(dataFile());
  const usersSheet = workbook.getWorksheet('Users') || workbook.addWorksheet('Users');
  const resultsSheet = workbook.getWorksheet('Results') || workbook.addWorksheet('Results');
  bindColumns(usersSheet, USER_COLUMNS);
  bindColumns(resultsSheet, RESULT_COLUMNS);
  return { workbook, usersSheet, resultsSheet };
}

async function writeWorkbook(workbook) {
  const file = dataFile();
  try {
    await workbook.xlsx.writeFile(file);
    return { file, warning: null };
  } catch (error) {
    const locked = error && (error.code === 'EBUSY' || error.code === 'EPERM' || /busy|locked|permission/i.test(String(error.message)));
    const fallback = file.replace(/\.xlsx$/i, `-${Date.now()}.xlsx`);
    try {
      await workbook.xlsx.writeFile(fallback);
      const warning = locked
        ? `Main Excel file is open. Saved a copy at ${fallback}. Close Excel so future attempts write to assessments.xlsx.`
        : `Could not update ${file}. Saved a copy at ${fallback}.`;
      console.error(warning);
      return { file: fallback, warning };
    } catch (fallbackError) {
      if (locked) {
        throw new Error('Excel file is open in another program. Close data\\assessments.xlsx and complete the assessment again.');
      }
      throw fallbackError;
    }
  }
}

// Login endpoint
const otpStore = new Map();

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendOtpEmail(to, otp, name) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'vector@localhost';
  const text = `Hello ${name || ''},\n\nYour VECTOR assessment code is ${otp}.\nIt expires in 10 minutes.\n\nIf you did not request this, ignore this email.`;
  if (!smtpConfigured()) {
    console.log(`OTP for ${to}: ${otp}`);
    return { emailed: false };
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === '1',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transporter.sendMail({
    from,
    to,
    subject: 'Your VECTOR assessment code',
    text
  });
  return { emailed: true };
}

app.post('/api/otp/request', async (req, res) => {
  try {
    const { email, emp_id, name, role } = req.body || {};
    if (!email || !emp_id || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return res.status(400).json({ error: 'Enter a valid work email' });
    }
    const otp = String(crypto.randomInt(100000, 1000000));
    otpStore.set(emailNorm, {
      hash: hashOtp(otp),
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      profile: {
        email: emailNorm,
        emp_id: String(emp_id).trim(),
        name: String(name).trim(),
        role: String(role).trim()
      }
    });
    const sent = await sendOtpEmail(emailNorm, otp, name);
    const payload = {
      ok: true,
      message: sent.emailed
        ? `A 6-digit code was sent to ${emailNorm}`
        : `A 6-digit code was generated for ${emailNorm}. Email is not configured on this machine, so the code is shown below.`
    };
    payload.devOtp = otp;
    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not send OTP' });
  }
});

app.post('/api/otp/verify', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const emailNorm = String(email || '').trim().toLowerCase();
    const rec = otpStore.get(emailNorm);
    if (!rec || rec.expires < Date.now()) {
      return res.status(401).json({ error: 'Code expired. Request a new one.' });
    }
    rec.attempts += 1;
    if (rec.attempts > 5) {
      otpStore.delete(emailNorm);
      return res.status(401).json({ error: 'Too many attempts. Request a new code.' });
    }
    if (rec.hash !== hashOtp(String(otp || '').trim())) {
      return res.status(401).json({ error: 'Invalid code' });
    }
    otpStore.delete(emailNorm);
    const timestamp = new Date().toISOString();
    const token = jwt.sign({ ...rec.profile, timestamp }, SECRET, { expiresIn: '12h' });

    let loginAttempt = 1;
    let saveWarning = null;
    try {
      const { workbook, usersSheet } = await loadWorkbook();
      loginAttempt = countEmailRows(usersSheet, 2, rec.profile.email) + 1;
      appendValues(usersSheet, [
        nextRowNumber(usersSheet) - 1,
        rec.profile.email,
        rec.profile.emp_id,
        rec.profile.name,
        rec.profile.role,
        timestamp,
        loginAttempt
      ]);
      const written = await writeWorkbook(workbook);
      saveWarning = written.warning;
      console.log(`Login stored for ${rec.profile.email} attempt ${loginAttempt} -> ${written.file}`);
    } catch (excelError) {
      console.error('Login Excel write failed', excelError);
      saveWarning = excelError.message;
    }
    appendJsonl({
      type: 'login',
      email: rec.profile.email,
      emp_id: rec.profile.emp_id,
      name: rec.profile.name,
      role: rec.profile.role,
      timestamp,
      attempt: loginAttempt
    });

    res.json({
      token,
      ...rec.profile,
      attempt: loginAttempt,
      warning: saveWarning,
      message: 'Login successful'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

function cleanText(value) {
  return cleanDisplayText(value);
}

function cleanQuestions(questions) {
  return questions.map((q) => ({
    ...q,
    text: cleanText(q.text),
    opts: (q.opts || []).map((o) => ({ ...o, t: cleanText(o.t) }))
  }));
}

// Get questions by role
app.get('/api/questions/:role', (req, res) => {
  const { role } = req.params;
  const questions = questionsByRole[role];

  if (questions) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(cleanQuestions(questions));
  } else {
    res.status(404).json({ error: 'Role not found' });
  }
});

// Save assessment results
app.post('/api/save-assessment', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const user = jwt.verify(token, SECRET);
    const bodyUser = (req.body && req.body.userData) || {};
    const profile = {
      email: String(user.email || bodyUser.email || '').trim().toLowerCase(),
      emp_id: String(user.emp_id || bodyUser.emp_id || '').trim(),
      name: String(user.name || bodyUser.name || '').trim(),
      role: String(user.role || bodyUser.role || '').trim()
    };
    const responses = cleanResponses(req.body && req.body.responses);
    const questions = questionsByRole[profile.role];
    if (!questions) {
      return res.status(400).json({ error: 'Unknown role' });
    }

    const dimScores = calculateScores(responses, questions);
    const report = generateReport(dimScores, responses, { role: profile.role, name: profile.name });

    const { workbook, usersSheet, resultsSheet } = await loadWorkbook();
    const attempt = countEmailRows(resultsSheet, 1, profile.email) + 1;

    if (countEmailRows(usersSheet, 2, profile.email) === 0) {
      appendValues(usersSheet, [
        nextRowNumber(usersSheet) - 1,
        profile.email,
        profile.emp_id,
        profile.name,
        profile.role,
        report.timestamp,
        1
      ]);
    }

    appendValues(resultsSheet, [
      profile.email,
      profile.emp_id,
      profile.name,
      profile.role,
      attempt,
      dimScores.V.level,
      dimScores.E.level,
      dimScores.C.level,
      dimScores.T.level,
      dimScores.O.level,
      dimScores.R.level,
      report.vector_sign,
      report.vector_class,
      report.timestamp,
      levelName(dimScores.V.level),
      levelName(dimScores.E.level),
      levelName(dimScores.C.level),
      levelName(dimScores.T.level),
      levelName(dimScores.O.level),
      levelName(dimScores.R.level)
    ]);

    const written = await writeWorkbook(workbook);
    appendJsonl({
      type: 'result',
      email: profile.email,
      emp_id: profile.emp_id,
      name: profile.name,
      role: profile.role,
      attempt,
      scores: {
        V: dimScores.V.level,
        E: dimScores.E.level,
        C: dimScores.C.level,
        T: dimScores.T.level,
        O: dimScores.O.level,
        R: dimScores.R.level
      },
      levels: {
        V: levelName(dimScores.V.level),
        E: levelName(dimScores.E.level),
        C: levelName(dimScores.C.level),
        T: levelName(dimScores.T.level),
        O: levelName(dimScores.O.level),
        R: levelName(dimScores.R.level)
      },
      vector_sign: report.vector_sign,
      vector_class: report.vector_class,
      timestamp: report.timestamp
    });
    console.log(`Assessment stored for ${profile.email} attempt ${attempt} -> ${written.file}`);

    res.json({
      success: true,
      report,
      attempt,
      savedTo: written.file,
      warning: written.warning
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Admin login
app.post('/api/admin-login', (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN_USER || !bcrypt.compareSync(password, ADMIN_PASS)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ role: 'admin', email }, ADMIN_SECRET);
  res.json({ token, message: 'Admin login successful' });
});

// Get all assessments (admin only)
app.get('/api/admin/results', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, ADMIN_SECRET);

    const { resultsSheet } = await loadWorkbook();

    const results = [];
    resultsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      results.push({
        email: row.getCell('A').value,
        emp_id: row.getCell('B').value,
        name: row.getCell('C').value,
        role: row.getCell('D').value,
        attempt_type: row.getCell('E').value,
        v_score: row.getCell('F').value,
        e_score: row.getCell('G').value,
        c_score: row.getCell('H').value,
        t_score: row.getCell('I').value,
        o_score: row.getCell('J').value,
        r_score: row.getCell('K').value,
        vector_sign: row.getCell('L').value,
        vector_class: row.getCell('M').value,
        timestamp: row.getCell('N').value
      });
    });

    res.json({ results, total: results.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get user attempts (admin only)
app.get('/api/admin/user/:email', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, ADMIN_SECRET);

    const { email } = req.params;
    const { resultsSheet } = await loadWorkbook();

    const userAttempts = [];
    resultsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (row.getCell('A').value === email) {
        userAttempts.push({
          attempt_type: row.getCell('E').value,
          vector_sign: row.getCell('L').value,
          vector_class: row.getCell('M').value,
          timestamp: row.getCell('N').value,
          scores: {
            V: row.getCell('F').value,
            E: row.getCell('G').value,
            C: row.getCell('H').value,
            T: row.getCell('I').value,
            O: row.getCell('J').value,
            R: row.getCell('K').value
          }
        });
      }
    });

    res.json({ email, attempts: userAttempts, count: userAttempts.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Export results as Excel (admin only)
app.get('/api/admin/export', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, ADMIN_SECRET);

    const { workbook } = await loadWorkbook();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=VECTOR-Assessment-Results.xlsx');

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

function reportDownloadName(value) {
  const cleaned = String(value || 'VECTOR-Report.html').replace(/[^\w.\-]+/g, '_');
  return cleaned || 'VECTOR-Report.html';
}

app.post('/api/download-report', (req, res) => {
  const html = typeof req.body.html === 'string' ? req.body.html : '';
  if (!html || html.length > 5_000_000) {
    return res.status(400).json({ error: 'Missing report HTML' });
  }
  const filename = reportDownloadName(req.body.filename);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(html);
});

// Serve frontend
app.get(['/', '/VECTORASSESSMENTENGINE', '/VECTOR.html'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

function startServer() {
  return app.listen(PORT, async () => {
    try {
      await initializeExcel();
    } catch (error) {
      console.error('Failed to initialize Excel storage:', error);
      process.exit(1);
    }
    console.log(`🚀 VECTOR Assessment Engine running on http://localhost:${PORT}/VECTORASSESSMENTENGINE`);
    console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`Score data Excel: ${dataFile()}`);
    console.log(`Login/score backup: ${jsonlFile()}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, reportDownloadName };
