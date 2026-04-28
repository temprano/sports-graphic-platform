/**
 * src/appwrite/crud.js
 *
 * CRUD helper functions for all Appwrite collections.
 *
 * Usage:
 *   import { createOrder, getOrder, updateOrder } from './crud.js';
 *
 * All functions use async/await and throw on error (never swallow exceptions).
 * Callers must wrap in try/catch and handle failures appropriately.
 */

import { ID, Query } from 'node-appwrite';
import { databases } from './client.js';
import { DB, COLLECTIONS } from './collections.js';

// ─── Valid State Values ──────────────────────────────────────────

const VALID_ORDER_STATES = [
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

const VALID_PARENT_ORDER_STATES = [
  'PENDING_PAYMENT',
  'PROCESSING',
  'FULFILLED',
  'DELIVERED',
];

// ─── Orders ─────────────────────────────────────────────────────

/**
 * Create a new order
 * @param {Object} orderData - Order data (customerId, teamId, state, amounts, timestamps)
 * @returns {Promise<Object>} Created order document
 */
export async function createOrder(orderData) {
  try {
    const result = await databases.createDocument(
      DB,
      COLLECTIONS.ORDERS,
      ID.unique(),
      orderData
    );
    return result;
  } catch (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
}

/**
 * Get order by ID
 * @param {string} orderId - Order document ID
 * @returns {Promise<Object>} Order document
 */
export async function getOrder(orderId) {
  try {
    return await databases.getDocument(DB, COLLECTIONS.ORDERS, orderId);
  } catch (error) {
    throw new Error(`Failed to fetch order ${orderId}: ${error.message}`);
  }
}

/**
 * Update an existing order
 * @param {string} orderId - Order document ID
 * @param {Object} updateData - Partial update (state, payment data, etc.)
 * @returns {Promise<Object>} Updated order document
 */
export async function updateOrder(orderId, updateData) {
  try {
    // Validate state if provided
    if (updateData.state && !VALID_ORDER_STATES.includes(updateData.state)) {
      throw new Error(`Invalid order state: ${updateData.state}`);
    }

    return await databases.updateDocument(DB, COLLECTIONS.ORDERS, orderId, updateData);
  } catch (error) {
    throw new Error(`Failed to update order ${orderId}: ${error.message}`);
  }
}

/**
 * Delete an order (use cautiously — orders are financial records)
 * @param {string} orderId - Order document ID
 * @returns {Promise<void>}
 */
export async function deleteOrder(orderId) {
  try {
    await databases.deleteDocument(DB, COLLECTIONS.ORDERS, orderId);
  } catch (error) {
    throw new Error(`Failed to delete order ${orderId}: ${error.message}`);
  }
}

// ─── Customers ──────────────────────────────────────────────────

/**
 * Create a new customer
 * @param {Object} customerData - Customer data (name, email, phone, school, sport, createdAt)
 * @returns {Promise<Object>} Created customer document
 */
export async function createCustomer(customerData) {
  try {
    return await databases.createDocument(
      DB,
      COLLECTIONS.CUSTOMERS,
      ID.unique(),
      customerData
    );
  } catch (error) {
    throw new Error(`Failed to create customer: ${error.message}`);
  }
}

/**
 * Get customer by ID
 * @param {string} customerId - Customer document ID
 * @returns {Promise<Object>} Customer document
 */
export async function getCustomer(customerId) {
  try {
    return await databases.getDocument(DB, COLLECTIONS.CUSTOMERS, customerId);
  } catch (error) {
    throw new Error(`Failed to fetch customer ${customerId}: ${error.message}`);
  }
}

/**
 * Update a customer
 * @param {string} customerId - Customer document ID
 * @param {Object} updateData - Partial update (phone, school, etc.)
 * @returns {Promise<Object>} Updated customer document
 */
export async function updateCustomer(customerId, updateData) {
  try {
    return await databases.updateDocument(DB, COLLECTIONS.CUSTOMERS, customerId, updateData);
  } catch (error) {
    throw new Error(`Failed to update customer ${customerId}: ${error.message}`);
  }
}

// ─── Teams ──────────────────────────────────────────────────────

/**
 * Create a new team
 * @param {Object} teamData - Team data (customerId, brandId, teamName, season, teamJson, createdAt)
 * @returns {Promise<Object>} Created team document
 */
export async function createTeam(teamData) {
  try {
    return await databases.createDocument(
      DB,
      COLLECTIONS.TEAMS,
      ID.unique(),
      teamData
    );
  } catch (error) {
    throw new Error(`Failed to create team: ${error.message}`);
  }
}

/**
 * Get team by ID
 * @param {string} teamId - Team document ID
 * @returns {Promise<Object>} Team document
 */
export async function getTeam(teamId) {
  try {
    return await databases.getDocument(DB, COLLECTIONS.TEAMS, teamId);
  } catch (error) {
    throw new Error(`Failed to fetch team ${teamId}: ${error.message}`);
  }
}

/**
 * List teams by customer ID
 * @param {string} customerId - Customer document ID
 * @returns {Promise<Array>} Array of team documents
 */
export async function listTeamsByCustomer(customerId) {
  try {
    const result = await databases.listDocuments(DB, COLLECTIONS.TEAMS, [
      Query.equal('customerId', customerId),
    ]);
    return result.documents;
  } catch (error) {
    throw new Error(`Failed to list teams for customer ${customerId}: ${error.message}`);
  }
}

// ─── Players ────────────────────────────────────────────────────

/**
 * Create a new player
 * @param {Object} playerData - Player data (teamId, orderId, firstName, lastName, slug, photo, stats, createdAt)
 * @returns {Promise<Object>} Created player document
 */
export async function createPlayer(playerData) {
  try {
    // Validate JSON fields
    if (playerData.photo && typeof playerData.photo === 'string') {
      JSON.parse(playerData.photo); // Will throw if invalid JSON
    }
    if (playerData.stats && typeof playerData.stats === 'string') {
      JSON.parse(playerData.stats);
    }

    return await databases.createDocument(
      DB,
      COLLECTIONS.PLAYERS,
      ID.unique(),
      playerData
    );
  } catch (error) {
    throw new Error(`Failed to create player: ${error.message}`);
  }
}

/**
 * Get player by ID
 * @param {string} playerId - Player document ID
 * @returns {Promise<Object>} Player document
 */
export async function getPlayer(playerId) {
  try {
    return await databases.getDocument(DB, COLLECTIONS.PLAYERS, playerId);
  } catch (error) {
    throw new Error(`Failed to fetch player ${playerId}: ${error.message}`);
  }
}

/**
 * Update a player
 * @param {string} playerId - Player document ID
 * @param {Object} updateData - Partial update (position, photo, stats, etc.)
 * @returns {Promise<Object>} Updated player document
 */
export async function updatePlayer(playerId, updateData) {
  try {
    // Validate JSON fields if provided
    if (updateData.photo && typeof updateData.photo === 'string') {
      JSON.parse(updateData.photo);
    }
    if (updateData.stats && typeof updateData.stats === 'string') {
      JSON.parse(updateData.stats);
    }

    return await databases.updateDocument(DB, COLLECTIONS.PLAYERS, playerId, updateData);
  } catch (error) {
    throw new Error(`Failed to update player ${playerId}: ${error.message}`);
  }
}

/**
 * List players by order ID
 * @param {string} orderId - Order document ID
 * @returns {Promise<Array>} Array of player documents
 */
export async function listPlayersByOrder(orderId) {
  try {
    const result = await databases.listDocuments(DB, COLLECTIONS.PLAYERS, [
      Query.equal('orderId', orderId),
    ]);
    return result.documents;
  } catch (error) {
    throw new Error(`Failed to list players for order ${orderId}: ${error.message}`);
  }
}

// ─── Consent Logs (Permanent Record) ─────────────────────────────

/**
 * Create a new consent log entry
 * @param {Object} consentData - Consent data (playerId, orderId, flags, signedBy, timestamp, ipAddress)
 * @returns {Promise<Object>} Created consent log document
 */
export async function createConsentLog(consentData) {
  try {
    return await databases.createDocument(
      DB,
      COLLECTIONS.CONSENT_LOGS,
      ID.unique(),
      consentData
    );
  } catch (error) {
    throw new Error(`Failed to create consent log: ${error.message}`);
  }
}

/**
 * Get consent log by ID
 * @param {string} consentLogId - Consent log document ID
 * @returns {Promise<Object>} Consent log document
 */
export async function getConsentLog(consentLogId) {
  try {
    return await databases.getDocument(DB, COLLECTIONS.CONSENT_LOGS, consentLogId);
  } catch (error) {
    throw new Error(`Failed to fetch consent log ${consentLogId}: ${error.message}`);
  }
}

/**
 * List consent logs by order ID (audit trail)
 * @param {string} orderId - Order document ID
 * @returns {Promise<Array>} Array of consent log documents
 */
export async function getConsentLogsByOrder(orderId) {
  try {
    const result = await databases.listDocuments(DB, COLLECTIONS.CONSENT_LOGS, [
      Query.equal('orderId', orderId),
    ]);
    return result.documents;
  } catch (error) {
    throw new Error(`Failed to fetch consent logs for order ${orderId}: ${error.message}`);
  }
}

/**
 * List consent logs by player ID (regulatory audit)
 * @param {string} playerId - Player document ID
 * @returns {Promise<Array>} Array of consent log documents
 */
export async function getConsentLogsByPlayer(playerId) {
  try {
    const result = await databases.listDocuments(DB, COLLECTIONS.CONSENT_LOGS, [
      Query.equal('playerId', playerId),
    ]);
    return result.documents;
  } catch (error) {
    throw new Error(`Failed to fetch consent logs for player ${playerId}: ${error.message}`);
  }
}

// ─── Proof Approvals (Permanent Record) ──────────────────────────

/**
 * Create a new proof approval record
 * @param {Object} approvalData - Approval data (orderId, version, action, approvedBy, timestamp, ipAddress, notes)
 * @returns {Promise<Object>} Created approval document
 */
export async function createProofApproval(approvalData) {
  try {
    return await databases.createDocument(
      DB,
      COLLECTIONS.PROOF_APPROVALS,
      ID.unique(),
      approvalData
    );
  } catch (error) {
    throw new Error(`Failed to create proof approval: ${error.message}`);
  }
}

/**
 * Get proof approval by ID
 * @param {string} approvalId - Approval document ID
 * @returns {Promise<Object>} Approval document
 */
export async function getProofApproval(approvalId) {
  try {
    return await databases.getDocument(DB, COLLECTIONS.PROOF_APPROVALS, approvalId);
  } catch (error) {
    throw new Error(`Failed to fetch proof approval ${approvalId}: ${error.message}`);
  }
}

/**
 * List proof approvals by order ID (proof history)
 * @param {string} orderId - Order document ID
 * @returns {Promise<Array>} Array of approval documents
 */
export async function getProofApprovalsByOrder(orderId) {
  try {
    const result = await databases.listDocuments(DB, COLLECTIONS.PROOF_APPROVALS, [
      Query.equal('orderId', orderId),
    ]);
    return result.documents;
  } catch (error) {
    throw new Error(`Failed to fetch proof approvals for order ${orderId}: ${error.message}`);
  }
}

// ─── Financial Records (Permanent Record) ────────────────────────

/**
 * Create a new financial record
 * @param {Object} recordData - Financial data (orderId, stripeEventId, amounts, status, timestamp)
 * @returns {Promise<Object>} Created financial record document
 */
export async function createFinancialRecord(recordData) {
  try {
    return await databases.createDocument(
      DB,
      COLLECTIONS.FINANCIAL_RECORDS,
      ID.unique(),
      recordData
    );
  } catch (error) {
    throw new Error(`Failed to create financial record: ${error.message}`);
  }
}

/**
 * Get financial record by ID
 * @param {string} recordId - Financial record document ID
 * @returns {Promise<Object>} Financial record document
 */
export async function getFinancialRecord(recordId) {
  try {
    return await databases.getDocument(DB, COLLECTIONS.FINANCIAL_RECORDS, recordId);
  } catch (error) {
    throw new Error(`Failed to fetch financial record ${recordId}: ${error.message}`);
  }
}

/**
 * List financial records by order ID
 * @param {string} orderId - Order document ID
 * @returns {Promise<Array>} Array of financial record documents
 */
export async function getFinancialRecordsByOrder(orderId) {
  try {
    const result = await databases.listDocuments(DB, COLLECTIONS.FINANCIAL_RECORDS, [
      Query.equal('orderId', orderId),
    ]);
    return result.documents;
  } catch (error) {
    throw new Error(`Failed to fetch financial records for order ${orderId}: ${error.message}`);
  }
}

// ─── Parent Orders ──────────────────────────────────────────────

/**
 * Create a new parent order
 * @param {Object} orderData - Parent order data (teamOrderId, parentId, playerId, state, products, shipping, createdAt)
 * @returns {Promise<Object>} Created parent order document
 */
export async function createParentOrder(orderData) {
  try {
    return await databases.createDocument(
      DB,
      COLLECTIONS.PARENT_ORDERS,
      ID.unique(),
      orderData
    );
  } catch (error) {
    throw new Error(`Failed to create parent order: ${error.message}`);
  }
}

/**
 * Get parent order by ID
 * @param {string} parentOrderId - Parent order document ID
 * @returns {Promise<Object>} Parent order document
 */
export async function getParentOrder(parentOrderId) {
  try {
    return await databases.getDocument(DB, COLLECTIONS.PARENT_ORDERS, parentOrderId);
  } catch (error) {
    throw new Error(`Failed to fetch parent order ${parentOrderId}: ${error.message}`);
  }
}

/**
 * Update a parent order
 * @param {string} parentOrderId - Parent order document ID
 * @param {Object} updateData - Partial update (state, fulfillRef, etc.)
 * @returns {Promise<Object>} Updated parent order document
 */
export async function updateParentOrder(parentOrderId, updateData) {
  try {
    // Validate state if provided
    if (updateData.state && !VALID_PARENT_ORDER_STATES.includes(updateData.state)) {
      throw new Error(`Invalid parent order state: ${updateData.state}`);
    }

    return await databases.updateDocument(DB, COLLECTIONS.PARENT_ORDERS, parentOrderId, updateData);
  } catch (error) {
    throw new Error(`Failed to update parent order ${parentOrderId}: ${error.message}`);
  }
}

/**
 * List parent orders by team order ID
 * @param {string} teamOrderId - Team order document ID
 * @returns {Promise<Array>} Array of parent order documents
 */
export async function listParentOrdersByTeamOrder(teamOrderId) {
  try {
    const result = await databases.listDocuments(DB, COLLECTIONS.PARENT_ORDERS, [
      Query.equal('teamOrderId', teamOrderId),
    ]);
    return result.documents;
  } catch (error) {
    throw new Error(`Failed to list parent orders for team order ${teamOrderId}: ${error.message}`);
  }
}

/**
 * List parent orders by parent ID
 * @param {string} parentId - Parent (customer) document ID
 * @returns {Promise<Array>} Array of parent order documents
 */
export async function listParentOrdersByParent(parentId) {
  try {
    const result = await databases.listDocuments(DB, COLLECTIONS.PARENT_ORDERS, [
      Query.equal('parentId', parentId),
    ]);
    return result.documents;
  } catch (error) {
    throw new Error(`Failed to list parent orders for parent ${parentId}: ${error.message}`);
  }
}

// ─── Brands (Brand Registry) ────────────────────────────────────

/**
 * Create a new brand
 * @param {Object} brandData - Brand data (slug, name, active, sports, tokenSchema)
 * @returns {Promise<Object>} Created brand document
 */
export async function createBrand(brandData) {
  try {
    // Use slug as ID for easy lookup
    const slugId = brandData.slug || ID.unique();

    return await databases.createDocument(DB, COLLECTIONS.BRANDS, slugId, brandData);
  } catch (error) {
    throw new Error(`Failed to create brand: ${error.message}`);
  }
}

/**
 * Get brand by ID (slug)
 * @param {string} brandId - Brand slug ID
 * @returns {Promise<Object>} Brand document
 */
export async function getBrand(brandId) {
  try {
    return await databases.getDocument(DB, COLLECTIONS.BRANDS, brandId);
  } catch (error) {
    throw new Error(`Failed to fetch brand ${brandId}: ${error.message}`);
  }
}

/**
 * Get brand by slug (convenience function)
 * @param {string} slug - Brand slug
 * @returns {Promise<Object|null>} Brand document or null if not found
 */
export async function getBrandBySlug(slug) {
  try {
    const result = await databases.listDocuments(DB, COLLECTIONS.BRANDS, [Query.equal('slug', slug)]);

    if (result.documents.length === 0) {
      return null;
    }

    return result.documents[0];
  } catch (error) {
    throw new Error(`Failed to fetch brand by slug ${slug}: ${error.message}`);
  }
}

/**
 * List all active brands
 * @returns {Promise<Array>} Array of active brand documents
 */
export async function listActiveBrands() {
  try {
    const result = await databases.listDocuments(DB, COLLECTIONS.BRANDS, [
      Query.equal('active', true),
    ]);

    return result.documents;
  } catch (error) {
    throw new Error(`Failed to list active brands: ${error.message}`);
  }
}

/**
 * Update a brand
 * @param {string} brandId - Brand slug ID
 * @param {Object} updateData - Partial update (active, tokenSchema, etc.)
 * @returns {Promise<Object>} Updated brand document
 */
export async function updateBrand(brandId, updateData) {
  try {
    return await databases.updateDocument(DB, COLLECTIONS.BRANDS, brandId, updateData);
  } catch (error) {
    throw new Error(`Failed to update brand ${brandId}: ${error.message}`);
  }
}
