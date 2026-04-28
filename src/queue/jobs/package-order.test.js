import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set environment before mocking
beforeEach(() => {
  process.env.APPWRITE_ENDPOINT = 'http://localhost/v1';
  process.env.APPWRITE_PROJECT_ID = 'test_project';
  process.env.APPWRITE_API_KEY = 'test_key';
});

vi.mock('fs');
vi.mock('../../appwrite/client.js', () => ({
  databases: { getDocument: vi.fn() },
  storage: { createFile: vi.fn() },
}));
vi.mock('../../appwrite/collections.js', () => ({
  DB: 'test_db',
  COLLECTIONS: { ORDERS: 'orders' },
}));
vi.mock('../../orders/state-machine.js', () => ({
  canReleaseFinals: vi.fn(),
  transition: vi.fn(),
  ORDER_STATES: { FULFILLMENT: 'FULFILLMENT' },
}));
vi.mock('../../lib/storage.js', () => ({
  bucketId: vi.fn(),
}));
vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { run } from './package-order.js';
import * as fs from 'fs';
import * as client from '../../appwrite/client.js';
import * as statemachine from '../../orders/state-machine.js';
import * as storageLib from '../../lib/storage.js';

describe('package-order job', () => {
  it('should package order successfully', async () => {
    const order = {
      id: 'ord_001',
      state: 'PAID_IN_FULL',
      proofLog: JSON.stringify([{ action: 'APPROVED' }]),
    };

    client.databases.getDocument.mockResolvedValue(order);
    statemachine.canReleaseFinals.mockReturnValue(true);
    statemachine.transition.mockResolvedValue({ ...order, state: 'FULFILLMENT' });
    storageLib.bucketId.mockReturnValue('finals-bucket');
    
    fs.readdirSync
      .mockReturnValueOnce([{ name: 'video1.mp4' }])
      .mockReturnValueOnce(['video1.mp4'])
      .mockReturnValueOnce([{ name: 'print1.pdf' }])
      .mockReturnValueOnce(['print1.pdf']);

    client.storage.createFile.mockResolvedValue({ $id: 'ord_001/manifest.json' });

    const result = await run({
      orderId: 'ord_001',
      renderedAssetsDir: '/output',
    });

    expect(result.orderId).toBe('ord_001');
    expect(result.manifestFileId).toBe('ord_001/manifest.json');
    expect(result.assetCount).toBe(2);
    expect(result.status).toBe('packaged');
  });

  it('should reject if order not eligible for finals', async () => {
    const order = {
      id: 'ord_002',
      state: 'PENDING_PAYMENT',
      proofLog: '[]',
    };

    client.databases.getDocument.mockResolvedValue(order);
    statemachine.canReleaseFinals.mockReturnValue(false);

    await expect(
      run({
        orderId: 'ord_002',
        renderedAssetsDir: '/output',
      })
    ).rejects.toThrow('not eligible for finals release');
  });

  it('should reject if required data missing', async () => {
    await expect(
      run({
        orderId: null,
        renderedAssetsDir: '/output',
      })
    ).rejects.toThrow('Missing required job data');
  });

  it('should reject if no assets found', async () => {
    const order = {
      id: 'ord_003',
      state: 'PAID_IN_FULL',
      proofLog: JSON.stringify([{ action: 'APPROVED' }]),
    };

    client.databases.getDocument.mockResolvedValue(order);
    statemachine.canReleaseFinals.mockReturnValue(true);
    storageLib.bucketId.mockReturnValue('finals-bucket');
    
    fs.readdirSync
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    await expect(
      run({
        orderId: 'ord_003',
        renderedAssetsDir: '/output',
      })
    ).rejects.toThrow('No rendered assets found');
  });

  it('should reject if order not found', async () => {
    client.databases.getDocument.mockRejectedValue(new Error('Document not found'));

    await expect(
      run({
        orderId: 'ord_999',
        renderedAssetsDir: '/output',
      })
    ).rejects.toThrow('Failed to load order');
  });
});
