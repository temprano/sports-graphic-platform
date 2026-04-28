/**
 * src/queue/jobs/package-order.js
 *
 * Job: PACKAGE_ORDER
 * Zips all final rendered assets for an order, writes to Appwrite
 * finals storage, and generates a single-use signed download link.
 *
 * Only runs after PROOF_APPROVED + PAID_IN_FULL are both confirmed.
 * See canReleaseFinals() in src/orders/state-machine.js
 *
 * TODO: Implement when Component 2 pipeline build begins.
 */

import { canReleaseFinals } from '../../orders/state-machine.js';

/**
 * @param {object} data
 * @param {string} data.orderId
 * @param {string} data.renderedAssetsDir  - directory of completed renders
 */
export async function run(data) {
  const { orderId, renderedAssetsDir } = data;

  // TODO: load order from Appwrite
  // TODO: call canReleaseFinals(order) — throw if false (should never reach here)
  // TODO: zip all assets in renderedAssetsDir
  // TODO: upload zip to finals storage bucket via storage.fileId('finals', ...)
  // TODO: generate single-use signed download link (48hr expiry)
  // TODO: write link to order.deliveryLog
  // TODO: transition order state to FULFILLMENT

  throw new Error('package-order job: not yet implemented');
}