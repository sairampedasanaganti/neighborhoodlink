const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\n====================================================');
console.log(' 🏘️  NeighborLink — Smart Neighborhood Support System');
console.log('====================================================\n');

const baseDir = __dirname;
const serverDir = path.join(baseDir, 'server');
const clientDir = path.join(baseDir, 'client');

console.log(`[1/2] Starting Backend Server in ${serverDir}...`);
const serverProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true,
});

console.log(`[2/2] Starting Frontend Client in ${clientDir}...`);
const clientProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true,
});

serverProcess.on('error', (err) => console.error('[Server Error]:', err));
clientProcess.on('error', (err) => console.error('[Client Error]:', err));

function cleanup() {
  console.log('\n[NeighborLink] Shutting down all processes...');
  if (serverProcess) serverProcess.kill();
  if (clientProcess) clientProcess.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
