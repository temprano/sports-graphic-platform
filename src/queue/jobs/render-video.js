/**
 * src/queue/jobs/render-video.js
 *
 * Job: RENDER_VIDEOS
 * Renders video compositions via Hyperframes for all players
 * and all video deliverable formats in the order.
 *
 * Workflow:
 * 1. Load team.json and brand.json
 * 2. For each video deliverable:
 *    a. For each player:
 *       i. Check aiMotion consent
 *       ii. Load composition HTML template
 *       iii. Invoke Hyperframes to render
 *       iv. Save output path
 * 3. Return summary with all rendered files + counts
 */

import { readFileSync } from 'fs';
import { checkConsent } from '../../pipeline/consent/check-consent.js';
import { renderComposition, isReachable } from '../../pipeline/hyperframes-client.js';
import { logger } from '../../lib/logger.js';

/**
 * Render all video compositions for an order.
 *
 * @param {object} data
 * @param {string} data.orderId - order ID
 * @param {string} data.teamJsonPath - path to team.json
 * @param {string} data.brandJsonPath - path to brand.json
 * @param {string} data.compositionsPath - path to compositions directory (contains .html files)
 * @param {string} data.outputDir - where to write rendered MP4 files
 *
 * @returns {Promise<object>} summary { orderId, renderedCount, skippedCount, failedCount, videos: [...] }
 * @throws {Error} if team.json/brand.json not found or Hyperframes unreachable
 */
export async function run(data) {
  const { orderId, teamJsonPath, brandJsonPath, compositionsPath, outputDir } = data;

  logger.info('Starting video render job', { orderId, teamJsonPath, brandJsonPath });

  // ─── Validate Inputs ──────────────────────────────────────────────
  if (!orderId || !teamJsonPath || !brandJsonPath || !compositionsPath || !outputDir) {
    throw new Error('Missing required job data: orderId, teamJsonPath, brandJsonPath, compositionsPath, outputDir');
  }

  // ─── Load team.json ────────────────────────────────────────────────
  let teamData;
  try {
    const teamJson = readFileSync(teamJsonPath, 'utf-8');
    teamData = JSON.parse(teamJson);
  } catch (error) {
    throw new Error(`Failed to load team.json: ${error.message}`);
  }

  if (!teamData.players || !Array.isArray(teamData.players)) {
    throw new Error('team.json missing players array');
  }

  if (!teamData.deliverables || !Array.isArray(teamData.deliverables)) {
    throw new Error('team.json missing deliverables array');
  }

  // ─── Load brand.json ───────────────────────────────────────────────
  let brandData;
  try {
    const brandJson = readFileSync(brandJsonPath, 'utf-8');
    brandData = JSON.parse(brandJson);
  } catch (error) {
    throw new Error(`Failed to load brand.json: ${error.message}`);
  }

  // ─── Check Hyperframes Availability ────────────────────────────────
  const hyperframesReady = await isReachable();
  if (!hyperframesReady) {
    logger.warn('Hyperframes not reachable — cannot render videos', { orderId });
    throw new Error('Hyperframes service not available');
  }

  // ─── Filter Video Deliverables ─────────────────────────────────────
  const videoDeliverables = teamData.deliverables.filter((d) => d.type === 'video');
  if (videoDeliverables.length === 0) {
    logger.warn('No video deliverables in order', { orderId });
    return {
      orderId,
      renderedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      videos: [],
    };
  }

  // ─── Render All Compositions ───────────────────────────────────────
  let renderedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const videos = [];

  for (const deliverable of videoDeliverables) {
    const compositionKey = deliverable.format;
    const compositionDef = brandData.compositions?.[compositionKey];

    if (!compositionDef) {
      logger.error('Composition not found in brand', {
        orderId,
        format: compositionKey,
      });
      failedCount++;
      videos.push({
        format: compositionKey,
        status: 'failed',
        error: 'composition not found',
      });
      continue;
    }

    // Load HTML template
    let htmlTemplate;
    try {
      const templatePath = `${compositionsPath}/${compositionDef.file}`;
      htmlTemplate = readFileSync(templatePath, 'utf-8');
    } catch (error) {
      logger.error('Failed to load composition template', {
        orderId,
        format: compositionKey,
        error: error.message,
      });
      failedCount++;
      videos.push({
        format: compositionKey,
        status: 'failed',
        error: `template not found: ${compositionDef.file}`,
      });
      continue;
    }

    // Render for each player
    for (const player of teamData.players) {
      const hasAiMotionConsent = checkConsent({flags: player.consentLog}, 'aiMotion');
      const playerRenderId = `${player.slug}_${compositionKey}`;

      try {
        // Determine whether to apply AI motion
        const useAiMotion = hasAiMotionConsent;

        // Prepare template data
        const templateData = {
          player: {
            name: player.name,
            firstName: player.firstName,
            lastName: player.lastName,
            number: player.number,
            position: player.position,
            stats: player.stats,
            photo: player.photo.cutout || player.photo.original,
            focalPoint: player.photo.focalPoint || { x: 0.5, y: 0.5 },
          },
          team: {
            name: teamData.team,
            sport: teamData.sport,
            logo: teamData.logo,
          },
          brand: {
            colors: teamData.colors,
            fonts: teamData.fonts,
          },
          flags: {
            useAiMotion,
          },
        };

        // Render composition
        const outputFileName = `${playerRenderId}.mp4`;
        const outputPath = `${outputDir}/${outputFileName}`;

        const renderResult = await renderComposition({
          html: htmlTemplate,
          data: templateData,
          width: compositionDef.width,
          height: compositionDef.height,
          fps: compositionDef.fps || 30,
          duration: compositionDef.duration,
          outputPath,
        });

        renderedCount++;
        videos.push({
          format: compositionKey,
          playerId: player.id,
          playerSlug: player.slug,
          status: 'rendered',
          outputPath: renderResult.outputPath,
          fileSize: renderResult.fileSize,
          dimensions: `${renderResult.width}x${renderResult.height}`,
          aiMotionApplied: useAiMotion,
        });

        logger.info('Video rendered', {
          orderId,
          playerSlug: player.slug,
          format: compositionKey,
          fileSize: renderResult.fileSize,
          aiMotionApplied: useAiMotion,
        });
      } catch (error) {
        failedCount++;
        videos.push({
          format: compositionKey,
          playerId: player.id,
          playerSlug: player.slug,
          status: 'failed',
          error: error.message,
          aiMotionApplied: hasAiMotionConsent,
        });

        logger.error('Failed to render video', {
          orderId,
          playerSlug: player.slug,
          format: compositionKey,
          error: error.message,
        });
      }
    }
  }

  logger.info('Video render job complete', {
    orderId,
    renderedCount,
    skippedCount,
    failedCount,
    totalAttempted: videoDeliverables.length * teamData.players.length,
  });

  return {
    orderId,
    renderedCount,
    skippedCount,
    failedCount,
    videos,
  };
}