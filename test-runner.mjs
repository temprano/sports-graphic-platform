#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

try {
  const { stdout, stderr } = await execAsync('npm test -- src/orders/payment-flows.test.js', {
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024,
  });
  
  console.log(stdout);
  if (stderr) console.error(stderr);
  process.exit(0);
} catch (error) {
  console.error(error.message);
  console.log(error.stdout);
  console.error(error.stderr);
  process.exit(1);
}
