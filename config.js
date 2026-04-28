/**
 * Environment configuration with startup validation.
 * Reads from .env and fails fast if required vars are missing.
 * Use this module instead of process.env directly throughout the app.
 */

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key, defaultValue = '') {
  return process.env[key] ?? defaultValue;
}

/**
 * Validate all required environment variables at startup.
 * Called on module import to fail fast.
 */
function validateConfig() {
  const errors = [];

  // Appwrite
  try {
    required('APPWRITE_ENDPOINT');
    required('APPWRITE_PROJECT_ID');
    required('APPWRITE_API_KEY');
  } catch (e) {
    errors.push(e.message);
  }

  // Stripe
  try {
    required('STRIPE_SECRET_KEY');
    required('STRIPE_PUBLISHABLE_KEY');
    required('STRIPE_WEBHOOK_SECRET');
  } catch (e) {
    errors.push(e.message);
  }

  // Redis
  try {
    required('REDIS_HOST');
    required('REDIS_PORT');
  } catch (e) {
    errors.push(e.message);
  }

  // Application
  try {
    required('NODE_ENV');
    required('NEXT_PUBLIC_APP_URL');
  } catch (e) {
    errors.push(e.message);
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error('Missing required environment variables. See .env.example');
  }
}

// Run validation on import
validateConfig();

/**
 * Exported configuration object.
 * Access config values via: import { config } from './config.js'
 */
export const config = {
  // Appwrite
  appwrite: {
    endpoint: required('APPWRITE_ENDPOINT'),
    projectId: required('APPWRITE_PROJECT_ID'),
    apiKey: required('APPWRITE_API_KEY'),
    buckets: {
      uploads: optional('APPWRITE_BUCKET_UPLOADS'),
      proofs: optional('APPWRITE_BUCKET_PROOFS'),
      finals: optional('APPWRITE_BUCKET_FINALS'),
      previews: optional('APPWRITE_BUCKET_PREVIEWS'),
    },
  },

  // Stripe
  stripe: {
    secretKey: required('STRIPE_SECRET_KEY'),
    publishableKey: required('STRIPE_PUBLISHABLE_KEY'),
    webhookSecret: required('STRIPE_WEBHOOK_SECRET'),
  },

  // Redis / BullMQ
  redis: {
    host: required('REDIS_HOST'),
    port: parseInt(required('REDIS_PORT'), 10),
    password: optional('REDIS_PASSWORD'),
  },

  // ComfyUI
  comfyui: {
    baseUrl: optional('COMFYUI_BASE_URL', 'http://localhost:8188'),
    apiKey: optional('COMFYUI_API_KEY'),
  },

  // Fulfillment providers
  prodigi: {
    apiKey: optional('PRODIGI_API_KEY'),
    apiUrl: optional('PRODIGI_API_URL', 'https://api.prodigi.com/v4.0'),
  },

  printful: {
    apiKey: optional('PRINTFUL_API_KEY'),
    apiUrl: optional('PRINTFUL_API_URL', 'https://api.printful.com'),
  },

  // Application
  app: {
    url: required('NEXT_PUBLIC_APP_URL'),
    env: required('NODE_ENV'),
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
  },

  // Paths
  paths: {
    brands: optional('BRANDS_PATH', './components/3-asset-generation/brands'),
    orderTemp: optional('ORDERS_TEMP_PATH', './tmp/orders'),
  },

  // Security
  security: {
    proofUrlExpirySecs: parseInt(optional('PROOF_URL_EXPIRY_SECONDS', '900'), 10),
    downloadExpirySecs: parseInt(optional('DOWNLOAD_EXPIRY_SECONDS', '172800'), 10),
  },
};

export default config;
