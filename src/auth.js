const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('./config');

const otpStore = new Map();
const adminPasswordHash = bcrypt.hashSync(config.adminPassword, 10);

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function loadNodemailer() {
  try {
    return require('nodemailer');
  } catch (error) {
    return null;
  }
}

async function sendOtpEmail(to, otp, name) {
  const from = config.smtp.from || config.smtp.user || 'vector@localhost';
  const text = `Hello ${name || ''},\n\nYour VECTOR assessment code is ${otp}.\nIt expires in 10 minutes.\n\nIf you did not request this, ignore this email.`;
  if (!config.smtpConfigured) {
    console.log(`OTP for ${to}: ${otp}`);
    return { emailed: false };
  }
  const nodemailer = loadNodemailer();
  if (!nodemailer) {
    console.log('nodemailer is not installed. Showing the OTP on screen instead.');
    console.log(`OTP for ${to}: ${otp}`);
    return { emailed: false };
  }
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass }
  });
  await transporter.sendMail({
    from,
    to,
    subject: 'Your VECTOR assessment code',
    text
  });
  return { emailed: true };
}

function issueUserToken(profile) {
  return jwt.sign(profile, config.jwtSecret, { expiresIn: '12h' });
}

function verifyUserToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function issueAdminToken(email) {
  return jwt.sign({ role: 'admin', email }, config.adminJwtSecret, { expiresIn: '12h' });
}

function verifyAdminToken(token) {
  return jwt.verify(token, config.adminJwtSecret);
}

function requireUser(req, res, next) {
  try {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    req.user = verifyUserToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expired. Verify your email code again.' });
  }
}

function requireAdmin(req, res, next) {
  try {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    req.admin = verifyAdminToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

async function requestOtp(profile) {
  const emailNorm = String(profile.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    const error = new Error('Enter a valid work email');
    error.status = 400;
    throw error;
  }
  const otp = String(crypto.randomInt(100000, 1000000));
  otpStore.set(emailNorm, {
    hash: hashOtp(otp),
    expires: Date.now() + 10 * 60 * 1000,
    attempts: 0,
    profile: {
      email: emailNorm,
      emp_id: String(profile.emp_id).trim(),
      name: String(profile.name).trim(),
      role: String(profile.role).trim()
    }
  });
  const sent = await sendOtpEmail(emailNorm, otp, profile.name);
  return {
    ok: true,
    emailed: sent.emailed,
    message: sent.emailed
      ? `A 6-digit code was sent to ${emailNorm}`
      : `A 6-digit code was generated for ${emailNorm}. Email is not configured on this machine, so the code is shown below.`,
    devOtp: otp
  };
}

function verifyOtp(email, otp) {
  const emailNorm = String(email || '').trim().toLowerCase();
  const rec = otpStore.get(emailNorm);
  if (!rec || rec.expires < Date.now()) {
    const error = new Error('Code expired. Request a new one.');
    error.status = 401;
    throw error;
  }
  rec.attempts += 1;
  if (rec.attempts > 5) {
    otpStore.delete(emailNorm);
    const error = new Error('Too many attempts. Request a new code.');
    error.status = 401;
    throw error;
  }
  if (rec.hash !== hashOtp(String(otp || '').trim())) {
    const error = new Error('Invalid code');
    error.status = 401;
    throw error;
  }
  otpStore.delete(emailNorm);
  return rec.profile;
}

function checkAdminCredentials(email, password) {
  const emailNorm = String(email || '').trim().toLowerCase();
  if (emailNorm !== config.adminEmail.toLowerCase() || !bcrypt.compareSync(String(password || ''), adminPasswordHash)) {
    return false;
  }
  return true;
}

module.exports = {
  loadNodemailer,
  requestOtp,
  verifyOtp,
  issueUserToken,
  verifyUserToken,
  issueAdminToken,
  requireUser,
  requireAdmin,
  checkAdminCredentials
};
