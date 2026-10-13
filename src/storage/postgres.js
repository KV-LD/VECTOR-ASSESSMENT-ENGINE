const config = require('../config');
const excelStore = require('./excel');
const { DIM_LEVELS } = require('../scoring');

function levelName(level) {
  return DIM_LEVELS[level] || String(level || '');
}

function sslOption() {
  const mode = String(config.postgres.ssl || 'require').toLowerCase();
  if (mode === '0' || mode === 'false' || mode === 'disable' || mode === 'off') return false;
  return { rejectUnauthorized: false };
}

function poolConfig() {
  if (config.postgres.connectionString) {
    return { connectionString: config.postgres.connectionString, ssl: sslOption(), max: 8 };
  }
  return {
    host: config.postgres.host,
    port: config.postgres.port,
    database: config.postgres.database,
    user: config.postgres.user,
    password: config.postgres.password,
    ssl: sslOption(),
    max: 8
  };
}

function loadPg() {
  try {
    return require('pg');
  } catch (error) {
    return null;
  }
}

let pool = null;

function getPool() {
  if (pool) return pool;
  if (!config.postgresConfigured) {
    const error = new Error(
      'Postgres is not configured. Create Key Vault secret POSTGRES-CONNECTION-STRING with the full connection URL.'
    );
    error.status = 501;
    throw error;
  }
  const pg = loadPg();
  if (!pg) {
    const error = new Error('Postgres driver is missing. Run: npm install pg');
    error.status = 501;
    throw error;
  }
  pool = new pg.Pool(poolConfig());
  return pool;
}

const postgresStore = {
  driver: 'postgres',
  location() {
    const url = config.postgres.connectionString;
    if (url) {
      try {
        const parsed = new URL(url.replace(/^postgres(ql)?:/i, 'https:'));
        return `${parsed.hostname}${parsed.pathname}`;
      } catch (error) {
        return 'postgres';
      }
    }
    if (config.postgres.host) {
      return `${config.postgres.host}/${config.postgres.database}`;
    }
    return 'postgres';
  },

  async initialize() {
    const db = getPool();
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        emp_id TEXT,
        name TEXT,
        role TEXT,
        timestamp TIMESTAMPTZ,
        attempt INTEGER,
        vector_sign TEXT
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        emp_id TEXT,
        name TEXT,
        role TEXT,
        attempt INTEGER,
        v_score INTEGER,
        e_score INTEGER,
        c_score INTEGER,
        t_score INTEGER,
        o_score INTEGER,
        r_score INTEGER,
        vector_sign TEXT,
        vector_class TEXT,
        timestamp TIMESTAMPTZ,
        v_level TEXT,
        e_level TEXT,
        c_level TEXT,
        t_level TEXT,
        o_level TEXT,
        r_level TEXT,
        answers JSONB
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        email TEXT,
        emp_id TEXT,
        name TEXT,
        role TEXT,
        attempt INTEGER,
        vector_sign TEXT,
        vector_class TEXT,
        timestamp TIMESTAMPTZ,
        question_id TEXT,
        dimension TEXT,
        type TEXT,
        choice TEXT,
        score INTEGER,
        option_text TEXT,
        question_text TEXT
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email))');
    await db.query('CREATE INDEX IF NOT EXISTS idx_results_email ON results (lower(email))');
    await db.query('CREATE INDEX IF NOT EXISTS idx_responses_email ON responses (lower(email))');
  },

  async saveLogin(profile) {
    const db = getPool();
    const timestamp = profile.timestamp || new Date().toISOString();
    const counted = await db.query(
      'SELECT COUNT(*)::int AS n FROM users WHERE lower(email) = lower($1)',
      [profile.email]
    );
    const attempt = (counted.rows[0] && counted.rows[0].n ? counted.rows[0].n : 0) + 1;
    await db.query(
      `INSERT INTO users (email, emp_id, name, role, timestamp, attempt, vector_sign)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [profile.email, profile.emp_id, profile.name, profile.role, timestamp, attempt, '']
    );
    return { attempt, warning: null, file: postgresStore.location() };
  },

  async saveResult({ profile, scores, report, questions, responses, choices }) {
    const db = getPool();
    const counted = await db.query(
      'SELECT COUNT(*)::int AS n FROM results WHERE lower(email) = lower($1)',
      [profile.email]
    );
    const attempt = (counted.rows[0] && counted.rows[0].n ? counted.rows[0].n : 0) + 1;
    const answers = excelStore.answerCells(questions, responses, choices);
    const existing = await db.query(
      'SELECT COUNT(*)::int AS n FROM users WHERE lower(email) = lower($1)',
      [profile.email]
    );
    if (!existing.rows[0] || existing.rows[0].n === 0) {
      await db.query(
        `INSERT INTO users (email, emp_id, name, role, timestamp, attempt, vector_sign)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [profile.email, profile.emp_id, profile.name, profile.role, report.timestamp, attempt, report.vector_sign]
      );
    } else {
      await db.query(
        'UPDATE users SET vector_sign = $1 WHERE lower(email) = lower($2)',
        [report.vector_sign, profile.email]
      );
    }
    const answerMap = {};
    answers.forEach((a) => { answerMap[a.id] = a.cell; });
    await db.query(
      `INSERT INTO results (
        email, emp_id, name, role, attempt,
        v_score, e_score, c_score, t_score, o_score, r_score,
        vector_sign, vector_class, timestamp,
        v_level, e_level, c_level, t_level, o_level, r_level, answers
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21::jsonb
      )`,
      [
        profile.email, profile.emp_id, profile.name, profile.role, attempt,
        scores.V.level, scores.E.level, scores.C.level, scores.T.level, scores.O.level, scores.R.level,
        report.vector_sign, report.vector_class, report.timestamp,
        levelName(scores.V.level), levelName(scores.E.level), levelName(scores.C.level),
        levelName(scores.T.level), levelName(scores.O.level), levelName(scores.R.level),
        JSON.stringify(answerMap)
      ]
    );
    for (const a of answers) {
      await db.query(
        `INSERT INTO responses (
          email, emp_id, name, role, attempt, vector_sign, vector_class, timestamp,
          question_id, dimension, type, choice, score, option_text, question_text
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          profile.email, profile.emp_id, profile.name, profile.role, attempt,
          report.vector_sign, report.vector_class, report.timestamp,
          a.id, a.dim, a.type, a.choice, a.score, a.optionText, a.questionText
        ]
      );
    }
    return { attempt, warning: null, file: postgresStore.location() };
  },

  async listResults() {
    const db = getPool();
    const { rows } = await db.query('SELECT * FROM results ORDER BY timestamp ASC, id ASC');
    return rows.map((row) => ({
      email: row.email,
      emp_id: row.emp_id,
      name: row.name,
      role: row.role,
      attempt: row.attempt,
      v_score: row.v_score,
      e_score: row.e_score,
      c_score: row.c_score,
      t_score: row.t_score,
      o_score: row.o_score,
      r_score: row.r_score,
      vector_sign: row.vector_sign,
      vector_class: row.vector_class,
      timestamp: row.timestamp,
      v_level: row.v_level,
      e_level: row.e_level,
      c_level: row.c_level,
      t_level: row.t_level,
      o_level: row.o_level,
      r_level: row.r_level
    }));
  },

  async listUserAttempts(email) {
    const needle = String(email || '').trim().toLowerCase();
    const results = await postgresStore.listResults();
    return results.filter((row) => String(row.email || '').trim().toLowerCase() === needle);
  },

  async exportWorkbook() {
    const ExcelJS = require('exceljs');
    const db = getPool();
    const workbook = new ExcelJS.Workbook();
    const users = workbook.addWorksheet('Users');
    const results = workbook.addWorksheet('Results');
    const responses = workbook.addWorksheet('Responses');
    users.addRow(['ID', 'Email', 'Employee ID', 'Name', 'Role', 'Timestamp', 'Attempt', 'Vector Sign']);
    results.addRow([
      'User Email', 'Employee ID', 'Name', 'Role', 'Attempt',
      'V Score', 'E Score', 'C Score', 'T Score', 'O Score', 'R Score',
      'Vector Sign', 'Vector Class', 'Timestamp',
      'V Level', 'E Level', 'C Level', 'T Level', 'O Level', 'R Level',
      ...excelStore.QUESTION_IDS
    ]);
    responses.addRow([
      'Email', 'Employee ID', 'Name', 'Role', 'Attempt', 'Vector Sign', 'Vector Class', 'Timestamp',
      'Question ID', 'Dimension', 'Type', 'Choice', 'Score', 'Option text', 'Question text'
    ]);
    const userRows = await db.query('SELECT * FROM users ORDER BY id ASC');
    userRows.rows.forEach((row) => {
      users.addRow([row.id, row.email, row.emp_id, row.name, row.role, row.timestamp, row.attempt, row.vector_sign]);
    });
    const resultRows = await db.query('SELECT * FROM results ORDER BY id ASC');
    resultRows.rows.forEach((row) => {
      const answers = row.answers || {};
      results.addRow([
        row.email, row.emp_id, row.name, row.role, row.attempt,
        row.v_score, row.e_score, row.c_score, row.t_score, row.o_score, row.r_score,
        row.vector_sign, row.vector_class, row.timestamp,
        row.v_level, row.e_level, row.c_level, row.t_level, row.o_level, row.r_level,
        ...excelStore.QUESTION_IDS.map((id) => answers[id] || '')
      ]);
    });
    const responseRows = await db.query('SELECT * FROM responses ORDER BY id ASC');
    responseRows.rows.forEach((row) => {
      responses.addRow([
        row.email, row.emp_id, row.name, row.role, row.attempt, row.vector_sign, row.vector_class, row.timestamp,
        row.question_id, row.dimension, row.type, row.choice, row.score, row.option_text, row.question_text
      ]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
};

module.exports = postgresStore;
