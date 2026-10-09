const express = require('express');
const { questionsForRole, isValidRole } = require('../questions');
const { calculateScores, generateReport } = require('../scoring');
const { cleanQuestions } = require('../text');
const { getStore } = require('../storage');
const { requestOtp, verifyOtp, issueUserToken, requireUser } = require('../auth');

const router = express.Router();

router.post('/auth/otp', async (req, res, next) => {
  try {
    const { email, emp_id, name, role } = req.body || {};
    if (!email || !emp_id || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!isValidRole(role)) {
      return res.status(400).json({ error: 'Unknown role' });
    }
    const payload = await requestOtp({ email, emp_id, name, role });
    res.json(payload);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
});

router.post('/auth/verify', async (req, res, next) => {
  try {
    const profile = verifyOtp(req.body && req.body.email, req.body && req.body.otp);
    const timestamp = new Date().toISOString();
    const token = issueUserToken({ ...profile, timestamp });
    const saved = await getStore().saveLogin({ ...profile, timestamp });
    res.json({
      token,
      ...profile,
      attempt: saved.attempt,
      warning: saved.warning,
      message: 'Login successful'
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
});

router.get('/questions/:role', (req, res) => {
  const questions = questionsForRole(req.params.role);
  if (!questions) return res.status(404).json({ error: 'Role not found' });
  res.json(cleanQuestions(questions));
});

router.post('/assessments', requireUser, async (req, res, next) => {
  try {
    const bodyUser = (req.body && req.body.userData) || {};
    const profile = {
      email: String(req.user.email || bodyUser.email || '').trim().toLowerCase(),
      emp_id: String(req.user.emp_id || bodyUser.emp_id || '').trim(),
      name: String(req.user.name || bodyUser.name || '').trim(),
      role: String(req.user.role || bodyUser.role || '').trim()
    };
    const questions = questionsForRole(profile.role);
    if (!questions) return res.status(400).json({ error: 'Unknown role' });

    const responses = {};
    Object.keys((req.body && req.body.responses) || {}).forEach((key) => {
      if (!key.startsWith('_')) responses[key] = req.body.responses[key];
    });
    const choices = {};
    Object.keys((req.body && req.body.choices) || {}).forEach((key) => {
      if (!key.startsWith('_')) choices[key] = req.body.choices[key];
    });

    const answered = questions.filter((q) => responses[q.id] != null).length;
    if (answered !== questions.length) {
      return res.status(400).json({ error: `Answer all ${questions.length} questions before submitting.` });
    }

    const scores = calculateScores(responses, questions);
    const report = generateReport(scores, responses, { role: profile.role, name: profile.name });
    let attempt = 1;
    let warning = null;
    let savedTo = null;
    try {
      const saved = await getStore().saveResult({
        profile,
        scores,
        report,
        questions,
        responses,
        choices
      });
      attempt = saved.attempt;
      warning = saved.warning;
      savedTo = saved.file;
    } catch (error) {
      warning = error.message;
      console.error('Assessment save failed', error);
    }

    res.json({
      success: true,
      report,
      attempt,
      savedTo,
      warning
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
