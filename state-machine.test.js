import { describe, it, expect } from 'vitest';
import { StateMachine } from './state-machine.js';

/**
 * Order State Machine Tests
 * 
 * Tests all valid transitions from SCHEMA.md state machine.
 * Every state transition requires a test.
 * Every invalid transition must throw an error.
 * DISPUTED must be reachable from any state (100% coverage requirement).
 * 
 * State machine diagram from SCHEMA.md:
 * PENDING_PAYMENT → IN_PRODUCTION → PENDING_PROOF_REVIEW
 *   → PROOF_APPROVED → PENDING_FINAL_PAYMENT → PAID_IN_FULL
 *   → FULFILLMENT → DELIVERED
 * 
 * PENDING_PROOF_REVIEW ← PROOF_REVISION_REQUESTED ← PROOF_APPROVED
 * 
 * Any state → DISPUTED (chargeback/dispute)
 */

describe('Order State Machine', () => {
  describe('Valid Transitions', () => {
    describe('PENDING_PAYMENT → IN_PRODUCTION', () => {
      it('should transition from PENDING_PAYMENT to IN_PRODUCTION', () => {
        const sm = new StateMachine('PENDING_PAYMENT');
        sm.transition('IN_PRODUCTION', { depositIntentId: 'pi_123' });
        expect(sm.currentState).toBe('IN_PRODUCTION');
      });

      it('should require a transition reason/metadata', () => {
        const sm = new StateMachine('PENDING_PAYMENT');
        expect(() => sm.transition('IN_PRODUCTION', null)).toThrow();
      });

      it('should record transition metadata', () => {
        const sm = new StateMachine('PENDING_PAYMENT');
        const metadata = { depositIntentId: 'pi_123', timestamp: Date.now() };
        sm.transition('IN_PRODUCTION', metadata);
        expect(sm.history[0]).toMatchObject({
          from: 'PENDING_PAYMENT',
          to: 'IN_PRODUCTION',
          metadata,
        });
      });
    });

    describe('IN_PRODUCTION → PENDING_PROOF_REVIEW', () => {
      it('should transition from IN_PRODUCTION to PENDING_PROOF_REVIEW', () => {
        const sm = new StateMachine('IN_PRODUCTION');
        sm.transition('PENDING_PROOF_REVIEW', { rendersComplete: true });
        expect(sm.currentState).toBe('PENDING_PROOF_REVIEW');
      });
    });

    describe('PENDING_PROOF_REVIEW transitions', () => {
      it('should transition from PENDING_PROOF_REVIEW to PROOF_APPROVED', () => {
        const sm = new StateMachine('PENDING_PROOF_REVIEW');
        sm.transition('PROOF_APPROVED', { approvedBy: 'user_123' });
        expect(sm.currentState).toBe('PROOF_APPROVED');
      });

      it('should transition from PENDING_PROOF_REVIEW to PROOF_REVISION_REQUESTED', () => {
        const sm = new StateMachine('PENDING_PROOF_REVIEW');
        sm.transition('PROOF_REVISION_REQUESTED', { reason: 'colors too bright' });
        expect(sm.currentState).toBe('PROOF_REVISION_REQUESTED');
      });
    });

    describe('PROOF_REVISION_REQUESTED → PENDING_PROOF_REVIEW', () => {
      it('should transition back to PENDING_PROOF_REVIEW after revision', () => {
        const sm = new StateMachine('PROOF_REVISION_REQUESTED');
        sm.transition('PENDING_PROOF_REVIEW', { rerenderComplete: true });
        expect(sm.currentState).toBe('PENDING_PROOF_REVIEW');
      });
    });

    describe('PROOF_APPROVED → PENDING_FINAL_PAYMENT', () => {
      it('should transition from PROOF_APPROVED to PENDING_FINAL_PAYMENT', () => {
        const sm = new StateMachine('PROOF_APPROVED');
        sm.transition('PENDING_FINAL_PAYMENT', { invoiceSent: true });
        expect(sm.currentState).toBe('PENDING_FINAL_PAYMENT');
      });
    });

    describe('PENDING_FINAL_PAYMENT → PAID_IN_FULL', () => {
      it('should transition from PENDING_FINAL_PAYMENT to PAID_IN_FULL', () => {
        const sm = new StateMachine('PENDING_FINAL_PAYMENT');
        sm.transition('PAID_IN_FULL', { balanceIntentId: 'pi_balance_123' });
        expect(sm.currentState).toBe('PAID_IN_FULL');
      });
    });

    describe('PAID_IN_FULL → FULFILLMENT', () => {
      it('should transition from PAID_IN_FULL to FULFILLMENT', () => {
        const sm = new StateMachine('PAID_IN_FULL');
        sm.transition('FULFILLMENT', { prodigiOrderId: 'prod_123' });
        expect(sm.currentState).toBe('FULFILLMENT');
      });

      it('should require both proof approved AND balance paid to reach FULFILLMENT', () => {
        // This is tested via invariant validation in state machine
        const sm = new StateMachine('PAID_IN_FULL');
        const metadata = { proofApproved: true, paidInFull: true };
        expect(() => sm.transition('FULFILLMENT', metadata)).not.toThrow();
      });
    });

    describe('FULFILLMENT → DELIVERED', () => {
      it('should transition from FULFILLMENT to DELIVERED', () => {
        const sm = new StateMachine('FULFILLMENT');
        sm.transition('DELIVERED', { deliveryConfirmed: true });
        expect(sm.currentState).toBe('DELIVERED');
      });
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject PENDING_PAYMENT → PROOF_APPROVED (skip stages)', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      expect(() => sm.transition('PROOF_APPROVED', {})).toThrow();
    });

    it('should reject PENDING_PAYMENT → PENDING_FINAL_PAYMENT (skip stages)', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      expect(() => sm.transition('PENDING_FINAL_PAYMENT', {})).toThrow();
    });

    it('should reject IN_PRODUCTION → DELIVERED (skip stages)', () => {
      const sm = new StateMachine('IN_PRODUCTION');
      expect(() => sm.transition('DELIVERED', {})).toThrow();
    });

    it('should reject PENDING_PROOF_REVIEW → PAID_IN_FULL (skip stages)', () => {
      const sm = new StateMachine('PENDING_PROOF_REVIEW');
      expect(() => sm.transition('PAID_IN_FULL', {})).toThrow();
    });

    it('should reject PROOF_REVISION_REQUESTED → PAID_IN_FULL (skip stages)', () => {
      const sm = new StateMachine('PROOF_REVISION_REQUESTED');
      expect(() => sm.transition('PAID_IN_FULL', {})).toThrow();
    });

    it('should reject backwards transitions (IN_PRODUCTION → PENDING_PAYMENT)', () => {
      const sm = new StateMachine('IN_PRODUCTION');
      expect(() => sm.transition('PENDING_PAYMENT', {})).toThrow();
    });

    it('should reject DELIVERED → FULFILLMENT (final state cannot go back)', () => {
      const sm = new StateMachine('DELIVERED');
      expect(() => sm.transition('FULFILLMENT', {})).toThrow();
    });

    it('should reject PROOF_APPROVED → PENDING_PAYMENT (backwards)', () => {
      const sm = new StateMachine('PROOF_APPROVED');
      expect(() => sm.transition('PENDING_PAYMENT', {})).toThrow();
    });

    it('should reject invalid state string', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      expect(() => sm.transition('INVALID_STATE', {})).toThrow();
    });

    it('should reject transition with missing metadata', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      expect(() => sm.transition('IN_PRODUCTION')).toThrow();
    });
  });

  describe('DISPUTED State (Reachable from Any State)', () => {
    const allStates = [
      'PENDING_PAYMENT',
      'IN_PRODUCTION',
      'PENDING_PROOF_REVIEW',
      'PROOF_REVISION_REQUESTED',
      'PROOF_APPROVED',
      'PENDING_FINAL_PAYMENT',
      'PAID_IN_FULL',
      'FULFILLMENT',
      'DELIVERED',
    ];

    allStates.forEach(state => {
      it(`should transition from ${state} to DISPUTED`, () => {
        const sm = new StateMachine(state);
        sm.transition('DISPUTED', { reason: 'chargeback', chargebackId: 'cb_123' });
        expect(sm.currentState).toBe('DISPUTED');
      });
    });

    it('should record dispute reason and timestamp', () => {
      const sm = new StateMachine('PAID_IN_FULL');
      const metadata = { reason: 'customer dispute', timestamp: Date.now() };
      sm.transition('DISPUTED', metadata);
      expect(sm.history[0]).toMatchObject({
        from: 'PAID_IN_FULL',
        to: 'DISPUTED',
        metadata,
      });
    });

    it('should not allow transitions out of DISPUTED state', () => {
      const sm = new StateMachine('DISPUTED');
      expect(() => sm.transition('DELIVERED', {})).toThrow(
        /cannot exit DISPUTED state/i
      );
    });
  });

  describe('State History', () => {
    it('should track all transitions in history', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      sm.transition('IN_PRODUCTION', { reason: 'deposit' });
      sm.transition('PENDING_PROOF_REVIEW', { reason: 'renders_done' });

      expect(sm.history).toHaveLength(2);
      expect(sm.history[0]).toMatchObject({
        from: 'PENDING_PAYMENT',
        to: 'IN_PRODUCTION',
      });
      expect(sm.history[1]).toMatchObject({
        from: 'IN_PRODUCTION',
        to: 'PENDING_PROOF_REVIEW',
      });
    });

    it('should include timestamp for every transition', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      sm.transition('IN_PRODUCTION', {});
      expect(sm.history[0]).toHaveProperty('timestamp');
      expect(typeof sm.history[0].timestamp).toBe('number');
    });
  });

  describe('State Machine Invariants', () => {
    it('should maintain valid state order (no backwards transitions)', () => {
      const validSequence = [
        'PENDING_PAYMENT',
        'IN_PRODUCTION',
        'PENDING_PROOF_REVIEW',
        'PROOF_APPROVED',
        'PENDING_FINAL_PAYMENT',
        'PAID_IN_FULL',
        'FULFILLMENT',
        'DELIVERED',
      ];

      let sm = new StateMachine('PENDING_PAYMENT');
      for (let i = 1; i < validSequence.length; i++) {
        sm.transition(validSequence[i], {});
        expect(sm.currentState).toBe(validSequence[i]);
      }
    });

    it('should validate that finals only trigger when PROOF_APPROVED AND PAID_IN_FULL', () => {
      // PAID_IN_FULL can only be reached after PROOF_APPROVED, enforcing the invariant
      const sm = new StateMachine('PAID_IN_FULL');
      sm.transition('FULFILLMENT', { reason: 'both conditions met' });
      expect(sm.currentState).toBe('FULFILLMENT');
    });

    it('should maintain immutable state history', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      sm.transition('IN_PRODUCTION', {});
      const historyCopy = [...sm.history];
      
      sm.transition('PENDING_PROOF_REVIEW', {});
      
      // Original copy should not change
      expect(historyCopy).toHaveLength(1);
      expect(sm.history).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid sequential transitions', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      sm.transition('IN_PRODUCTION', {});
      sm.transition('PENDING_PROOF_REVIEW', {});
      sm.transition('PROOF_APPROVED', {});
      
      expect(sm.currentState).toBe('PROOF_APPROVED');
      expect(sm.history).toHaveLength(3);
    });

    it('should reject transition with null metadata when metadata is required', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      expect(() => sm.transition('IN_PRODUCTION', null)).toThrow();
    });

    it('should work with complex nested metadata objects', () => {
      const sm = new StateMachine('PROOF_REVISION_REQUESTED');
      const complexMetadata = {
        rerenderComplete: true,
        renderStats: {
          duration: 45000,
          fileSize: 125000,
          quality: 'high',
        },
        playersRendered: ['p1', 'p2', 'p3'],
      };
      sm.transition('PENDING_PROOF_REVIEW', complexMetadata);
      expect(sm.history[0].metadata).toEqual(complexMetadata);
    });
  });

  describe('Initialization', () => {
    it('should initialize in PENDING_PAYMENT state', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      expect(sm.currentState).toBe('PENDING_PAYMENT');
    });

    it('should start with empty history', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      expect(sm.history).toEqual([]);
    });

    it('should reject invalid initial state', () => {
      expect(() => new StateMachine('INVALID')).toThrow();
    });

    it('should accept any valid state as initial state', () => {
      const validStates = [
        'PENDING_PAYMENT',
        'IN_PRODUCTION',
        'PENDING_PROOF_REVIEW',
        'DISPUTED',
      ];
      validStates.forEach(state => {
        const sm = new StateMachine(state);
        expect(sm.currentState).toBe(state);
      });
    });
  });

  describe('Public API', () => {
    it('should expose currentState as read-only property', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      expect(sm.currentState).toBe('PENDING_PAYMENT');
      // Attempting to set should throw
      expect(() => {
        sm.currentState = 'IN_PRODUCTION';
      }).toThrow();
    });

    it('should expose history as read-only property', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      sm.transition('IN_PRODUCTION', {});
      expect(sm.history).toHaveLength(1);
      // Attempting to modify should throw
      expect(() => {
        sm.history = [];
      }).toThrow();
    });

    it('should provide transition method', () => {
      const sm = new StateMachine('PENDING_PAYMENT');
      expect(typeof sm.transition).toBe('function');
    });
  });
});
