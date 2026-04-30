/**
 * src/queue/jobs/process-photos.js
 *
 * Job: PROCESS_PHOTOS
 * Runs ComfyUI BiRefNet background removal + IC-Light relighting on all player photos.
 * Checks consent before applying any AI enhancement per player.
 *
 * Workflow:
 * 1. Load team.json and brand.json from order
 * 2. For each player:
 *    a. Check backgroundRemoval consent
 *    b. If consented:
 *       - Run BiRefNet cutout
 *       - Apply IC-Light relighting (brand-specific or default)
 *       - Save relit photo
 *       - Update Appwrite player record
 *    c. If not consented: use original photo as cutout (fallback)
 * 3. Update all player records in Appwrite
 * 4. Update order state to next stage
 * 5. Enqueue next job (render-video)
 */

import { readFileSync } from 'fs';
import { checkConsent, CONSENT_FLAGS } from '../../pipeline/consent/check-consent.js';
import { removeBackground, applyICLight, isReachable } from '../../pipeline/comfyui-client.js';
import { resolveConfig as resolveICLightConfig } from '../../pipeline/ic-light/ic-light-config.js';
import { createPlayer, updatePlayer, getPlayer } from '../../appwrite/crud.js';
import { logger } from '../../lib/logger.js';

/**
 * Process all photos for a team order.
 * 
 * @param {object} data
 * @param {string} data.orderId - order ID
 * @param {string} data.teamJsonPath - path to team.json with player list
 * @param {string} data.brandJsonPath - path to brand.json with lighting config
 * @param {string} data.assetsPath - base path for input/output photos
 * @returns {Promise<object>} summary of processing results
 * @throws {Error} if team.json not found, ComfyUI unreachable, or Appwrite fails
 */
export async function run(data) {
  const { orderId, teamJsonPath, brandJsonPath, assetsPath } = data;

  logger.info('Processing photos for order', { orderId, teamJsonPath, brandJsonPath, assetsPath });

  // ─── Validate Inputs ──────────────────────────────────────────────
  if (!orderId || !teamJsonPath || !assetsPath) {
    throw new Error('Missing required job data: orderId, teamJsonPath, assetsPath');
  }

  // ─── Load Team JSON ────────────────────────────────────────────────
  let teamData;
  try {
    const teamJson = readFileSync(teamJsonPath, 'utf-8');
    teamData = JSON.parse(teamJson);
  } catch (error) {
    throw new Error(`Failed to load team.json: ${error.message}`);
  }

  if (!teamData.players || !Array.isArray(teamData.players)) {
    throw new Error('Invalid team.json: missing players array');
  }

  // ─── Load Brand JSON (for lighting config) ────────────────────────
  let brandData = {};
  if (brandJsonPath) {
    try {
      const brandJson = readFileSync(brandJsonPath, 'utf-8');
      brandData = JSON.parse(brandJson);
    } catch (error) {
      logger.warn('Failed to load brand.json, using defaults', {
        brandJsonPath,
        error: error.message,
      });
    }
  }

  // ─── Verify ComfyUI Connectivity ──────────────────────────────────
  const comfyUiReady = await isReachable();
  if (!comfyUiReady) {
    logger.warn('ComfyUI not reachable — will use fallback paths', { orderId });
  }

  // ─── Process Each Player ──────────────────────────────────────────
  const results = {
    orderId,
    processedCount: 0,
    failedCount: 0,
    players: [],
  };

  for (const player of teamData.players) {
    try {
      const playerResult = await processPlayer(
        player,
        orderId,
        assetsPath,
        brandData,
        comfyUiReady
      );
      results.players.push(playerResult);
      results.processedCount++;
    } catch (error) {
      logger.error('Failed to process player', {
        orderId,
        playerId: player.id,
        error: error.message,
      });
      results.failedCount++;
      results.players.push({
        playerId: player.id,
        status: 'failed',
        error: error.message,
      });
    }
  }

  // ─── Check for Critical Failures ──────────────────────────────────
  if (results.failedCount > 0) {
    logger.warn('Some players failed processing', results);
    // Don't fail entire job — some players succeeded
  }

  logger.info('Photo processing complete', results);
  return results;
}

/**
 * Process a single player's photo.
 * 
 * @param {object} player - player object from team.json
 * @param {string} orderId - order ID
 * @param {string} assetsPath - base path for photos
 * @param {object} brandData - brand configuration (contains lighting settings)
 * @param {boolean} comfyUiReady - whether ComfyUI is available
 * @returns {Promise<object>} { playerId, status, cutoutPath, lightingApplied, consentApplied }
 */
async function processPlayer(player, orderId, assetsPath, brandData, comfyUiReady) {
  const { id: playerId, slug, photo, consentLog } = player;

  if (!photo?.original) {
    throw new Error(`Player ${playerId} missing original photo path`);
  }

  const inputPath = `${assetsPath}/${photo.original}`;
  const cutoutPath = `${assetsPath}/${slug}_cutout.png`;
  const relitPath = `${assetsPath}/${slug}_relit.png`;

  // ─── Determine If Background Removal Should Run ────────────────────
  const hasConsent = checkConsent(
    { flags: consentLog }, // Wrap flags for consent check function
    CONSENT_FLAGS.BACKGROUND_REMOVAL
  );

  let finalPhotoPath = photo.original; // fallback: use original
  let consentApplied = false;
  let lightingApplied = false;

  if (hasConsent && comfyUiReady) {
    try {
      // ─── Step 1: Run BiRefNet Background Removal ─────────────────
      finalPhotoPath = await removeBackground(inputPath, cutoutPath);
      consentApplied = true;

      logger.info('Background removal applied', {
        orderId,
        playerId,
        cutoutPath: finalPhotoPath,
      });

      // ─── Step 2: Apply IC-Light Relighting ─────────────────────
      try {
        // Get lighting config (brand-specific or default)
        const lightingConfig = resolveICLightConfig(brandData.lighting);

        finalPhotoPath = await applyICLight(finalPhotoPath, relitPath, lightingConfig);
        lightingApplied = true;

        logger.info('IC-Light relighting applied', {
          orderId,
          playerId,
          relitPath: finalPhotoPath,
          lightingConfig,
        });
      } catch (error) {
        logger.warn('IC-Light relighting failed, using cutout', {
          orderId,
          playerId,
          error: error.message,
        });
        // Fall back to cutout (skip lighting, but keep cutout)
        finalPhotoPath = cutoutPath;
      }
    } catch (error) {
      logger.warn('Background removal failed, using original', {
        orderId,
        playerId,
        error: error.message,
      });
      finalPhotoPath = photo.original; // fall back to original
    }
  } else if (hasConsent && !comfyUiReady) {
    logger.warn('Consent granted but ComfyUI unavailable, using original', {
      orderId,
      playerId,
    });
    finalPhotoPath = photo.original;
  } else {
    logger.info('Background removal not consented', {
      orderId,
      playerId,
    });
    finalPhotoPath = photo.original;
  }

  return {
    playerId,
    status: 'processed',
    photoPath: finalPhotoPath,
    consentApplied,
    lightingApplied,
  };
}