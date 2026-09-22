const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const questionsByRole = require('./questions');
const { calculateScores, generateReport, cleanDisplayText } = require('./scoring');

const app = express();
const PORT = 3000;
const SECRET = 'vector-secret-key-change-in-production';
const ADMIN_SECRET = 'admin-secret-key-change-in-production';
function dataFile() {
  return process.env.VECTOR_DATA_FILE || path.join(__dirname, '../data/assessments.xlsx');
}
const USER_COLUMNS = [
  { header: 'ID', key: 'id', width: 5 },
  { header: 'Email', key: 'email', width: 25 },
  { header: 'Employee ID', key: 'emp_id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Role', key: 'role', width: 15 },
  { header: 'Timestamp', key: 'timestamp', width: 20 },
  { header: 'Attempt Type', key: 'attempt_type', width: 15 }
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
  { header: 'Timestamp', key: 'timestamp', width: 20 }
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
    workbook.addWorksheet('Users').columns = USER_COLUMNS;
    workbook.addWorksheet('Results').columns = RESULT_COLUMNS;
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
  if (usersSheet.rowCount === 0) usersSheet.columns = USER_COLUMNS;
  if (resultsSheet.rowCount === 0) resultsSheet.columns = RESULT_COLUMNS;
  return { workbook, usersSheet, resultsSheet };
}

async function writeWorkbook(workbook) {
  try {
    await workbook.xlsx.writeFile(dataFile());
  } catch (error) {
    const locked = error && (error.code === 'EBUSY' || error.code === 'EPERM' || /busy|locked|permission/i.test(String(error.message)));
    if (locked) {
      throw new Error('Excel file is open in another program. Close data\\assessments.xlsx and complete the assessment again.');
    }
    throw error;
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
    if (!sent.emailed || process.env.VECTOR_SHOW_OTP === '1') payload.devOtp = otp;
    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not send OTP' });
  }
});

app.post('/api/otp/verify', (req, res) => {
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
  const token = jwt.sign({ ...rec.profile, timestamp: new Date().toISOString() }, SECRET, { expiresIn: '12h' });
  res.json({ token, ...rec.profile, message: 'Login successful' });
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
    const { responses } = req.body;
    const questions = questionsByRole[user.role];
    if (!questions) {
      return res.status(400).json({ error: 'Unknown role' });
    }

    const dimScores = calculateScores(responses, questions);
    const report = generateReport(dimScores, responses, { role: user.role, name: user.name });

    const { workbook, usersSheet, resultsSheet } = await loadWorkbook();

    usersSheet.addRow([
      usersSheet.rowCount,
      user.email,
      user.emp_id,
      user.name,
      user.role,
      report.timestamp,
      ''
    ]);

    resultsSheet.addRow([
      user.email,
      user.emp_id,
      user.name,
      user.role,
      '',
      dimScores.V.level,
      dimScores.E.level,
      dimScores.C.level,
      dimScores.T.level,
      dimScores.O.level,
      dimScores.R.level,
      report.vector_sign,
      report.vector_class,
      report.timestamp
    ]);

    await writeWorkbook(workbook);

    res.json({ success: true, report });
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
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, reportDownloadName };
