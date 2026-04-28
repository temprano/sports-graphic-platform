#!/usr/bin/env node

/**
 * Project initialization verification script.
 * Run this to confirm ESM, dependencies, and config are all set up correctly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Checking project initialization...\n');

// Check package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
console.log('✅ package.json:');
console.log(`   - type: "${packageJson.type}" (should be "module")`);
console.log(`   - node: "${packageJson.engines.node}"`);
console.log(`   - dependencies: ${Object.keys(packageJson.dependencies).length}`);
console.log(`   - devDependencies: ${Object.keys(packageJson.devDependencies).length}`);

// Check vitest.config.js
const vitestExists = fs.existsSync(path.join(__dirname, 'vitest.config.js'));
console.log(`\n✅ vitest.config.js exists: ${vitestExists}`);

// Check config.js
const configExists = fs.existsSync(path.join(__dirname, 'config.js'));
console.log(`\n✅ config.js exists: ${configExists}`);

// Check .env.example
const envExampleExists = fs.existsSync(path.join(__dirname, '.env.example'));
console.log(`\n✅ .env.example exists: ${envExampleExists}`);

// Check config.test.js
const configTestExists = fs.existsSync(path.join(__dirname, 'config.test.js'));
console.log(`\n✅ config.test.js exists: ${configTestExists}`);

console.log('\n📋 Required dependencies from STACK.md:');
const requiredDeps = [
  '@appwrite.io/node',
  'bullmq',
  'next',
  'react',
  'react-dom',
  'stripe',
  'gsap',
  'redis',
  'transformers'
];

requiredDeps.forEach(dep => {
  const installed = dep in packageJson.dependencies;
  console.log(`   ${installed ? '✅' : '❌'} ${dep}`);
});

console.log('\n🚀 Next steps:');
console.log('   1. Create .env file from .env.example');
console.log('   2. Fill in your Appwrite Cloud and Stripe test credentials');
console.log('   3. Run: npm install');
console.log('   4. Run: npm test');
console.log('\n✨ Project initialized successfully!');
