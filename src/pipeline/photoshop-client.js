/**
 * src/pipeline/photoshop-client.js
 *
 * Client for Photoshop UXP script execution.
 * Drives print asset rendering from .psjs brand templates.
 *
 * TODO: Implement when Component 2 pipeline build begins.
 * See TODO.md — Component 2 / Photoshop UXP Integration
 *
 * Usage:
 *   import { renderPrint } from './photoshop-client.js';
 *   const outputPath = await renderPrint({ script, playerData, brandTokens, outputPath });
 */

/**
 * Executes a Photoshop UXP script to render a print asset.
 * Injects __playerData, __brandTokens, and __outputPath as globals.
 *
 * @param {object} opts
 * @param {string} opts.script       - path to .psjs UXP script
 * @param {object} opts.playerData   - injected as __playerData
 * @param {object} opts.brandTokens  - injected as __brandTokens
 * @param {string} opts.outputPath   - injected as __outputPath
 * @returns {Promise<{ success: boolean, outputPath: string }>}
 */
export async function renderPrint(opts) {
  // TODO: implement UXP script execution via Photoshop CLI / batchPlay
  throw new Error('photoshop-client.renderPrint: not yet implemented');
}

/**
 * Renders all print deliverables for a single player.
 *
 * @param {object} teamJson    - full team.json object
 * @param {object} player      - single player from teamJson.players
 * @param {string} brandPath   - path to brand folder
 * @param {string} outputDir   - directory to write rendered PDFs
 * @returns {Promise<Array>}   array of render results
 */
export async function renderAllPrints(teamJson, player, brandPath, outputDir) {
  // TODO: implement batch loop over print deliverables
  throw new Error('photoshop-client.renderAllPrints: not yet implemented');
}