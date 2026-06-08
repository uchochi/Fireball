import { spawn } from 'node:child_process';

const children = [];

function start(name, command) {
  const proc = spawn('node', [command], {
    stdio: 'inherit',
    env: process.env,
  });
  children.push(proc);
  proc.on('exit', (code) => {
    console.error(`[${name}] exited with code ${code}`);
    setTimeout(() => process.exit(1), 1000);
  });
}

start('api', 'apps/api/dist/index.js');
start('bot', 'apps/bot/dist/index.js');

process.on('SIGINT', () => children.forEach((p) => p.kill('SIGINT')));
process.on('SIGTERM', () => children.forEach((p) => p.kill('SIGTERM')));
