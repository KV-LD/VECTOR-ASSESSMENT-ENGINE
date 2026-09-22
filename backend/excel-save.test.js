const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const ExcelJS = require('exceljs');

process.env.VECTOR_DATA_FILE = path.join(os.tmpdir(), `vector-save-${process.pid}.xlsx`);

const { app } = require('./server');

function postJson(port, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        let json = {};
        try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }
        resolve({ status: res.statusCode, json });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

describe('Excel assessment save', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = app.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(() => {
      try { fs.unlinkSync(process.env.VECTOR_DATA_FILE); } catch (e) { /* ignore */ }
      done();
    });
  });

  test('writes a Results row after a completed assessment', async () => {
    const login = await postJson(port, '/api/otp/request', {
      email: 'save-test@example.com',
      emp_id: 'EMP-1',
      name: 'Save Test',
      role: 'hr'
    });
    expect(login.status).toBe(200);
    expect(login.json.devOtp).toBeTruthy();
    const verified = await postJson(port, '/api/otp/verify', {
      email: 'save-test@example.com',
      otp: login.json.devOtp
    });
    expect(verified.status).toBe(200);
    expect(verified.json.token).toBeTruthy();

    const responses = {};
    ['V', 'E', 'C'].forEach((d) => {
      for (let i = 1; i <= 5; i++) responses[`${d}${i}`] = 4;
    });
    ['O', 'T', 'R'].forEach((d) => {
      for (let i = 1; i <= 5; i++) responses[`${d}${i}`] = 5;
    });

    const saved = await postJson(port, '/api/save-assessment', { responses }, {
      Authorization: 'Bearer ' + verified.json.token
    });
    expect(saved.status).toBe(200);
    expect(saved.json.success).toBe(true);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(process.env.VECTOR_DATA_FILE);
    const results = workbook.getWorksheet('Results');
    expect(results.rowCount).toBeGreaterThan(1);
    expect(results.getRow(2).getCell(1).value).toBe('save-test@example.com');
    expect(results.getRow(2).getCell(3).value).toBe('Save Test');
    expect(String(results.getRow(2).getCell(12).value || '')).toMatch(/^V[1-5]-[VECTOR]$/);
  });
});
