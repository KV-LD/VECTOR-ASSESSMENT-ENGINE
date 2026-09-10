const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const fs = require('fs');
const { calculateScores, calculateVectorSign, assignVectorClass, generateReport, CLASSES } = require('./scoring');

const app = express();
const PORT = 3000;
const SECRET = 'vector-secret-key-change-in-production';
const DATA_FILE = path.join(__dirname, '../data/assessments.xlsx');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Initialize Excel file if not exists
async function initializeExcel() {
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
    console.log('✅ Excel file initialized');
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

// Get questions by role
app.get('/api/questions/:role', (req, res) => {
  const { role } = req.params;
  const questions = require('./questions.js');

  if (questions[role]) {
    res.json(questions[role]);
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

    // Calculate scores
    const dimScores = calculateScores(responses);
    const vectorSign = calculateVectorSign(dimScores);
    const vectorClass = assignVectorClass(dimScores);
    const report = generateReport(dimScores, responses);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(DATA_FILE);
    const resultsSheet = workbook.getWorksheet('Results');

    resultsSheet.addRow({
      email: user.email,
      emp_id: user.emp_id,
      name: user.name,
      role: user.role,
      attempt_type: user.attempt_type,
      v_score: dimScores.V,
      e_score: dimScores.E,
      c_score: dimScores.C,
      t_score: dimScores.T,
      o_score: dimScores.O,
      r_score: dimScores.R,
      vector_sign: vectorSign,
      vector_class: vectorClass,
      timestamp: new Date().toISOString()
    });

    await workbook.xlsx.writeFile(DATA_FILE);

    res.json({
      success: true,
      report: {
        ...report,
        class_name: CLASSES[vectorClass].name,
        class_desc: CLASSES[vectorClass].desc
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
app.get('/VECTORASSESSMENTENGINE', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  initializeExcel();
  console.log(`🚀 VECTOR Assessment Engine running on http://localhost:${PORT}/VECTORASSESSMENTENGINE`);
});
