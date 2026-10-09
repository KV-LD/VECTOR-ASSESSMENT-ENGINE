const fs = require('fs');
const ExcelJS = require('exceljs');
const config = require('../config');
const { DIM_LEVELS } = require('../scoring');

const QUESTION_IDS = ['V', 'E', 'C', 'O', 'T', 'R'].flatMap((dim) => (
  [1, 2, 3, 4, 5].map((n) => `${dim}${n}`)
));

const USER_COLUMNS = [
  { header: 'ID', key: 'id', width: 5 },
  { header: 'Email', key: 'email', width: 25 },
  { header: 'Employee ID', key: 'emp_id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Role', key: 'role', width: 15 },
  { header: 'Timestamp', key: 'timestamp', width: 20 },
  { header: 'Attempt', key: 'attempt', width: 15 },
  { header: 'Vector Sign', key: 'vector_sign', width: 15 }
];

const RESULT_COLUMNS = [
  { header: 'User Email', key: 'email', width: 25 },
  { header: 'Employee ID', key: 'emp_id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Role', key: 'role', width: 15 },
  { header: 'Attempt', key: 'attempt', width: 15 },
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
  { header: 'R Level', key: 'r_level', width: 14 },
  ...QUESTION_IDS.map((id) => ({ header: id, key: id, width: 12 }))
];

const RESPONSE_COLUMNS = [
  { header: 'Email', key: 'email', width: 25 },
  { header: 'Employee ID', key: 'emp_id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Role', key: 'role', width: 15 },
  { header: 'Attempt', key: 'attempt', width: 12 },
  { header: 'Vector Sign', key: 'vector_sign', width: 14 },
  { header: 'Vector Class', key: 'vector_class', width: 14 },
  { header: 'Timestamp', key: 'timestamp', width: 22 },
  { header: 'Question ID', key: 'question_id', width: 12 },
  { header: 'Dimension', key: 'dimension', width: 12 },
  { header: 'Type', key: 'type', width: 12 },
  { header: 'Choice', key: 'choice', width: 10 },
  { header: 'Score', key: 'score', width: 10 },
  { header: 'Option text', key: 'option_text', width: 50 },
  { header: 'Question text', key: 'question_text', width: 60 }
];

function formatChoiceCell(choice, score) {
  if (choice && score != null && score !== '') return `${choice} (${score})`;
  if (choice) return String(choice);
  if (score != null && score !== '') return String(score);
  return '';
}

function findOption(question, choice, score) {
  const opts = (question && question.opts) || [];
  const byLetter = opts.find((o) => String(o.l) === String(choice || ''));
  if (byLetter) return byLetter;
  return opts.find((o) => String(o.s) === String(score)) || null;
}

function answerCells(questions, responses, choices) {
  const byId = {};
  (questions || []).forEach((q) => { byId[q.id] = q; });
  return QUESTION_IDS.map((id) => {
    const question = byId[id] || { id, dim: id.charAt(0), type: '', text: '', opts: [] };
    const score = responses && responses[id] != null ? responses[id] : '';
    const choice = (choices && choices[id]) || (findOption(question, null, score) || {}).l || '';
    const option = findOption(question, choice, score);
    return {
      id,
      dim: question.dim || id.charAt(0),
      type: question.type || '',
      choice,
      score,
      optionText: option ? option.t : '',
      questionText: question.text || '',
      cell: formatChoiceCell(choice, score)
    };
  });
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
    const dir = require('path').dirname(config.jsonlFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(config.jsonlFile, JSON.stringify(record) + '\n');
  } catch (error) {
    console.error('JSONL backup failed', error);
  }
}

async function initialize() {
  const file = config.dataFile;
  const dataDir = require('path').dirname(file);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(file)) {
    const workbook = new ExcelJS.Workbook();
    const users = workbook.addWorksheet('Users');
    const results = workbook.addWorksheet('Results');
    const responses = workbook.addWorksheet('Responses');
    bindColumns(users, USER_COLUMNS);
    bindColumns(results, RESULT_COLUMNS);
    bindColumns(responses, RESPONSE_COLUMNS);
    await workbook.xlsx.writeFile(file);
    console.log(`Excel file initialized at ${file}`);
  }
}

async function loadWorkbook() {
  await initialize();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(config.dataFile);
  const usersSheet = workbook.getWorksheet('Users') || workbook.addWorksheet('Users');
  const resultsSheet = workbook.getWorksheet('Results') || workbook.addWorksheet('Results');
  const responsesSheet = workbook.getWorksheet('Responses') || workbook.addWorksheet('Responses');
  bindColumns(usersSheet, USER_COLUMNS);
  bindColumns(resultsSheet, RESULT_COLUMNS);
  bindColumns(responsesSheet, RESPONSE_COLUMNS);
  return { workbook, usersSheet, resultsSheet, responsesSheet };
}

async function writeWorkbook(workbook) {
  const file = config.dataFile;
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
        throw new Error('Excel file is open in another program. Close data/assessments.xlsx and complete the assessment again.');
      }
      throw fallbackError;
    }
  }
}

function rowToResult(row) {
  return {
    email: row.getCell(1).value,
    emp_id: row.getCell(2).value,
    name: row.getCell(3).value,
    role: row.getCell(4).value,
    attempt: row.getCell(5).value,
    v_score: row.getCell(6).value,
    e_score: row.getCell(7).value,
    c_score: row.getCell(8).value,
    t_score: row.getCell(9).value,
    o_score: row.getCell(10).value,
    r_score: row.getCell(11).value,
    vector_sign: row.getCell(12).value,
    vector_class: row.getCell(13).value,
    timestamp: row.getCell(14).value,
    v_level: row.getCell(15).value,
    e_level: row.getCell(16).value,
    c_level: row.getCell(17).value,
    t_level: row.getCell(18).value,
    o_level: row.getCell(19).value,
    r_level: row.getCell(20).value
  };
}

const excelStore = {
  driver: 'excel',
  location: () => config.dataFile,
  initialize,

  async saveLogin(profile) {
    const timestamp = profile.timestamp || new Date().toISOString();
    let attempt = 1;
    let warning = null;
    let file = config.dataFile;
    try {
      const { workbook, usersSheet } = await loadWorkbook();
      attempt = countEmailRows(usersSheet, 2, profile.email) + 1;
      appendValues(usersSheet, [
        nextRowNumber(usersSheet) - 1,
        profile.email,
        profile.emp_id,
        profile.name,
        profile.role,
        timestamp,
        attempt,
        ''
      ]);
      const written = await writeWorkbook(workbook);
      warning = written.warning;
      file = written.file;
    } catch (error) {
      warning = error.message;
      console.error('Login Excel write failed', error);
    }
    appendJsonl({
      type: 'login',
      email: profile.email,
      emp_id: profile.emp_id,
      name: profile.name,
      role: profile.role,
      timestamp,
      attempt
    });
    return { attempt, warning, file };
  },

  async saveResult({ profile, scores, report, questions, responses, choices }) {
    const { workbook, usersSheet, resultsSheet, responsesSheet } = await loadWorkbook();
    const attempt = countEmailRows(resultsSheet, 1, profile.email) + 1;
    const answers = answerCells(questions, responses, choices);
    if (countEmailRows(usersSheet, 2, profile.email) === 0) {
      appendValues(usersSheet, [
        nextRowNumber(usersSheet) - 1,
        profile.email,
        profile.emp_id,
        profile.name,
        profile.role,
        report.timestamp,
        attempt,
        report.vector_sign
      ]);
    } else {
      usersSheet.eachRow((row, i) => {
        if (i === 1) return;
        if (String(row.getCell(2).value || '').trim().toLowerCase() === profile.email) {
          row.getCell(8).value = report.vector_sign;
        }
      });
    }
    appendValues(resultsSheet, [
      profile.email,
      profile.emp_id,
      profile.name,
      profile.role,
      attempt,
      scores.V.level,
      scores.E.level,
      scores.C.level,
      scores.T.level,
      scores.O.level,
      scores.R.level,
      report.vector_sign,
      report.vector_class,
      report.timestamp,
      levelName(scores.V.level),
      levelName(scores.E.level),
      levelName(scores.C.level),
      levelName(scores.T.level),
      levelName(scores.O.level),
      levelName(scores.R.level),
      ...answers.map((a) => a.cell)
    ]);
    answers.forEach((a) => {
      appendValues(responsesSheet, [
        profile.email,
        profile.emp_id,
        profile.name,
        profile.role,
        attempt,
        report.vector_sign,
        report.vector_class,
        report.timestamp,
        a.id,
        a.dim,
        a.type,
        a.choice,
        a.score,
        a.optionText,
        a.questionText
      ]);
    });
    const written = await writeWorkbook(workbook);
    appendJsonl({
      type: 'result',
      email: profile.email,
      emp_id: profile.emp_id,
      name: profile.name,
      role: profile.role,
      attempt,
      scores: {
        V: scores.V.level,
        E: scores.E.level,
        C: scores.C.level,
        T: scores.T.level,
        O: scores.O.level,
        R: scores.R.level
      },
      levels: {
        V: levelName(scores.V.level),
        E: levelName(scores.E.level),
        C: levelName(scores.C.level),
        T: levelName(scores.T.level),
        O: levelName(scores.O.level),
        R: levelName(scores.R.level)
      },
      answers: answers.map((a) => ({ id: a.id, choice: a.choice, score: a.score })),
      vector_sign: report.vector_sign,
      vector_class: report.vector_class,
      timestamp: report.timestamp
    });
    return { attempt, warning: written.warning, file: written.file };
  },

  async listResults() {
    const { resultsSheet } = await loadWorkbook();
    const results = [];
    resultsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      results.push(rowToResult(row));
    });
    return results;
  },

  async listUserAttempts(email) {
    const needle = String(email || '').trim().toLowerCase();
    const results = await excelStore.listResults();
    return results.filter((row) => String(row.email || '').trim().toLowerCase() === needle);
  },

  async exportWorkbook() {
    const { workbook } = await loadWorkbook();
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
};

excelStore.QUESTION_IDS = QUESTION_IDS;
excelStore.answerCells = answerCells;
module.exports = excelStore;
