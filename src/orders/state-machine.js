/**
 * src/orders/state-machine.js
 *
 * Order lifecycle state machine.
 * All state transitions are validated here — no direct state writes
 * should happen anywhere else in the codebase.
 *
 * See SCHEMA.md for full state machine definition.
 * See state-machine.test.js for tests covering every transition.
 *
 * Usage:
 *   import { transition, ORDER_STATES } from './state-machine.js';
 *   const updated = await transition(order, 'IN_PRODUCTION', { triggeredBy: 'stripe-webhook' });
 */

import { databases } from '../appwrite/client.js';
import { DB, COLLECTIONS } from '../appwrite/collections.js';

// ─── States ──────────────────────────────────────────────────────

export const ORDER_STATES = {
  PENDING_PAYMENT:          'PENDING_PAYMENT',
  IN_PRODUCTION:            'IN_PRODUCTION',
  PENDING_PROOF_REVIEW:     'PENDING_PROOF_REVIEW',
  PROOF_REVISION_REQUESTED: 'PROOF_REVISION_REQUESTED',
  PROOF_APPROVED:           'PROOF_APPROVED',
  PENDING_FINAL_PAYMENT:    'PENDING_FINAL_PAYMENT',
  PAID_IN_FULL:             'PAID_IN_FULL',
  FULFILLMENT:              'FULFILLMENT',
  DELIVERED:                'DELIVERED',
  DISPUTED:                 'DISPUTED',
};

// ─── Valid transitions ────────────────────────────────────────────
// Map of current state → allowed next states

const VALID_TRANSITIONS = {
  [ORDER_STATES.PENDING_PAYMENT]:          [ORDER_STATES.IN_PRODUCTION, ORDER_STATES.DISPUTED],
  [ORDER_STATES.IN_PRODUCTION]:            [ORDER_STATES.PENDING_PROOF_REVIEW, ORDER_STATES.DISPUTED],
  [ORDER_STATES.PENDING_PROOF_REVIEW]:     [ORDER_STATES.PROOF_APPROVED, ORDER_STATES.PROOF_REVISION_REQUESTED, ORDER_STATES.DISPUTED],
  [ORDER_STATES.PROOF_REVISION_REQUESTED]: [ORDER_STATES.PENDING_PROOF_REVIEW, ORDER_STATES.DISPUTED],
  [ORDER_STATES.PROOF_APPROVED]:           [ORDER_STATES.PENDING_FINAL_PAYMENT, ORDER_STATES.DISPUTED],
  [ORDER_STATES.PENDING_FINAL_PAYMENT]:    [ORDER_STATES.PAID_IN_FULL, ORDER_STATES.DISPUTED],
  [ORDER_STATES.PAID_IN_FULL]:             [ORDER_STATES.FULFILLMENT, ORDER_STATES.DISPUTED],
  [ORDER_STATES.FULFILLMENT]:              [ORDER_STATES.DELIVERED, ORDER_STATES.DISPUTED],
  [ORDER_STATES.DELIVERED]:               [ORDER_STATES.DISPUTED],
  [ORDER_STATES.DISPUTED]:                [], // terminal state
};

// ─── Errors ───────────────────────────────────────────────────────

export class InvalidTransitionError extends Error {
  constructor(from, to) {
    super(`Invalid order state transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}

// ─── Core functions ───────────────────────────────────────────────

/**
 * Validates whether a state transition is allowed.
 * Does not write anything — pure validation.
 *
 * @param {string} from - current state
 * @param {string} to   - desired next state
 * @returns {boolean}
 */
export function isValidTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Transitions an order to a new state.
 * Validates the transition, writes to Appwrite, and returns the updated order.
 * Throws InvalidTransitionError if the transition is not allowed.
 *
 * @param {object} order        - current order document from Appwrite
 * @param {string} newState     - target state
 * @param {object} meta         - optional metadata { triggeredBy, notes }
 * @returns {Promise<object>}   updated order document
 */
export async function transition(order, newState, meta = {}) {
  const currentState = order.state;

  if (!isValidTransition(currentState, newState)) {
    throw new InvalidTransitionError(currentState, newState);
  }

  const now = new Date().toISOString();

  const updated = await databases.updateDocument(
    DB,
    COLLECTIONS.ORDERS,
    order.$id,
    {
      state:     newState,
      updatedAt: now,
    }
  );

  // Log the transition
  console.info('Order state transition', {
    orderId:     order.$id,
    from:        currentState,
    to:          newState,
    triggeredBy: meta.triggeredBy || 'unknown',
    timestamp:   now,
  });

  return updated;
}

/**
 * Checks whether an order is ready for final asset release.
 * Both conditions must be true — never check individually.
 *
 * @param {object} order - order document
 * @returns {boolean}
 */
export function canReleaseFinals(order) {
  const proofApproved = order.proofLog &&
    JSON.parse(order.proofLog || '[]').some(p => p.action === 'APPROVED');

  const balancePaid = order.state === ORDER_STATES.PAID_IN_FULL ||
    order.state === ORDER_STATES.FULFILLMENT ||
    order.state === ORDER_STATES.DELIVERED;

  return proofApproved && balancePaid;
}