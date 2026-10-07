const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { getStore } = require('./storage');
const assessmentRoutes = require('./routes/assessment');
const adminRoutes = require('./routes/admin');

const app = express();
app.disable('etag');
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('X-Vector-Build', config.buildId);
  next();
});

function sendHtml(res, filename) {
  const file = path.join(config.publicDir, filename);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/VECTOR BUILD [A-Z0-9.-]+/g, `VECTOR BUILD ${config.buildId}`);
  html = html.replace(/const BUILD = '[^']+'/, `const BUILD = '${config.buildId}'`);
  html = html.replace(
    '<body>',
    `<body data-vector-build="${config.buildId}"><!-- served ${new Date().toISOString()} ${config.buildId} -->`
  );
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

app.get(['/', '/index.html', '/VECTOR.html', '/VECTORASSESSMENTENGINE'], (req, res) => {
  sendHtml(res, 'index.html');
});
app.get(['/admin', '/admin.html'], (req, res) => {
  sendHtml(res, 'admin.html');
});

app.get('/api/version', (req, res) => {
  const store = getStore();
  res.json({
    build: config.buildId,
    app: 'VECTOR Assessment Engine',
    storage: store.driver,
    location: store.location(),
    azure: config.isAzure,
    nodeEnv: config.nodeEnv
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, build: config.buildId, storage: config.storageDriver });
});

app.use('/api', assessmentRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(config.publicDir, {
  etag: false,
  index: false,
  lastModified: false,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Vector-Build', config.buildId);
  }
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

module.exports = { app, config };
