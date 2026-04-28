// tests/helpers/mock-stripe.js
// Mock Stripe SDK for unit tests

import depositWebhook from '../fixtures/stripe/deposit-webhook.json' assert { type: 'json' };
import balanceWebhook from '../fixtures/stripe/balance-webhook.json' assert { type: 'json' };

export { depositWebhook, balanceWebhook };

export function createMockStripe() {
  return {
    webhooks: {
      constructEvent: (body, signature, secret) => {
        if (signature === 'bad_signature') {
          throw new Error('Webhook signature verification failed');
        }
        return JSON.parse(body.toString());
      }
    },
    paymentIntents: {
      create: async (params, options) => ({
        id: `pi_mock_${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        status: 'requires_payment_method',
        metadata: params.metadata || {},
        client_secret: `pi_mock_secret_${Date.now()}`
      })
    }
  };
}
