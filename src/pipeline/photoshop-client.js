import { logger } from '../lib/logger.js';

const PHOTOSHOP_ENDPOINT = process.env.PHOTOSHOP_ENDPOINT || 'http://localhost:3001';
const RENDER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if Photoshop service is reachable
 *
 * @returns {Promise<boolean>}
 */
export async function isReachable() {
  try {
    const response = await Promise.race([
      fetch(`${PHOTOSHOP_ENDPOINT}/health`, { timeout: 5000 }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      ),
    ]);
    return response.ok;
  } catch (error) {
    logger.warn('Photoshop service unreachable', {
      endpoint: PHOTOSHOP_ENDPOINT,
      error: error.message,
    });
    return false;
  }
}

/**
 * Render a single print asset with Photoshop UXP
 *
 * @param {object} options
 * @param {string} options.script       - path to .psjs UXP script
 * @param {object} options.printConfig  - print size/dpi configuration (dynamic sizing)
 * @param {object} options.playerData   - player info to inject
 * @param {object} options.brandTokens  - brand design tokens
 * @param {string} options.outputPath   - where to write PDF
 * @returns {Promise<{outputPath, fileSize}>}
 */
export async function renderPrint(options) {
  const { script, printConfig, playerData, brandTokens, outputPath } = options;

  if (!script || !playerData || !brandTokens || !outputPath) {
    throw new Error(
      'Missing required render options: script, playerData, brandTokens, outputPath'
    );
  }

  if (!printConfig) {
    throw new Error('Missing required render option: printConfig (size/dpi configuration)');
  }

  logger.info('Starting Photoshop render', {
    format: printConfig.format || 'unknown',
    size: `${printConfig.width}x${printConfig.height}${printConfig.unit}`,
    playerSlug: playerData.slug,
    outputPath,
  });

  try {
    const response = await Promise.race([
      fetch(`${PHOTOSHOP_ENDPOINT}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          printConfig,
          playerData,
          brandTokens,
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

    logger.info('Photoshop render complete', {
      outputPath,
      fileSize: result.fileSize,
    });

    return {
      outputPath: result.outputPath,
      fileSize: result.fileSize,
    };
  } catch (error) {
    logger.error('Photoshop render failed', {
      outputPath,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Batch render print deliverables
 * Renders sequentially (Photoshop may have concurrency limits)
 *
 * @param {array} renders - Array of render option objects
 * @returns {Promise<array>} results for each render
 */
export async function renderBatch(renders) {
  const results = [];

  for (const renderOpts of renders) {
    try {
      const result = await renderPrint(renderOpts);
      results.push({
        success: true,
        ...result,
      });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}