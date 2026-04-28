// tests/helpers/create-test-order.js
// Factory for creating test order objects

export function createTestOrder(overrides = {}) {
  return {
    id: 'ord_test_001',
    customerId: 'cust_test_001',
    teamId: 'team_test_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: 'PENDING_PAYMENT',
    payment: {
      depositIntentId: null,
      depositAmount: 12500,
      depositPaidAt: null,
      balanceIntentId: null,
      balanceAmount: 12500,
      balancePaidAt: null,
      currency: 'usd',
      totalGross: 25000
    },
    fulfillment: {
      provider: 'prodigi',
      orderId: null,
      shippingCost: null
    },
    financial: {
      gross: 25000,
      stripeFees: 0,
      fulfillmentCost: 0,
      profit: 0
    },
    proofLog: [],
    deliveryLog: {
      downloadLink: null,
      downloadExpiry: null,
      downloadUsed: false,
      downloadUsedAt: null
    },
    parentStoreId: null,
    ...overrides
  };
}

export function createTestPlayer(overrides = {}) {
  return {
    id: 'player_test_001',
    teamId: 'team_test_001',
    name: 'Test Player',
    firstName: 'Test',
    lastName: 'Player',
    number: '99',
    position: 'Guard',
    photo: {
      original: 'tests/fixtures/players/valid-photo.jpg',
      cutout: 'tests/fixtures/players/valid-cutout.png',
      focalPoint: { x: 0.5, y: 0.3 }
    },
    stats: { ppg: 10.0, apg: 5.0 },
    consentLog: {
      backgroundRemoval: true,
      colorAdjustment: true,
      poseAdjustment: false,
      aiMotion: false,
      marketingUse: false,
      signedBy: 'user_test_001',
      timestamp: new Date().toISOString(),
      ipAddress: 'hashed',
      orderVersion: '1.0'
    },
    ...overrides
  };
}
