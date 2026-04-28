// ecosystem.config.cjs
// PM2 process configuration for VPS deployment
// CJS required by PM2 — do not convert to ESM

module.exports = {
  apps: [
    {
      name: 'sgp-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'sgp-worker',
      script: './components/2-automation-pipeline/src/queue/worker.js',
      interpreter: 'node',
      interpreter_args: '--experimental-vm-modules',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production'
      },
      // Restart worker if it crashes, with backoff
      exp_backoff_restart_delay: 100,
      max_restarts: 10
    }
  ]
};
