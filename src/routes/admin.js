const express = require('express');
const { issueAdminToken, requireAdmin, checkAdminCredentials } = require('../auth');
const { getStore } = require('../storage');
const { ROLE_LABELS, DIM_LEVELS } = require('../scoring');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!checkAdminCredentials(email, password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = issueAdminToken(String(email).trim().toLowerCase());
  res.json({ token, message: 'Admin login successful' });
});

router.get('/results', requireAdmin, async (req, res, next) => {
  try {
    const results = await getStore().listResults();
    res.json({
      results: results.map((row) => ({
        ...row,
        attempt_type: row.attempt,
        role_label: ROLE_LABELS[row.role] || row.role
      })),
      total: results.length
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users/:email', requireAdmin, async (req, res, next) => {
  try {
    const attempts = await getStore().listUserAttempts(req.params.email);
    res.json({
      email: req.params.email,
      count: attempts.length,
      attempts: attempts.map((row) => ({
        attempt: row.attempt,
        attempt_type: row.attempt,
        vector_sign: row.vector_sign,
        vector_class: row.vector_class,
        timestamp: row.timestamp,
        scores: {
          V: row.v_score,
          E: row.e_score,
          C: row.c_score,
          T: row.t_score,
          O: row.o_score,
          R: row.r_score
        },
        levels: {
          V: row.v_level || DIM_LEVELS[row.v_score],
          E: row.e_level || DIM_LEVELS[row.e_score],
          C: row.c_level || DIM_LEVELS[row.c_score],
          T: row.t_level || DIM_LEVELS[row.t_score],
          O: row.o_level || DIM_LEVELS[row.o_score],
          R: row.r_level || DIM_LEVELS[row.r_score]
        }
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export', requireAdmin, async (req, res, next) => {
  try {
    const buffer = await getStore().exportWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=VECTOR-Assessment-Results.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
