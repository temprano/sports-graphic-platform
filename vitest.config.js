// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
      // These areas require 100% coverage — see tests/README.md
      // Enforced via separate per-file thresholds in CI
      exclude: [
        'tests/**',
        '*.config.*',
        'ecosystem.config.cjs'
      ]
    }
  }
});
