/**
 * src/queue/jobs/render-video.js
 *
 * Job: RENDER_VIDEOS
 * Renders video compositions via Hyperframes for all players
 * and all video deliverable formats in the order.
 *
 * TODO: Implement when Component 2 pipeline build begins.
 */

import { applyWithConsent, CONSENT_FLAGS } from '../../pipeline/consent/check-consent.js';
import { renderAllFormats } from '../../pipeline/hyperframes-client.js';

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
  //         check aiMotion consent → apply or use static fallback
  //         call renderAllFormats for video deliverables
  // TODO: write rendered file paths to order record
  // TODO: signal next job (GENERATE_PROOFS) when all renders complete

  throw new Error('render-video job: not yet implemented');
}