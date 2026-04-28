/**
 * src/queue/jobs/render-print.js
 *
 * Job: RENDER_PRINTS
 * Renders print assets via Photoshop UXP for all players
 * and all print deliverable formats in the order.
 *
 * TODO: Implement when Component 2 pipeline build begins.
 */

import { applyWithConsent, CONSENT_FLAGS } from '../../pipeline/consent/check-consent.js';
import { renderAllPrints } from '../../pipeline/photoshop-client.js';

/**
 * @param {object} data
 * @param {string} data.orderId
 * @param {string} data.teamJsonPath
 * @param {string} data.brandPath
 * @param {string} data.outputDir
 */
export async function run(data) {
  const { orderId, teamJsonPath, brandPath, outputDir } = data;

  // TODO: load team.json
  // TODO: for each player:
  //         check poseAdjustment consent
  //         call renderAllPrints for print deliverables
  // TODO: write rendered PDF paths to order record
  // TODO: signal next job when all prints complete

  throw new Error('render-print job: not yet implemented');
}