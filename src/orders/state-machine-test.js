/**
 * src/orders/state-machine.test.js
 *
 * Tests for every valid and invalid order state transition.
 * These tests must pass before any payment or pipeline code is written.
 *
 * Run: npm run test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ORDER_STATES,
  isValidTransition,
  transition,
  canReleaseFinals,
  InvalidTransitionError,
} from './state-machine.js';

// ─── Mock Appwrite client ─────────────────────────────────────────
vi.mock('../appwrite/client.js', () => ({
  databases: {
    updateDocument: vi.fn(),
  },
}));

import { databases } from '../appwrite/client.js';

// ─── Helpers ─────────────────────────────────────────────────────

function makeOrder(state, overrides = {}) {
  return {
    $id: 'ord_test_001',
    state,
    proofLog: '[]',
    ...overrides,
  };
}

// ─── isValidTransition ────────────────────────────────────────────

describe('isValidTransition', () => {

  describe('valid transitions', () => {
    const validCases = [
      ['PENDING_PAYMENT',          'IN_PRODUCTION'],
      ['IN_PRODUCTION',            'PENDING_PROOF_REVIEW'],
      ['PENDING_PROOF_REVIEW',     'PROOF_APPROVED'],
      ['PENDING_PROOF_REVIEW',     'PROOF_REVISION_REQUESTED'],
      ['PROOF_REVISION_REQUESTED', 'PENDING_PROOF_REVIEW'],
      ['PROOF_APPROVED',           'PENDING_FINAL_PAYMENT'],
      ['PENDING_FINAL_PAYMENT',    'PAID_IN_FULL'],
      ['PAID_IN_FULL',             'FULFILLMENT'],
      ['FULFILLMENT',              'DELIVERED'],
    ];

    validCases.forEach(([from, to]) => {
      it(`allows ${from} → ${to}`, () => {
        expect(isValidTransition(from, to)).toBe(true);
      });
    });
  });

  describe('DISPUTED is reachable from every non-terminal state', () => {
    const nonTerminal = [
      'PENDING_PAYMENT', 'IN_PRODUCTION', 'PENDING_PROOF_REVIEW',
      'PROOF_REVISION_REQUESTED', 'PROOF_APPROVED', 'PENDING_FINAL_PAYMENT',
      'PAID_IN_FULL', 'FULFILLMENT', 'DELIVERED',
    ];

    nonTerminal.forEach(state => {
      it(`allows ${state} → DISPUTED`, () => {
        expect(isValidTransition(state, 'DISPUTED')).toBe(true);
      });
    });
  });

  describe('invalid transitions', () => {
    const invalidCases = [
      ['PENDING_PAYMENT',       'PROOF_APPROVED'],
      ['PENDING_PAYMENT',       'DELIVERED'],
      ['PENDING_PAYMENT',       'PAID_IN_FULL'],
      ['IN_PRODUCTION',         'PENDING_PAYMENT'],
      ['PROOF_APPROVED',        'IN_PRODUCTION'],
      ['PROOF_APPROVED',        'PENDING_PROOF_REVIEW'],
      ['PAID_IN_FULL',          'PENDING_PAYMENT'],
      ['DELIVERED',             'IN_PRODUCTION'],
      ['DISPUTED',              'PENDING_PAYMENT'],   // terminal — no exits
      ['DISPUTED',              'DELIVERED'],
    ];

    invalidCases.forEach(([from, to]) => {
      it(`blocks ${from} → ${to}`, () => {
        expect(isValidTransition(from, to)).toBe(false);
      });
    });
  });

  it('returns false for unknown state', () => {
    expect(isValidTransition('NOT_A_STATE', 'DELIVERED')).toBe(false);
  });

  it('returns false for unknown target', () => {
    expect(isValidTransition('PENDING_PAYMENT', 'NOT_A_STATE')).toBe(false);
  });
});

// ─── transition() ────────────────────────────────────────────────

describe('transition', () => {

  beforeEach(() => {
    databases.updateDocument.mockReset();
  });

  it('calls updateDocument with new state and updatedAt', async () => {
    const order = makeOrder(ORDER_STATES.PENDING_PAYMENT);
    const mockUpdated = { ...order, state: ORDER_STATES.IN_PRODUCTION };
    databases.updateDocument.mockResolvedValue(mockUpdated);

    const result = await transition(order, ORDER_STATES.IN_PRODUCTION, {
      triggeredBy: 'stripe-deposit-webhook',
    });

    expect(databases.updateDocument).toHaveBeenCalledOnce();
    expect(databases.updateDocument).toHaveBeenCalledWith(
      expect.any(String),  // DB
      expect.any(String),  // COLLECTIONS.ORDERS
      'ord_test_001',
      expect.objectContaining({
        state: ORDER_STATES.IN_PRODUCTION,
        updatedAt: expect.any(String),
      })
    );
    expect(result.state).toBe(ORDER_STATES.IN_PRODUCTION);
  });

  it('throws InvalidTransitionError for illegal transition', async () => {
    const order = makeOrder(ORDER_STATES.PENDING_PAYMENT);

    await expect(
      transition(order, ORDER_STATES.DELIVERED)
    ).rejects.toThrow(InvalidTransitionError);

    expect(databases.updateDocument).not.toHaveBeenCalled();
  });

  it('throws InvalidTransitionError with correct from/to properties', async () => {
    const order = makeOrder(ORDER_STATES.PROOF_APPROVED);

    try {
      await transition(order, ORDER_STATES.PENDING_PAYMENT);
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTransitionError);
      expect(err.from).toBe(ORDER_STATES.PROOF_APPROVED);
      expect(err.to).toBe(ORDER_STATES.PENDING_PAYMENT);
    }
  });

  it('does not write to database when transition is invalid', async () => {
    const order = makeOrder(ORDER_STATES.DISPUTED);

    await expect(
      transition(order, ORDER_STATES.IN_PRODUCTION)
    ).rejects.toThrow();

    expect(databases.updateDocument).not.toHaveBeenCalled();
  });
});

// ─── canReleaseFinals() ───────────────────────────────────────────

describe('canReleaseFinals', () => {

  it('returns true when proof approved AND state is PAID_IN_FULL', () => {
    const order = makeOrder(ORDER_STATES.PAID_IN_FULL, {
      proofLog: JSON.stringify([{ action: 'APPROVED', version: 1 }]),
    });
    expect(canReleaseFinals(order)).toBe(true);
  });

  it('returns true when proof approved AND state is FULFILLMENT', () => {
    const order = makeOrder(ORDER_STATES.FULFILLMENT, {
      proofLog: JSON.stringify([{ action: 'APPROVED', version: 1 }]),
    });
    expect(canReleaseFinals(order)).toBe(true);
  });

  it('returns false when proof approved but balance not paid', () => {
    const order = makeOrder(ORDER_STATES.PROOF_APPROVED, {
      proofLog: JSON.stringify([{ action: 'APPROVED', version: 1 }]),
    });
    expect(canReleaseFinals(order)).toBe(false);
  });

  it('returns false when balance paid but proof not approved', () => {
    const order = makeOrder(ORDER_STATES.PAID_IN_FULL, {
      proofLog: JSON.stringify([{ action: 'REVISION_REQUESTED', version: 1 }]),
    });
    expect(canReleaseFinals(order)).toBe(false);
  });

  it('returns false when balance paid but proof log is empty', () => {
    const order = makeOrder(ORDER_STATES.PAID_IN_FULL, {
      proofLog: '[]',
    });
    expect(canReleaseFinals(order)).toBe(false);
  });

  it('returns false when both conditions unmet', () => {
    const order = makeOrder(ORDER_STATES.PENDING_PROOF_REVIEW);
    expect(canReleaseFinals(order)).toBe(false);
  });
});