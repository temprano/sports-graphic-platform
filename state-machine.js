/**
 * Order State Machine
 *
 * Manages order lifecycle transitions from SCHEMA.md.
 * Enforces valid state transitions and prevents invalid paths.
 * Tracks full audit history of all transitions.
 *
 * Valid states:
 *   PENDING_PAYMENT → IN_PRODUCTION → PENDING_PROOF_REVIEW
 *   → PROOF_APPROVED → PENDING_FINAL_PAYMENT → PAID_IN_FULL
 *   → FULFILLMENT → DELIVERED
 *
 *   PENDING_PROOF_REVIEW ← PROOF_REVISION_REQUESTED ← PROOF_APPROVED
 *   [Any state] → DISPUTED (terminal)
 */

const VALID_STATES = [
  'PENDING_PAYMENT',
  'IN_PRODUCTION',
  'PENDING_PROOF_REVIEW',
  'PROOF_REVISION_REQUESTED',
  'PROOF_APPROVED',
  'PENDING_FINAL_PAYMENT',
  'PAID_IN_FULL',
  'FULFILLMENT',
  'DELIVERED',
  'DISPUTED',
];

/**
 * Valid transitions defined as adjacency list.
 * Maps current state → array of valid next states.
 * DISPUTED and DELIVERED are terminal states (empty array).
 */
const VALID_TRANSITIONS = {
  PENDING_PAYMENT: ['IN_PRODUCTION', 'DISPUTED'],
  IN_PRODUCTION: ['PENDING_PROOF_REVIEW', 'DISPUTED'],
  PENDING_PROOF_REVIEW: ['PROOF_APPROVED', 'PROOF_REVISION_REQUESTED', 'DISPUTED'],
  PROOF_REVISION_REQUESTED: ['PENDING_PROOF_REVIEW', 'DISPUTED'],
  PROOF_APPROVED: ['PENDING_FINAL_PAYMENT', 'DISPUTED'],
  PENDING_FINAL_PAYMENT: ['PAID_IN_FULL', 'DISPUTED'],
  PAID_IN_FULL: ['FULFILLMENT', 'DISPUTED'],
  FULFILLMENT: ['DELIVERED', 'DISPUTED'],
  DELIVERED: ['DISPUTED'],  // Only to DISPUTED (terminal otherwise)
  DISPUTED: [],  // Terminal state
};

export class StateMachine {
  #currentState;
  #history;

  /**
   * Create a new state machine instance.
   * @param {string} initialState - Must be a valid state from VALID_STATES
   * @throws {Error} If initialState is not valid
   */
  constructor(initialState) {
    if (!VALID_STATES.includes(initialState)) {
      throw new Error(`${initialState} is not a valid order state`);
    }
    this.#currentState = initialState;
    this.#history = [];
  }

  /**
   * Get current state (read-only).
   * @returns {string} Current order state
   */
  get currentState() {
    return this.#currentState;
  }

  /**
   * Prevent external modification of currentState
   */
  set currentState(value) {
    throw new Error('currentState is read-only');
  }

  /**
   * Get immutable copy of transition history.
   * @returns {Array} Array of transition records
   */
  get history() {
    return Object.freeze([...this.#history]);
  }

  /**
   * Prevent external modification of history
   */
  set history(value) {
    throw new Error('history is read-only');
  }

  /**
   * Transition to next state.
   *
   * @param {string} nextState - Target state
   * @param {object} metadata - Transition context (required, not null)
   * @throws {Error} If transition is invalid or metadata missing
   *
   * Validates:
   * - metadata is provided (not null/undefined)
   * - nextState is a valid state
   * - transition path is allowed from current state
   * - DISPUTED is terminal (cannot exit DISPUTED)
   */
  transition(nextState, metadata) {
    // Validate metadata is provided
    if (!metadata || typeof metadata !== 'object') {
      throw new Error('Transition metadata is required');
    }

    // Validate nextState is a valid state
    if (!VALID_STATES.includes(nextState)) {
      throw new Error(`${nextState} is not a valid order state`);
    }

    // DISPUTED is terminal — cannot exit DISPUTED state
    if (this.#currentState === 'DISPUTED') {
      throw new Error('Cannot exit DISPUTED state');
    }

    // Get allowed transitions from current state
    const allowedTransitions = VALID_TRANSITIONS[this.#currentState];
    if (!allowedTransitions) {
      throw new Error(
        `Cannot transition from ${this.#currentState} to ${nextState}`
      );
    }

    // Check if nextState is in allowed transitions
    if (!allowedTransitions.includes(nextState)) {
      throw new Error(
        `Cannot transition from ${this.#currentState} to ${nextState}`
      );
    }

    // Create transition record with timestamp
    const record = {
      from: this.#currentState,
      to: nextState,
      metadata,
      timestamp: Date.now(),
    };

    // Update state and history (append to history)
    this.#history = [...this.#history, record];
    this.#currentState = nextState;
  }
}

export default StateMachine;
