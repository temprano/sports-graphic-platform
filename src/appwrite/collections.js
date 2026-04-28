/**
 * src/appwrite/collections.js
 *
 * Central registry of all Appwrite database and collection IDs.
 * Import these constants instead of using string literals anywhere.
 *
 * Usage:
 *   import { DB, COLLECTIONS } from '../appwrite/collections.js';
 *   await databases.getDocument(DB, COLLECTIONS.ORDERS, orderId);
 */

import { config } from '../config.js';

// Database ID
export const DB = config.appwrite.databaseId;

// Collection IDs — match exactly what setup-appwrite.js creates
export const COLLECTIONS = {
  CUSTOMERS:         'customers',
  ORDERS:            'orders',
  TEAMS:             'teams',
  PLAYERS:           'players',
  BRANDS:            'brands',
  PARENT_ORDERS:     'parent_orders',
  FINANCIAL_RECORDS: 'financial_records',
  PROOF_APPROVALS:   'proof_approvals',
  CONSENT_LOGS:      'consent_logs',
};