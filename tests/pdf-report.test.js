const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { PDFDocument } = require('pdf-lib');
const { app } = require('../src/app');
const { generateReport, calculateScores } = require('../src/scoring');
const { questionsForRole } = require('../src/questions');
const { buildReportPdf } = require('../src/pdf-report');

function sampleReport() {
  const questions = questionsForRole('eng');
  const responses = {};
  questions.forEach((q) => { responses[q.id] = q.type === 'sit' ? 4 : 5; });
  const scores = calculateScores(responses, questions);
  return generateReport(scores, responses, { role: 'eng', name: 'PDF Tester' });
}

describe('VECTOR PDF report', () => {
  test('server PDF is a real document with class/sign and without extra sections', async () => {
    const report = sampleReport();
    const buffer = await buildReportPdf({ report, name: 'PDF Tester' });
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1200);
    const loaded = await PDFDocument.load(buffer);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(loaded.getPageCount()).toBeLessThanOrEqual(3);
    const src = fs.readFileSync(path.join(__dirname, '../src/pdf-report.js'), 'utf8');
    expect(src).toContain('Dimension profile');
    expect(src).toContain('Profile interpretation');
    expect(src).not.toContain('Characteristic Profile');
    expect(src).not.toContain('Next Vector Move');
    expect(src).not.toContain('VECTOR Scale');
    expect(src).not.toContain('VECTOR BUILD');
  });

  test('POST /api/report-pdf returns an attachment PDF', async () => {
    const otp = await request(app).post('/api/auth/otp').send({
      email: 'pdf-test@example.com',
      emp_id: 'EMP-PDF',
      name: 'PDF Tester',
      role: 'eng'
    });
    const verified = await request(app).post('/api/auth/verify').send({
      email: 'pdf-test@example.com',
      otp: otp.body.devOtp
    });
    const report = sampleReport();
    const pdf = await request(app)
      .post('/api/report-pdf')
      .set('Authorization', 'Bearer ' + verified.body.token)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .send({ report, name: 'PDF Tester' });
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toMatch(/pdf/);
    expect(pdf.headers['content-disposition']).toMatch(/VECTOR-Report-PDF-Tester\.pdf/);
    const body = Buffer.isBuffer(pdf.body) ? pdf.body : Buffer.from(pdf.body);
    expect(body.slice(0, 4).toString()).toBe('%PDF');
  });
});
