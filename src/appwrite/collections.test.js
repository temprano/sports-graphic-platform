/**
 * src/appwrite/collections.test.js
 *
 * CRUD helper functions for all Appwrite collections.
 * Tests cover create, read, update, delete operations with
 * proper error handling and schema validation.
 *
 * Collections tested:
 *   - orders
 *   - customers
 *   - teams
 *   - players
 *   - consent_logs
 *   - proof_approvals
 *   - financial_records
 *   - parent_orders
 *   - brands
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock config first to prevent environment variable validation
vi.mock('../config.js', () => ({
  config: {
    appwrite: {
      endpoint: 'http://localhost:80/v1',
      projectId: 'test-project',
      apiKey: 'test-key',
      databaseId: 'sports-graphics',
    },
  },
}));

// Mock the Appwrite client
vi.mock('./client.js', () => ({
  databases: {
    createDocument: vi.fn(),
    getDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    listDocuments: vi.fn(),
  },
}));

import { ID, Query } from 'node-appwrite';
import {
  createOrder,
  getOrder,
  updateOrder,
  deleteOrder,
  createCustomer,
  getCustomer,
  updateCustomer,
  createTeam,
  getTeam,
  createPlayer,
  getPlayer,
  updatePlayer,
  createConsentLog,
  getConsentLog,
  getConsentLogsByOrder,
  createProofApproval,
  getProofApproval,
  createFinancialRecord,
  getFinancialRecord,
  createParentOrder,
  getParentOrder,
  updateParentOrder,
  createBrand,
  getBrand,
  getBrandBySlug,
  listActiveBrands,
} from './crud.js';

// Import after mocking
import { databases } from './client.js';
import { DB, COLLECTIONS } from './collections.js';

const mockId = 'test_123';
const mockTimestamp = new Date().toISOString();

describe('Collections CRUD — Orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an order with all required fields', async () => {
    const orderData = {
      customerId: 'cust_001',
      teamId: 'team_001',
      state: 'PENDING_PAYMENT',
      depositAmount: 12500,
      balanceAmount: 12500,
      currency: 'usd',
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
    };

    databases.createDocument.mockResolvedValue({ $id: mockId, ...orderData });

    const result = await createOrder(orderData);

    expect(databases.createDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.ORDERS,
      expect.any(String),
      orderData
    );
    expect(result.$id).toBe(mockId);
    expect(result.state).toBe('PENDING_PAYMENT');
  });

  it('should get an order by ID', async () => {
    const orderData = { $id: mockId, customerId: 'cust_001', state: 'PENDING_PAYMENT' };
    databases.getDocument.mockResolvedValue(orderData);

    const result = await getOrder(mockId);

    expect(databases.getDocument).toHaveBeenCalledWith(DB, COLLECTIONS.ORDERS, mockId);
    expect(result.$id).toBe(mockId);
  });

  it('should update an order state', async () => {
    const updateData = { state: 'IN_PRODUCTION', updatedAt: mockTimestamp };
    const updatedOrder = { $id: mockId, ...updateData };

    databases.updateDocument.mockResolvedValue(updatedOrder);

    const result = await updateOrder(mockId, updateData);

    expect(databases.updateDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.ORDERS,
      mockId,
      updateData
    );
    expect(result.state).toBe('IN_PRODUCTION');
  });

  it('should throw error when updating with invalid state', async () => {
    const invalidUpdate = { state: 'INVALID_STATE' };

    await expect(updateOrder(mockId, invalidUpdate)).rejects.toThrow(
      'Invalid order state'
    );
  });

  it('should delete an order', async () => {
    databases.deleteDocument.mockResolvedValue({});

    await deleteOrder(mockId);

    expect(databases.deleteDocument).toHaveBeenCalledWith(DB, COLLECTIONS.ORDERS, mockId);
  });
});

describe('Collections CRUD — Customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a customer with required fields', async () => {
    const customerData = {
      name: 'Coach Rivera',
      email: 'coach@school.edu',
      phone: '555-1234',
      school: 'Phoenix High School',
      sport: 'basketball',
      createdAt: mockTimestamp,
    };

    databases.createDocument.mockResolvedValue({ $id: mockId, ...customerData });

    const result = await createCustomer(customerData);

    expect(databases.createDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.CUSTOMERS,
      expect.any(String),
      customerData
    );
    expect(result.email).toBe('coach@school.edu');
  });

  it('should get a customer by ID', async () => {
    const customerData = { $id: mockId, name: 'Coach Rivera', email: 'coach@school.edu' };
    databases.getDocument.mockResolvedValue(customerData);

    const result = await getCustomer(mockId);

    expect(databases.getDocument).toHaveBeenCalledWith(DB, COLLECTIONS.CUSTOMERS, mockId);
    expect(result.name).toBe('Coach Rivera');
  });

  it('should update a customer', async () => {
    const updateData = { phone: '555-9999' };
    const updated = { $id: mockId, ...updateData };

    databases.updateDocument.mockResolvedValue(updated);

    const result = await updateCustomer(mockId, updateData);

    expect(databases.updateDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.CUSTOMERS,
      mockId,
      updateData
    );
    expect(result.phone).toBe('555-9999');
  });
});

describe('Collections CRUD — Teams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a team with team.json data', async () => {
    const teamData = {
      customerId: 'cust_001',
      brandId: 'cinematic-dark',
      teamName: 'Westview Hawks',
      school: 'Westview High School',
      sport: 'basketball',
      season: '2026-spring',
      teamJson: JSON.stringify({ players: [] }),
      createdAt: mockTimestamp,
    };

    databases.createDocument.mockResolvedValue({ $id: mockId, ...teamData });

    const result = await createTeam(teamData);

    expect(databases.createDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.TEAMS,
      expect.any(String),
      expect.objectContaining({
        customerId: 'cust_001',
        brandId: 'cinematic-dark',
      })
    );
    expect(result.teamName).toBe('Westview Hawks');
  });

  it('should get a team by ID', async () => {
    const teamData = {
      $id: mockId,
      teamName: 'Westview Hawks',
      sport: 'basketball',
    };
    databases.getDocument.mockResolvedValue(teamData);

    const result = await getTeam(mockId);

    expect(databases.getDocument).toHaveBeenCalledWith(DB, COLLECTIONS.TEAMS, mockId);
    expect(result.teamName).toBe('Westview Hawks');
  });
});

describe('Collections CRUD — Players', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a player with all fields', async () => {
    const playerData = {
      teamId: 'team_001',
      orderId: 'ord_001',
      firstName: 'Jordan',
      lastName: 'Smith',
      slug: 'jordan-smith',
      number: '12',
      position: 'Point Guard',
      year: 'Senior',
      photo: JSON.stringify({ original: './smith.png', focalPoint: { x: 0.5, y: 0.3 } }),
      stats: JSON.stringify({ ppg: 18.4, apg: 6.1 }),
      createdAt: mockTimestamp,
    };

    databases.createDocument.mockResolvedValue({ $id: mockId, ...playerData });

    const result = await createPlayer(playerData);

    expect(databases.createDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.PLAYERS,
      expect.any(String),
      expect.objectContaining({
        firstName: 'Jordan',
        lastName: 'Smith',
      })
    );
    expect(result.number).toBe('12');
  });

  it('should get a player by ID', async () => {
    const playerData = {
      $id: mockId,
      firstName: 'Jordan',
      lastName: 'Smith',
      number: '12',
    };
    databases.getDocument.mockResolvedValue(playerData);

    const result = await getPlayer(mockId);

    expect(databases.getDocument).toHaveBeenCalledWith(DB, COLLECTIONS.PLAYERS, mockId);
    expect(result.firstName).toBe('Jordan');
  });

  it('should update a player', async () => {
    const updateData = { position: 'Shooting Guard' };
    const updated = { $id: mockId, ...updateData };

    databases.updateDocument.mockResolvedValue(updated);

    const result = await updatePlayer(mockId, updateData);

    expect(databases.updateDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.PLAYERS,
      mockId,
      updateData
    );
    expect(result.position).toBe('Shooting Guard');
  });
});

describe('Collections CRUD — Consent Logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a consent log with all flags', async () => {
    const consentData = {
      playerId: 'player_001',
      orderId: 'ord_001',
      backgroundRemoval: true,
      colorAdjustment: true,
      poseAdjustment: false,
      aiMotion: false,
      marketingUse: false,
      signedBy: 'user_parent_001',
      timestamp: mockTimestamp,
      ipAddress: 'hashed_ip',
      orderVersion: '1.0',
    };

    databases.createDocument.mockResolvedValue({ $id: mockId, ...consentData });

    const result = await createConsentLog(consentData);

    expect(databases.createDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.CONSENT_LOGS,
      expect.any(String),
      expect.objectContaining({
        playerId: 'player_001',
        backgroundRemoval: true,
      })
    );
    expect(result.aiMotion).toBe(false); // default
  });

  it('should get a consent log by ID', async () => {
    const consentData = {
      $id: mockId,
      playerId: 'player_001',
      backgroundRemoval: true,
    };
    databases.getDocument.mockResolvedValue(consentData);

    const result = await getConsentLog(mockId);

    expect(databases.getDocument).toHaveBeenCalledWith(DB, COLLECTIONS.CONSENT_LOGS, mockId);
    expect(result.backgroundRemoval).toBe(true);
  });

  it('should list consent logs by order ID', async () => {
    const consentLogs = [
      { $id: 'log_1', playerId: 'player_001', orderId: 'ord_001' },
      { $id: 'log_2', playerId: 'player_002', orderId: 'ord_001' },
    ];

    databases.listDocuments.mockResolvedValue({ documents: consentLogs });

    const result = await getConsentLogsByOrder('ord_001');

    expect(databases.listDocuments).toHaveBeenCalledWith(DB, COLLECTIONS.CONSENT_LOGS, expect.any(Array));
    expect(result).toHaveLength(2);
    expect(result[0].orderId).toBe('ord_001');
  });
});

describe('Collections CRUD — Proof Approvals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a proof approval record', async () => {
    const approvalData = {
      orderId: 'ord_001',
      version: 1,
      action: 'APPROVED',
      approvedBy: 'user_coach_001',
      timestamp: mockTimestamp,
      ipAddress: 'hashed_ip',
      notes: 'Looks great!',
    };

    databases.createDocument.mockResolvedValue({ $id: mockId, ...approvalData });

    const result = await createProofApproval(approvalData);

    expect(databases.createDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.PROOF_APPROVALS,
      expect.any(String),
      expect.objectContaining({
        orderId: 'ord_001',
        action: 'APPROVED',
      })
    );
    expect(result.action).toBe('APPROVED');
  });

  it('should get a proof approval by ID', async () => {
    const approvalData = { $id: mockId, orderId: 'ord_001', action: 'APPROVED' };
    databases.getDocument.mockResolvedValue(approvalData);

    const result = await getProofApproval(mockId);

    expect(databases.getDocument).toHaveBeenCalledWith(DB, COLLECTIONS.PROOF_APPROVALS, mockId);
    expect(result.action).toBe('APPROVED');
  });
});

describe('Collections CRUD — Financial Records', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a financial record', async () => {
    const financialData = {
      orderId: 'ord_001',
      stripeEventId: 'evt_123',
      stripeIntentId: 'pi_001',
      paymentStage: 'deposit',
      status: 'succeeded',
      gross: 25000,
      stripeFee: 750,
      fulfillmentCost: 5000,
      profit: 19250,
      currency: 'usd',
      timestamp: mockTimestamp,
    };

    databases.createDocument.mockResolvedValue({ $id: mockId, ...financialData });

    const result = await createFinancialRecord(financialData);

    expect(databases.createDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.FINANCIAL_RECORDS,
      expect.any(String),
      expect.objectContaining({
        orderId: 'ord_001',
        paymentStage: 'deposit',
      })
    );
    expect(result.profit).toBe(19250);
  });

  it('should get a financial record by ID', async () => {
    const recordData = {
      $id: mockId,
      orderId: 'ord_001',
      paymentStage: 'deposit',
      profit: 19250,
    };
    databases.getDocument.mockResolvedValue(recordData);

    const result = await getFinancialRecord(mockId);

    expect(databases.getDocument).toHaveBeenCalledWith(DB, COLLECTIONS.FINANCIAL_RECORDS, mockId);
    expect(result.profit).toBe(19250);
  });
});

describe('Collections CRUD — Parent Orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a parent order', async () => {
    const parentOrderData = {
      teamOrderId: 'ord_001',
      parentId: 'cust_001',
      playerId: 'player_001',
      state: 'PENDING_PAYMENT',
      products: JSON.stringify([{ id: 'poster-16x20', qty: 1 }]),
      shipping: JSON.stringify({ address: '123 School Blvd' }),
      stripeId: 'pi_parent_001',
      totalAmount: 8500,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
    };

    databases.createDocument.mockResolvedValue({ $id: mockId, ...parentOrderData });

    const result = await createParentOrder(parentOrderData);

    expect(databases.createDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.PARENT_ORDERS,
      expect.any(String),
      expect.objectContaining({
        teamOrderId: 'ord_001',
        state: 'PENDING_PAYMENT',
      })
    );
    expect(result.totalAmount).toBe(8500);
  });

  it('should get a parent order by ID', async () => {
    const orderData = {
      $id: mockId,
      teamOrderId: 'ord_001',
      state: 'PENDING_PAYMENT',
    };
    databases.getDocument.mockResolvedValue(orderData);

    const result = await getParentOrder(mockId);

    expect(databases.getDocument).toHaveBeenCalledWith(DB, COLLECTIONS.PARENT_ORDERS, mockId);
    expect(result.state).toBe('PENDING_PAYMENT');
  });

  it('should update parent order state to FULFILLED', async () => {
    const updateData = { state: 'FULFILLED', updatedAt: mockTimestamp };
    const updated = { $id: mockId, ...updateData };

    databases.updateDocument.mockResolvedValue(updated);

    const result = await updateParentOrder(mockId, updateData);

    expect(databases.updateDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.PARENT_ORDERS,
      mockId,
      updateData
    );
    expect(result.state).toBe('FULFILLED');
  });
});

describe('Collections CRUD — Brands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a brand', async () => {
    const brandData = {
      slug: 'cinematic-dark',
      name: 'Cinematic Dark',
      description: 'Bold, dramatic brand style',
      active: true,
      sports: JSON.stringify(['basketball', 'football']),
      tokenSchema: JSON.stringify({ colors: {}, fonts: {} }),
    };

    databases.createDocument.mockResolvedValue({ $id: mockId, ...brandData });

    const result = await createBrand(brandData);

    expect(databases.createDocument).toHaveBeenCalledWith(
      DB,
      COLLECTIONS.BRANDS,
      'cinematic-dark',
      expect.objectContaining({
        slug: 'cinematic-dark',
        active: true,
      })
    );
    expect(result.name).toBe('Cinematic Dark');
  });

  it('should get a brand by ID', async () => {
    const brandData = { $id: 'cinematic-dark', name: 'Cinematic Dark', active: true };
    databases.getDocument.mockResolvedValue(brandData);

    const result = await getBrand('cinematic-dark');

    expect(databases.getDocument).toHaveBeenCalledWith(DB, COLLECTIONS.BRANDS, 'cinematic-dark');
    expect(result.name).toBe('Cinematic Dark');
  });

  it('should get brand by slug', async () => {
    const brands = [{ $id: 'cinematic-dark', name: 'Cinematic Dark' }];
    databases.listDocuments.mockResolvedValue({ documents: brands });

    const result = await getBrandBySlug('cinematic-dark');

    expect(databases.listDocuments).toHaveBeenCalledWith(DB, COLLECTIONS.BRANDS, expect.any(Array));
    expect(result).not.toBeNull();
    expect(result.name).toBe('Cinematic Dark');
  });

  it('should list all active brands', async () => {
    const activeBrands = [
      { $id: 'cinematic-dark', name: 'Cinematic Dark', active: true },
      { $id: 'minimal-light', name: 'Minimal Light', active: true },
    ];
    databases.listDocuments.mockResolvedValue({ documents: activeBrands });

    const result = await listActiveBrands();

    expect(databases.listDocuments).toHaveBeenCalledWith(DB, COLLECTIONS.BRANDS, expect.any(Array));
    expect(result).toHaveLength(2);
    expect(result[0].active).toBe(true);
    expect(result[1].active).toBe(true);
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when Appwrite connection fails on create', async () => {
    const error = new Error('Failed to connect to Appwrite');
    databases.createDocument.mockRejectedValue(error);

    await expect(
      createOrder({
        customerId: 'cust_001',
        teamId: 'team_001',
        state: 'PENDING_PAYMENT',
      })
    ).rejects.toThrow('Failed to connect to Appwrite');
  });

  it('should throw error when document not found on get', async () => {
    const error = new Error('Document not found');
    error.code = 404;
    databases.getDocument.mockRejectedValue(error);

    await expect(getOrder('invalid_id')).rejects.toThrow('Document not found');
  });

  it('should throw error on invalid JSON when creating player', async () => {
    const playerData = {
      teamId: 'team_001',
      orderId: 'ord_001',
      firstName: 'Jordan',
      lastName: 'Smith',
      slug: 'jordan-smith',
      photo: 'invalid-json', // Not valid JSON
      createdAt: new Date().toISOString(),
    };

    await expect(createPlayer(playerData)).rejects.toThrow();
  });
});
