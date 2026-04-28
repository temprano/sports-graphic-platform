import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { databases, storage } from '../../appwrite/client.js';
import { DB, COLLECTIONS } from '../../appwrite/collections.js';
import { canReleaseFinals, transition, ORDER_STATES } from '../../orders/state-machine.js';
import { bucketId } from '../../lib/storage.js';
import { logger } from '../../lib/logger.js';

/**
 * BullMQ job: package final renders and prepare for fulfillment
 *
 * Creates a manifest of all final assets and uploads to Appwrite.
 * Only runs after PROOF_APPROVED + PAID_IN_FULL are both confirmed.
 *
 * Input data: {orderId, renderedAssetsDir}
 *
 * Returns: {
 *   orderId,
 *   manifestFileId,
 *   assetCount,
 *   status
 * }
 */
export async function run(data) {
  const { orderId, renderedAssetsDir } = data;

  if (!orderId || !renderedAssetsDir) {
    throw new Error('Missing required job data: orderId, renderedAssetsDir');
  }

  logger.info('package-order job starting', {
    orderId,
    renderedAssetsDir,
  });

  try {
    // Load order from Appwrite
    let order;
    try {
      order = await databases.getDocument(DB, COLLECTIONS.ORDERS, orderId);
    } catch (error) {
      throw new Error(`Failed to load order ${orderId}: ${error.message}`);
    }

    // Check if finals can be released
    if (!canReleaseFinals(order)) {
      throw new Error(`Order ${orderId} is not eligible for finals release (not PROOF_APPROVED + PAID_IN_FULL)`);
    }

    // Scan rendered assets directory
    const assets = {
      videos: [],
      prints: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // Scan for video files
      const videoDir = `${renderedAssetsDir}/video`;
      if (readdirSync(videoDir, { withFileTypes: true }).length > 0) {
        const videoFiles = readdirSync(videoDir);
        assets.videos = videoFiles.map(file => ({
          filename: file,
          path: `video/${file}`,
        }));
      }
    } catch (error) {
      logger.warn('No video directory or error scanning', { error: error.message });
    }

    try {
      // Scan for print files
      const printDir = `${renderedAssetsDir}/print`;
      if (readdirSync(printDir, { withFileTypes: true }).length > 0) {
        const printFiles = readdirSync(printDir, { recursive: true });
        assets.prints = printFiles
          .filter(file => typeof file === 'string')
          .map(file => ({
            filename: file.split('/').pop(),
            path: `print/${file}`,
          }));
      }
    } catch (error) {
      logger.warn('No print directory or error scanning', { error: error.message });
    }

    const totalAssets = assets.videos.length + assets.prints.length;

    if (totalAssets === 0) {
      throw new Error(`No rendered assets found in ${renderedAssetsDir}`);
    }

    // Create manifest file
    const manifest = {
      orderId,
      packagedAt: new Date().toISOString(),
      assets,
      assetCount: totalAssets,
    };

    const manifestJson = JSON.stringify(manifest, null, 2);
    const manifestBuffer = Buffer.from(manifestJson, 'utf8');

    // Upload manifest to finals bucket
    const manifestFileId = `${orderId}/manifest.json`;
    const finalsBucketId = bucketId('finals');

    try {
      await storage.createFile(finalsBucketId, manifestFileId, manifestBuffer);
    } catch (error) {
      throw new Error(`Failed to upload manifest to finals bucket: ${error.message}`);
    }

    logger.info('manifest uploaded', {
      orderId,
      manifestFileId,
      assetCount: totalAssets,
    });

    // Transition order state to FULFILLMENT
    try {
      await transition(order, ORDER_STATES.FULFILLMENT, {
        triggeredBy: 'package-order-job',
      });
    } catch (error) {
      throw new Error(`Failed to transition order to FULFILLMENT: ${error.message}`);
    }

    logger.info('package-order job complete', {
      orderId,
      manifestFileId,
      assetCount: totalAssets,
    });

    return {
      orderId,
      manifestFileId,
      assetCount: totalAssets,
      status: 'packaged',
    };
  } catch (error) {
    logger.error('package-order job failed', {
      orderId,
      error: error.message,
    });
    throw error;
  }
}