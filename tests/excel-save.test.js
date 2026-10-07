const fs = require('fs');
const ExcelJS = require('exceljs');
const request = require('supertest');
const { app, config } = require('../src/app');

describe('Excel assessment save', () => {
  afterAll(() => {
    try { fs.unlinkSync(config.dataFile); } catch (e) { /* ignore */ }
    try { fs.unlinkSync(config.jsonlFile); } catch (e) { /* ignore */ }
  });

  test('writes a Results row after a completed assessment', async () => {
    const login = await request(app).post('/api/auth/otp').send({
      email: 'save-test@example.com',
      emp_id: 'EMP-1',
      name: 'Save Test',
      role: 'hr'
    });
    expect(login.status).toBe(200);
    expect(login.body.devOtp).toBeTruthy();

    const verified = await request(app).post('/api/auth/verify').send({
      email: 'save-test@example.com',
      otp: login.body.devOtp
    });
    expect(verified.status).toBe(200);
    expect(verified.body.token).toBeTruthy();

    const responses = {};
    ['V', 'E', 'C'].forEach((d) => {
      for (let i = 1; i <= 5; i++) responses[`${d}${i}`] = 4;
    });
    ['O', 'T', 'R'].forEach((d) => {
      for (let i = 1; i <= 5; i++) responses[`${d}${i}`] = 5;
    });

    const saved = await request(app)
      .post('/api/assessments')
      .set('Authorization', 'Bearer ' + verified.body.token)
      .send({ responses });
    expect(saved.status).toBe(200);
    expect(saved.body.success).toBe(true);
    expect(saved.body.report.vector_sign).toMatch(/^V[1-5]-[VECTOR]$/);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(config.dataFile);
    const results = workbook.getWorksheet('Results');
    expect(results.rowCount).toBeGreaterThan(1);
    expect(results.getRow(2).getCell(1).value).toBe('save-test@example.com');
    expect(results.getRow(2).getCell(3).value).toBe('Save Test');
    expect(results.getRow(2).getCell(5).value).toBe(1);
    expect(results.getRow(2).getCell(6).value).toBe(5);
    expect(results.getRow(2).getCell(15).value).toBe('Defining');
    expect(String(results.getRow(2).getCell(12).value || '')).toMatch(/^V[1-5]-[VECTOR]$/);

    const users = workbook.getWorksheet('Users');
    expect(users.rowCount).toBeGreaterThan(1);
    expect(users.getRow(2).getCell(2).value).toBe('save-test@example.com');
    expect(users.getRow(2).getCell(7).value).toBe(1);

    const jsonl = fs.readFileSync(config.jsonlFile, 'utf8');
    expect(jsonl).toContain('"type":"login"');
    expect(jsonl).toContain('"type":"result"');
  });
});
