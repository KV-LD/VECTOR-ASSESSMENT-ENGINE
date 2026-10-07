const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { app, config } = require('../src/app');

describe('assessment UI contract', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  const admin = fs.readFileSync(path.join(__dirname, '../public/admin.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/app.css'), 'utf8');

  test('serves V2 UST branding and a visible OTP panel', () => {
    expect(html).toContain('BUILD V2');
    expect(html).toContain('id="otpRow"');
    expect(html).toContain('id="otpDigits"');
    expect(html).toContain('vectorLiveBanner');
    expect(html).not.toMatch(/Pre-Program|Post-Program|attemptType|ASSESSMENT TYPE/);
    expect(html).toContain('Download as PDF');
    expect(css).toContain('#006E74');
    expect(appJs).toContain('/api/auth/otp');
    expect(appJs).toContain('/api/assessments');
  });

  test('admin no longer uses pre/post assessment filters', () => {
    expect(admin).not.toMatch(/Pre-Program|Post-Program/);
    expect(admin).toContain('BUILD V2');
  });

  test('HTTP / and /api/version return current build', async () => {
    const version = await request(app).get('/api/version');
    expect(version.status).toBe(200);
    expect(version.body.build).toBe(config.buildId);
    expect(version.body.storage).toBe('excel');

    const page = await request(app).get('/');
    expect(page.headers['x-vector-build']).toBe(config.buildId);
    expect(page.text).toContain(`VECTOR BUILD ${config.buildId}`);
    expect(page.text).toContain('otpDigits');
    expect(page.text).not.toMatch(/Pre-Program/);
  });

  test('health endpoint is Azure-ready', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.ok).toBe(true);
  });
});
