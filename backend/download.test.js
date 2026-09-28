const http = require('http');
const { app, reportDownloadName } = require('./server');

describe('report download', () => {
  test('sanitizes download filenames', () => {
    expect(reportDownloadName('VECTOR-Report-Jane Doe.html')).toBe('VECTOR-Report-Jane_Doe.html');
    expect(reportDownloadName('../secret.pdf')).toBe('.._secret.pdf');
  });

  test('POST /api/download-report returns an attachment', (done) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      const body = 'html=' + encodeURIComponent('<html><body>VECTOR</body></html>')
        + '&filename=' + encodeURIComponent('VECTOR-Report-Test.html');
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: '/api/download-report',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body)
        }
      }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          server.close();
          try {
            expect(res.statusCode).toBe(200);
            expect(String(res.headers['content-disposition'] || '')).toMatch(/attachment/);
            expect(Buffer.concat(chunks).toString()).toContain('VECTOR');
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      req.on('error', (err) => {
        server.close();
        done(err);
      });
      req.write(body);
      req.end();
    });
  });
});
