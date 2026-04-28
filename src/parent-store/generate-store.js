/**
 * src/parent-store/generate-store.js
 *
 * Generates a parent-facing storefront after a team order is delivered.
 * Creates the store record in Appwrite and notifies the coach.
 *
 * TODO: Implement when Component 4 parent store build begins.
 * See TODO.md — Component 1 / Parent Store
 *
 * Usage:
 *   import { generateParentStore } from './generate-store.js';
 *   await generateParentStore(order, teamJson);
 */

/**
 * @param {object} order    - completed order document from Appwrite
 * @param {object} teamJson - parsed team.json for the order
 * @returns {Promise<{ storeId: string, storeUrl: string }>}
 */
export async function generateParentStore(order, teamJson) {
  // TODO: check order.state === DELIVERED
  // TODO: check teamJson.parentStore.enabled === true
  // TODO: generate URL-safe store slug from team name + season
  // TODO: create parent_store record in Appwrite with:
  //         teamOrderId, slug, products, openDate, closeDate,
  //         visibility, shareCode, allowedProducts
  // TODO: link store ID to order record
  // TODO: notify coach via email with store URL + share code

  throw new Error('generateParentStore: not yet implemented');
}