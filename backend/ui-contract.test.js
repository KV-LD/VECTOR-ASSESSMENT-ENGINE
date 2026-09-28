const fs = require('fs');
const path = require('path');
const http = require('http');
const { app, BUILD_ID } = require('./server');

describe('assessment UI contract', () => {
  const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
  const admin = fs.readFileSync(path.join(__dirname, '../frontend/admin.html'), 'utf8');

  test('serves FIX-9 UST branding and a visible OTP panel', () => {
    expect(html).toContain('BUILD FIX-9');
    expect(html).toContain('#006E74');
    expect(html).toContain('id="otpRow"');
    expect(html).toContain('id="otpDigits"');
    expect(html).toContain('vectorLiveBanner');
    expect(html).not.toMatch(/id="otpRow" style="display:none"/);
    expect(html).not.toMatch(/Pre-Program|Post-Program|attemptType|ASSESSMENT TYPE/);
    expect(html).toContain('Download as PDF');
  });

  test('admin no longer uses pre/post assessment filters', () => {
    expect(admin).not.toMatch(/Pre-Program|Post-Program/);
    expect(admin).toContain('#006E74');
  });

  test('HTTP / and /api/version return FIX-9', (done) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      http.get({ hostname: '127.0.0.1', port, path: '/api/version' }, (verRes) => {
        const verChunks = [];
        verRes.on('data', (c) => verChunks.push(c));
        verRes.on('end', () => {
          const version = JSON.parse(Buffer.concat(verChunks).toString());
          expect(version.build).toBe(BUILD_ID);
          expect(version.build).toBe('FIX-9');
          http.get({ hostname: '127.0.0.1', port, path: '/?v=FIX-9' }, (pageRes) => {
            const pageChunks = [];
            pageRes.on('data', (c) => pageChunks.push(c));
            pageRes.on('end', () => {
              server.close();
              const page = Buffer.concat(pageChunks).toString();
              expect(pageRes.headers['x-vector-build']).toBe('FIX-9');
              expect(page).toContain('BUILD FIX-9');
              expect(page).toContain('otpDigits');
              expect(page).not.toMatch(/Pre-Program/);
              done();
            });
          }).on('error', (err) => {
            server.close();
            done(err);
          });
        });
      }).on('error', (err) => {
        server.close();
        done(err);
      });
    });
  });
});
