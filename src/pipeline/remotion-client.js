/**
 * src/pipeline/remotion-client.js
 *
 * Remotion REST API client for rendering React compositions to video.
 * Handles complex animations and interactive compositions via Remotion SDK.
 *
 * API Endpoint: http://localhost:3002 (default dev config for Remotion server)
 * Supports: MP4 export, custom dimensions, frame rate control
 * Composition Type: JSX/React (in components/3-asset-generation/remotion-templates/src)
 */

import { logger } from '../lib/logger.js';

const REMOTION_ENDPOINT = process.env.REMOTION_ENDPOINT || 'http://localhost:3002';
const RENDER_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes max per render (longer than Hyperframes)

/**
 * Health check: verify Remotion is reachable
 * @returns {Promise<boolean>} true if reachable
 */
export async function isReachable() {
  try {
    const response = await fetch(`${REMOTION_ENDPOINT}/health`, {
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    logger.warn('Remotion unreachable', {
      endpoint: REMOTION_ENDPOINT,
      error: error.message,
    });
    return false;
  }
}

/**
 * Render a Remotion React composition to MP4 video
 *
 * @param {object} options
 * @param {string} options.compositionId - Remotion composition ID/name to render
 * @param {object} options.data - Composition props (player, team, brand tokens, etc)
 * @param {number} options.width - Video width in pixels
 * @param {number} options.height - Video height in pixels
 * @param {number} options.fps - Frames per second (default: 30)
 * @param {number} options.duration - Duration in seconds
 * @param {string} options.outputPath - Where to save MP4 file
 *
 * @returns {Promise<object>} { outputPath, width, height, duration, fileSize }
 * @throws {Error} if render fails or timeout
 */
export async function renderComposition(options) {
  const {
    compositionId,
    data,
    width,
    height,
    fps = 30,
    duration,
    outputPath,
  } = options;

  // Validate required parameters
  if (!compositionId || !data || !width || !height || !duration || !outputPath) {
    throw new Error('Missing required render parameters: compositionId, data, width, height, duration, outputPath');
  }

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid dimensions: width and height must be positive integers');
  }

  logger.info('Starting Remotion render', {
    compositionId,
    width,
    height,
    fps,
    duration,
    outputPath,
  });

  try {
    // Render with timeout
    const renderPromise = fetch(`${REMOTION_ENDPOINT}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        compositionId,
        props: data,
        width,
        height,
        fps,
        durationInFrames: Math.round(duration * fps),
        outputPath,
      }),
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Remotion render timeout')), RENDER_TIMEOUT_MS)
    );

    const response = await Promise.race([renderPromise, timeoutPromise]);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Remotion render failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();

    logger.info('Remotion render complete', {
      compositionId,
      outputPath: result.outputPath,
      fileSize: result.fileSize,
    });

    return {
      outputPath: result.outputPath,
      width: result.width || width,
      height: result.height || height,
      duration: result.duration || duration,
      fileSize: result.fileSize,
    };
  } catch (error) {
    logger.error('Remotion render failed', {
      compositionId,
      error: error.message,
      outputPath,
    });
    throw error;
  }
}

/**
 * Render multiple compositions sequentially
 * Continues on individual failures and collects results
 *
 * @param {Array<object>} compositions - array of render options (same as renderComposition)
 * @returns {Promise<Array<object>>} results array [{ success: true/false, ...result/error }]
 */
export async function renderBatch(compositions) {
  if (!Array.isArray(compositions) || compositions.length === 0) {
    return [];
  }

  const results = [];

  for (const comp of compositions) {
    try {
      const result = await renderComposition(comp);
      results.push({
        success: true,
        compositionId: comp.compositionId,
        ...result,
      });
    } catch (error) {
      results.push({
        success: false,
        compositionId: comp.compositionId,
        error: error.message,
      });

      logger.warn('Composition render failed in batch', {
        compositionId: comp.compositionId,
        error: error.message,
      });
    }
  }

  return results;
}
