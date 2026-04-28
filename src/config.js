/**
 * src/config.js
 *
 * Central configuration module. All environment variables are read
 * here and validated at startup. Never use process.env directly
 * elsewhere in the codebase — always import from this module.
 *
 * Fails fast with a clear error if required vars are missing.
 */

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Check your .env file against .env.example`
    );
  }
  return value;
}

function optional(key, defaultValue = null) {
  return process.env[key] ?? defaultValue;
}

export const config = {
  env: optional('NODE_ENV', 'development'),

  appwrite: {
    endpoint:  required('APPWRITE_ENDPOINT'),
    projectId: required('APPWRITE_PROJECT_ID'),
    apiKey:    required('APPWRITE_API_KEY'),
    databaseId: optional('APPWRITE_DATABASE_ID', 'sports-graphics'),
  },

  // Storage mode controls single-bucket (dev) vs multi-bucket (prod) layout.
  // Set STORAGE_MODE=prod in production environment after migrating to VPS.
  // See src/lib/storage.js for full explanation.
  storage: {
    mode: optional('STORAGE_MODE', 'dev'), // 'dev' | 'prod'
  },

  stripe: {
    secretKey:      required('STRIPE_SECRET_KEY'),
    webhookSecret:  required('STRIPE_WEBHOOK_SECRET'),
    publishableKey: required('STRIPE_PUBLISHABLE_KEY'),
  },

  redis: {
    host: optional('REDIS_HOST', 'localhost'),
    port: parseInt(optional('REDIS_PORT', '6379'), 10),
  },

  comfyui: {
    baseUrl: optional('COMFYUI_BASE_URL', 'http://localhost:8188'),
  },

  prodigi: {
    apiKey: optional('PRODIGI_API_KEY'),
    apiUrl: optional('PRODIGI_API_URL', 'https://api.prodigi.com/v4.0'),
  },

  app: {
    url: optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  },
};