#!/usr/bin/env node
import { spawn } from 'child_process';

const args = ['test', '--', 'src/orders/payment-flows.test.js'];
const proc = spawn('npm', args, { stdio: 'inherit' });

process.on('SIGTERM', () => {
  proc.kill('SIGTERM');
});

proc.on('exit', (code) => {
  process.exit(code);
});
