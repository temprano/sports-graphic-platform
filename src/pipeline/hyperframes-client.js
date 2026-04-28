/**
 * src/pipeline/hyperframes-client.js
 *
 * Client for Hyperframes CLI rendering.
 * Renders HTML compositions to MP4 video assets.
 *
 * TODO: Implement when Component 2 pipeline build begins.
 * See TODO.md — Component 2 / Hyperframes Integration
 *
 * Usage:
 *   import { renderComposition } from './hyperframes-client.js';
 *   const outputPath = await renderComposition({ composition, data, output, width, height, fps });
 */

/**
 * Renders an HTML composition to MP4 using Hyperframes CLI.
 *
 * @param {object} opts
 * @param {string} opts.composition  - path to HTML composition file
 * @param {object} opts.playerData   - injected as window.__playerData
 * @param {object} opts.brandTokens  - injected as window.__brandTokens
 * @param {string} opts.output       - output MP4 path
 * @param {number} opts.width        - frame width in pixels
 * @param {number} opts.height       - frame height in pixels
 * @param {number} opts.fps          - frames per second (default 30)
 * @param {number} opts.duration     - duration in seconds
 * @returns {Promise<{ success: boolean, outputPath: string, dimensions: object }>}
 */
export async function renderComposition(opts) {
  // TODO: implement Hyperframes CLI invocation
  // Inject window.__playerData and window.__brandTokens before render
  // Verify output file exists and check dimensions after render
  throw new Error('hyperframes-client.renderComposition: not yet implemented');
}

/**
 * Renders a composition for all social format deliverables in a team.json.
 * Loops the deliverables array and calls renderComposition per format.
 *
 * @param {object} teamJson     - full team.json object
 * @param {object} player       - single player from teamJson.players
 * @param {string} brandPath    - path to brand folder
 * @param {string} outputDir    - directory to write rendered files
 * @returns {Promise<Array>}    array of render results
 */
export async function renderAllFormats(teamJson, player, brandPath, outputDir) {
  // TODO: implement batch render loop over teamJson.deliverables
  throw new Error('hyperframes-client.renderAllFormats: not yet implemented');
}