const { spawnSync } = require('child_process');
const path = require('path');

function canLoad(name) {
  try {
    require.resolve(name);
    return true;
  } catch (error) {
    return false;
  }
}

const root = path.join(__dirname, '..');
const needed = ['express', 'jsonwebtoken', 'exceljs', 'bcryptjs', 'nodemailer'];
const missing = needed.filter((name) => !canLoad(name));

if (missing.length) {
  console.log('Missing packages: ' + missing.join(', '));
  console.log('Running npm install (needed after git pull)...');
  const install = spawnSync('npm', ['install'], {
    cwd: root,
    stdio: 'inherit',
    shell: true
  });
  if (install.status !== 0) {
    console.error('npm install did not finish cleanly. From the project folder run: npm install');
  }
}

const server = spawnSync(process.execPath, [path.join(__dirname, 'server.js')], {
  cwd: root,
  stdio: 'inherit'
});
process.exit(server.status == null ? 0 : server.status);
