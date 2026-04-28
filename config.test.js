import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('config.js', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should load valid config when all required vars are set', async () => {
    // Setup all required env vars
    process.env.APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
    process.env.APPWRITE_PROJECT_ID = 'test-project';
    process.env.APPWRITE_API_KEY = 'test-api-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    // Dynamically import to trigger validation
    const { config } = await import('./config.js');

    expect(config.appwrite.endpoint).toBe('https://cloud.appwrite.io/v1');
    expect(config.appwrite.projectId).toBe('test-project');
    expect(config.stripe.secretKey).toBe('sk_test_123');
    expect(config.redis.host).toBe('localhost');
    expect(config.redis.port).toBe(6379);
    expect(config.app.isDev).toBe(true);
  });

  it('should use optional defaults when env vars are not set', async () => {
    // Setup only required vars
    process.env.APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
    process.env.APPWRITE_PROJECT_ID = 'test-project';
    process.env.APPWRITE_API_KEY = 'test-api-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    delete process.env.COMFYUI_BASE_URL;
    delete process.env.BRANDS_PATH;

    const { config } = await import('./config.js');

    expect(config.comfyui.baseUrl).toBe('http://localhost:8188');
    expect(config.paths.brands).toBe('./components/3-asset-generation/brands');
  });
});
