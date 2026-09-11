const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const questionsByRole = require('./questions');
const { calculateScores, generateReport } = require('./scoring');

const app = express();
const PORT = 3000;
const SECRET = 'vector-secret-key-change-in-production';
const ADMIN_SECRET = 'admin-secret-key-change-in-production';
const DATA_FILE = path.join(__dirname, '../data/assessments.xlsx');
const ADMIN_USER = 'admin@ust.com';
const ADMIN_PASS = bcrypt.hashSync('admin123', 10); // Change in production

app.disable('etag');
app.use(express.json());
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
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const workbook = new ExcelJS.Workbook();

    // Users sheet
    const usersSheet = workbook.addWorksheet('Users');
    usersSheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Employee ID', key: 'emp_id', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 20 },
      { header: 'Attempt Type', key: 'attempt_type', width: 15 }
    ];

    // Results sheet
    const resultsSheet = workbook.addWorksheet('Results');
    resultsSheet.columns = [
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

    await workbook.xlsx.writeFile(DATA_FILE);
    console.log(`✅ Excel file initialized at ${DATA_FILE}`);
  }
}

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, emp_id, name, role, attempt_type } = req.body;

  if (!email || !emp_id || !name || !role || !attempt_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const token = jwt.sign({ email, emp_id, name, role, attempt_type, timestamp: new Date().toISOString() }, SECRET);
  res.json({ token, message: 'Login successful' });
});

function cleanText(value) {
  return String(value)
    .replace(/â€”|â€“|â€œ|â€\u009d/g, ' - ')
    .replace(/[\u2014\u2013\u2015]/g, ' - ')
    .replace(/\u00a0/g, ' ');
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

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(DATA_FILE);
    const usersSheet = workbook.getWorksheet('Users');
    const resultsSheet = workbook.getWorksheet('Results');

    if (usersSheet) {
      usersSheet.addRow({
        id: usersSheet.rowCount,
        email: user.email,
        emp_id: user.emp_id,
        name: user.name,
        role: user.role,
        timestamp: report.timestamp,
        attempt_type: user.attempt_type
      });
    }

    resultsSheet.addRow({
      email: user.email,
      emp_id: user.emp_id,
      name: user.name,
      role: user.role,
      attempt_type: user.attempt_type,
      v_score: dimScores.V.level,
      e_score: dimScores.E.level,
      c_score: dimScores.C.level,
      t_score: dimScores.T.level,
      o_score: dimScores.O.level,
      r_score: dimScores.R.level,
      vector_sign: report.vector_sign,
      vector_class: report.vector_class,
      timestamp: report.timestamp
    });

    await workbook.xlsx.writeFile(DATA_FILE);

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

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(DATA_FILE);
    const resultsSheet = workbook.getWorksheet('Results');

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
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(DATA_FILE);
    const resultsSheet = workbook.getWorksheet('Results');

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

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(DATA_FILE);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=VECTOR-Assessment-Results.xlsx');

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
app.get('/VECTORASSESSMENTENGINE', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.listen(PORT, async () => {
  try {
    await initializeExcel();
  } catch (error) {
    console.error('Failed to initialize Excel storage:', error);
    process.exit(1);
  }
  console.log(`🚀 VECTOR Assessment Engine running on http://localhost:${PORT}/VECTORASSESSMENTENGINE`);
  console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
  console.log(`📁 Score data Excel: ${DATA_FILE}`);
});
