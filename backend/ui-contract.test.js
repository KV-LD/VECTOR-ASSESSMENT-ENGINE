const fs = require('fs');
const path = require('path');

describe('assessment UI contract', () => {
  const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
  const admin = fs.readFileSync(path.join(__dirname, '../frontend/admin.html'), 'utf8');

  test('serves FIX-8 UST branding and a visible OTP panel', () => {
    expect(html).toContain('BUILD FIX-8');
    expect(html).toContain('#006E74');
    expect(html).toContain('id="otpRow"');
    expect(html).toContain('id="otpDigits"');
    expect(html).not.toMatch(/id="otpRow" style="display:none"/);
    expect(html).not.toMatch(/Pre-Program|Post-Program|attemptType|ASSESSMENT TYPE/);
    expect(html).toContain('Download as PDF');
  });

  test('admin no longer uses pre/post assessment filters', () => {
    expect(admin).not.toMatch(/Pre-Program|Post-Program/);
    expect(admin).toContain('#006E74');
  });
});
