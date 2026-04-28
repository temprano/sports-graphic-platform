/**
 * src/pipeline/hyperframes-client.js
 *
 * Hyperframes REST API client for rendering HTML compositions to video.
 * Handles composition rendering with per-player/per-format variants.
 *
 * API Endpoint: http://localhost:3000 (default dev config)
 * Supports: MP4 export, custom dimensions, frame rate control
 */

import { logger } from '../lib/logger.js';

const HYPERFRAMES_ENDPOINT = process.env.HYPERFRAMES_ENDPOINT || 'http://localhost:3000';
const RENDER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes max per render

/**
 * Health check: verify Hyperframes is reachable
 * @returns {Promise<boolean>} true if reachable
 */
export async function isReachable() {
  try {
    const response = await fetch(`${HYPERFRAMES_ENDPOINT}/health`, {
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    logger.warn('Hyperframes unreachable', {
      endpoint: HYPERFRAMES_ENDPOINT,
      error: error.message,
    });
    return false;
  }
}

/**
 * Render an HTML composition to MP4 video
 *
 * @param {object} options
 * @param {string} options.html - HTML template content
 * @param {object} options.data - Template variables (player, team, brand tokens, etc)
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
    html,
    data,
    width,
    height,
    fps = 30,
    duration,
    outputPath,
  } = options;

  if (!html || !data || !width || !height || !duration || !outputPath) {
    throw new Error(
      'Missing required render options: html, data, width, height, duration, outputPath'
    );
  }

  logger.info('Starting Hyperframes render', {
    width,
    height,
    fps,
    duration,
    outputPath,
  });

  try {
    // POST to /render endpoint
    const response = await Promise.race([
      fetch(`${HYPERFRAMES_ENDPOINT}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          data,
          width,
          height,
          fps,
          duration,
          outputPath,
        }),
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Render timeout')), RENDER_TIMEOUT_MS)
      ),
    ]);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Render failed: ${response.status} ${error}`);
    }

    const result = await response.json();

    logger.info('Hyperframes render complete', {
      outputPath,
      fileSize: result.fileSize,
    });

    return {
      outputPath: result.outputPath,
      width: result.width,
      height: result.height,
      duration: result.duration,
      fileSize: result.fileSize,
    };
  } catch (error) {
    logger.error('Hyperframes render failed', {
      outputPath,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Batch render multiple compositions
 * Renders sequentially (Hyperframes may have concurrency limits)
 *
 * @param {array} compositions - Array of render option objects
 * @returns {Promise<array>} results for each composition
 */
export async function renderBatch(compositions) {
  const results = [];

  for (const comp of compositions) {
    try {
      const result = await renderComposition(comp);
      results.push({ success: true, ...result });
    } catch (error) {
      results.push({ success: false, error: error.message, outputPath: comp.outputPath });
    }
  }

  return results;
}