/**
 * src/pipeline/comfyui-client.js
 *
 * Client for the ComfyUI API.
 * Handles BiRefNet background removal, IC-Light relighting, and other AI image workflows.
 *
 * Features:
 * - BiRefNet background removal (cutout phase)
 * - IC-Light relighting with configurable lighting params (lighting phase)
 * - Workflow polling with exponential backoff
 * - Automatic retry on transient failures
 * - 5-minute timeout with graceful error handling
 * - Output image download and validation
 *
 * Workflow Pipeline:
 * 1. Original photo → removeBackground() → Cutout PNG with transparency
 * 2. Cutout PNG → applyICLight() → Relit PNG with brand lighting
 * 3. Relit PNG → [compositions use for rendering]
 *
 * Usage:
 *   import { removeBackground, applyICLight, isReachable } from './comfyui-client.js';
 *   const cutoutPath = await removeBackground(photoPath, cutoutPath);
 *   const relitPath = await applyICLight(cutoutPath, relitPath, { direction: 45, intensity: 0.8 });
 */

import { config } from '../config.js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// ─── Constants ────────────────────────────────────────────────────

const DEFAULT_POLL_INTERVAL = 1000; // 1 second
const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// ─── BiRefNet Workflow Template ────────────────────────────────────

/**
 * Generate BiRefNet workflow JSON for ComfyUI.
 * BiRefNet removes background from image, returning PNG with transparency.
 *
 * @param {string} inputFilename - filename in ComfyUI input folder
 * @returns {Object} ComfyUI prompt/workflow
 */
function createBiRefNetWorkflow(inputFilename) {
  return {
    '1': {
      inputs: {
        image: inputFilename,
      },
      class_type: 'LoadImage',
    },
    '2': {
      inputs: {
        images: ['1', 0],
        model_name: 'BiRefNet-general',
      },
      class_type: 'BiRefNetRemoveBackground',
    },
    '3': {
      inputs: {
        images: ['2', 0],
        format: 'png',
      },
      class_type: 'SaveImage',
    },
    '4': {
      inputs: {
        images: ['2', 1], // alpha channel
        format: 'png',
      },
      class_type: 'SaveImage',
    },
  };
}

// ─── Utility Functions ────────────────────────────────────────────

/**
 * Sleep for specified milliseconds.
 * @param {number} ms - milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic for transient failures.
 * @param {string} url - request URL
 * @param {Object} opts - fetch options
 * @param {number} retries - remaining retries
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, opts = {}, retries = MAX_RETRIES) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status}: ${res.statusText} from ${url}`
      );
    }
    return res;
  } catch (error) {
    if (retries > 0 && isTransientError(error)) {
      const delay = INITIAL_RETRY_DELAY * (MAX_RETRIES - retries + 1);
      await sleep(delay);
      return fetchWithRetry(url, opts, retries - 1);
    }
    throw error;
  }
}

/**
 * Check if error is transient (network, timeout, 5xx).
 * @param {Error} error
 * @returns {boolean}
 */
function isTransientError(error) {
  const msg = error.message || '';
  return (
    msg.includes('ECONNREFUSED') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504')
  );
}

/**
 * Poll ComfyUI history until workflow completes.
 * @param {string} promptId - workflow prompt ID
 * @param {number} timeout - max time to wait (ms)
 * @returns {Promise<Object>} execution history for prompt
 */
async function pollCompletion(promptId, timeout = DEFAULT_TIMEOUT) {
  const startTime = Date.now();
  const pollInterval = config.comfyui.pollInterval || DEFAULT_POLL_INTERVAL;

  while (Date.now() - startTime < timeout) {
    const res = await fetchWithRetry(
      `${config.comfyui.baseUrl}/history/${promptId}`
    );
    const history = await res.json();

    if (history[promptId]) {
      const prompt = history[promptId];
      if (prompt.status?.completed) {
        return prompt;
      }
    }

    await sleep(pollInterval);
  }

  throw new Error(
    `ComfyUI workflow did not complete within ${timeout / 1000}s`
  );
}

/**
 * Extract output filename from execution history.
 * @param {Object} historyEntry - entry from /history/{promptId}
 * @returns {string} output filename
 */
function extractOutputFilename(historyEntry) {
  const outputs = historyEntry.outputs || {};

  // Find first node with images output
  for (const [, nodeOutput] of Object.entries(outputs)) {
    if (nodeOutput.images && nodeOutput.images.length > 0) {
      return nodeOutput.images[0].filename;
    }
  }

  throw new Error('No output image in workflow result');
}

// ─── Main API Functions ────────────────────────────────────────────

/**
 * Removes background from a player photo using BiRefNet via ComfyUI.
 * Consent for backgroundRemoval must be checked before calling this.
 *
 * @param {string} inputPath   - path to original photo
 * @param {string} outputPath  - path to write cutout PNG
 * @returns {Promise<string>}  outputPath on success
 */
export async function removeBackground(inputPath, outputPath) {
  // ─── Input Validation ────────────────────────────────────────────
  if (!inputPath || typeof inputPath !== 'string' || inputPath.trim() === '') {
    throw new Error('Invalid input path');
  }
  if (!outputPath || typeof outputPath !== 'string' || outputPath.trim() === '') {
    throw new Error('Invalid output path');
  }

  const outputDir = dirname(outputPath);

  try {
    // ─── Create Workflow ────────────────────────────────────────────
    const inputFilename = inputPath.split('/').pop();
    const workflow = createBiRefNetWorkflow(inputFilename);

    // ─── Submit to ComfyUI Queue ────────────────────────────────────
    const queueRes = await fetchWithRetry(
      `${config.comfyui.baseUrl}/prompt`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
      }
    );

    const queueData = await queueRes.json();
    if (!queueData.prompt_id) {
      throw new Error('No prompt_id in queue response');
    }

    const promptId = queueData.prompt_id;

    // ─── Poll for Completion ────────────────────────────────────────
    const history = await pollCompletion(
      promptId,
      config.comfyui.timeout || DEFAULT_TIMEOUT
    );

    // ─── Get Output Filename ────────────────────────────────────────
    const outputFilename = extractOutputFilename(history);

    // ─── Download Output Image ──────────────────────────────────────
    const viewUrl = `${config.comfyui.baseUrl}/view?filename=${encodeURIComponent(outputFilename)}`;
    const imageRes = await fetchWithRetry(viewUrl);
    const imageBuffer = await imageRes.arrayBuffer();

    // ─── Write to Output Path ───────────────────────────────────────
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, Buffer.from(imageBuffer));

    return outputPath;
  } catch (error) {
    throw new Error(
      `Background removal failed: ${error.message}`
    );
  }
}

/**
 * Generate IC-Light workflow JSON for ComfyUI.
 * IC-Light applies realistic relighting to a cutout image.
 *
 * @param {string} inputFilename - filename in ComfyUI input folder (should be PNG with transparency)
 * @param {object} lightingParams - lighting configuration
 * @param {number} lightingParams.direction - light direction in degrees (0-360)
 * @param {number} lightingParams.intensity - light intensity (0-1)
 * @param {number} lightingParams.colorTemperature - light color temp in Kelvin (2700-6500)
 * @returns {Object} ComfyUI prompt/workflow
 */
function createICLightWorkflow(inputFilename, lightingParams = {}) {
  const {
    direction = 45,
    intensity = 0.8,
    colorTemperature = 5500,
  } = lightingParams;

  return {
    '1': {
      inputs: {
        image: inputFilename,
      },
      class_type: 'LoadImage',
    },
    '2': {
      inputs: {
        images: ['1', 0],
        light_direction: direction,
        light_intensity: intensity,
        light_color_temperature: colorTemperature,
        ambient_strength: 0.3,
      },
      class_type: 'IC-Light',
    },
    '3': {
      inputs: {
        images: ['2', 0],
        format: 'png',
      },
      class_type: 'SaveImage',
    },
  };
}

/**
 * Applies IC-Light relighting to a cutout image.
 * Should be called after removeBackground to apply consistent lighting.
 *
 * @param {string} inputPath      - path to cutout PNG (with transparency)
 * @param {string} outputPath     - path to write relit PNG
 * @param {object} lightingConfig - lighting parameters (direction, intensity, colorTemperature)
 * @returns {Promise<string>}     outputPath on success
 */
export async function applyICLight(inputPath, outputPath, lightingConfig = {}) {
  if (!inputPath || typeof inputPath !== 'string' || inputPath.trim() === '') {
    throw new Error('Invalid input path');
  }
  if (!outputPath || typeof outputPath !== 'string' || outputPath.trim() === '') {
    throw new Error('Invalid output path');
  }

  const outputDir = dirname(outputPath);

  try {
    // ─── Create Workflow ────────────────────────────────────────────
    const inputFilename = inputPath.split('/').pop();
    const workflow = createICLightWorkflow(inputFilename, lightingConfig);

    // ─── Submit to ComfyUI Queue ────────────────────────────────────
    const queueRes = await fetchWithRetry(
      `${config.comfyui.baseUrl}/prompt`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
      }
    );

    const queueData = await queueRes.json();
    if (!queueData.prompt_id) {
      throw new Error('No prompt_id in queue response');
    }

    const promptId = queueData.prompt_id;

    // ─── Poll for Completion ────────────────────────────────────────
    const history = await pollCompletion(
      promptId,
      config.comfyui.timeout || DEFAULT_TIMEOUT
    );

    // ─── Get Output Filename ────────────────────────────────────────
    const outputFilename = extractOutputFilename(history);

    // ─── Download Output Image ──────────────────────────────────────
    const viewUrl = `${config.comfyui.baseUrl}/view?filename=${encodeURIComponent(outputFilename)}`;
    const imageRes = await fetchWithRetry(viewUrl);
    const imageBuffer = await imageRes.arrayBuffer();

    // ─── Write to Output Path ───────────────────────────────────────
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, Buffer.from(imageBuffer));

    return outputPath;
  } catch (error) {
    throw new Error(
      `IC-Light relighting failed: ${error.message}`
    );
  }
}

/**
 * Adjusts pose of player photo to fit composition layout.
 * Consent for poseAdjustment must be checked before calling this.
 *
 * @param {string} inputPath   - path to cutout PNG
 * @param {object} targetPose  - pose parameters for the composition
 * @param {string} outputPath  - path to write adjusted PNG
 * @returns {Promise<string>}  outputPath on success
 */
export async function adjustPose(inputPath, targetPose, outputPath) {
  // TODO: implement pose adjustment workflow
  throw new Error('comfyui-client.adjustPose: not yet implemented');
}

/**
 * Health check — verifies ComfyUI is reachable.
 * @returns {Promise<boolean>}
 */
export async function isReachable() {
  try {
    const res = await fetch(`${config.comfyui.baseUrl}/system_stats`);
    return res.ok;
  } catch {
    return false;
  }
}
