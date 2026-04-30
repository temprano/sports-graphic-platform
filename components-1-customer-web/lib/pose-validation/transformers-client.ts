/**
 * components-1-customer-web/lib/pose-validation/transformers-client.ts
 *
 * Client-side pose detection using Transformers.js v4.
 * Uses PoseNet to detect body keypoints and classify pose angle.
 *
 * Features:
 * - Client-side ML (no server calls)
 * - Model caching after first load
 * - Automatic pose angle detection
 * - Confidence scoring
 * - Graceful fallback if unavailable
 *
 * Note: Transformers.js loads models from Hugging Face CDN.
 * First use will download the model (~100MB), subsequent uses are instant.
 */

import type { ValidationResult } from '../types/order';

interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

interface DetectedPose {
  keypoints: Keypoint[];
  score: number;
}

// Cache model after first load
let modelCache: any = null;
let modelLoadPromise: Promise<any> | null = null;

/**
 * Load Transformers.js PoseNet model (cached).
 * Downloads ~100MB on first call, cached afterward.
 *
 * @returns {Promise<Object>} PoseNet model
 * @throws {Error} if model loading fails
 */
async function loadModel() {
  if (modelCache) {
    return modelCache;
  }

  // If load is in progress, wait for it
  if (modelLoadPromise) {
    return modelLoadPromise;
  }

  modelLoadPromise = (async () => {
    try {
      // Dynamically import Transformers.js
      const { pipeline } = await import('@xenova/transformers');

      console.log('Loading PoseNet model...');
      const detector = await pipeline('pose-detection', 'Xenova/posenet');
      console.log('PoseNet model loaded');

      modelCache = detector;
      return detector;
    } catch (error) {
      console.error('Failed to load PoseNet model:', error);
      throw new Error(`Model loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      modelLoadPromise = null;
    }
  })();

  return modelLoadPromise;
}

/**
 * Determine pose angle from keypoints.
 * Analyzes shoulder and hip positions to classify pose.
 *
 * @param {Array} keypoints - detected body keypoints
 * @returns {Object} { poseType, confidence, angle }
 */
function determinePoseAngle(keypoints: Keypoint[]) {
  // Find key body parts
  const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
  const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
  const leftHip = keypoints.find(kp => kp.name === 'left_hip');
  const rightHip = keypoints.find(kp => kp.name === 'right_hip');
  const nose = keypoints.find(kp => kp.name === 'nose');

  if (!leftShoulder || !rightShoulder || !nose) {
    return {
      poseType: 'unknown',
      confidence: 0,
      angle: null,
    };
  }

  // Calculate shoulder alignment
  const shoulderDiff = Math.abs(leftShoulder.x - rightShoulder.x);
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

  // Calculate angle from nose to shoulder midpoint
  const dx = shoulderMidX - nose.x;
  const dy = shoulderMidY - nose.y;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize angle to 0-360
  if (angle < 0) angle += 360;

  // Classify pose based on angle
  let poseType = 'unknown';
  let confidence = 0;

  // Front-facing: shoulders aligned, face pointing straight
  if (shoulderDiff < 30 && angle > 170 && angle < 190) {
    poseType = 'front-facing';
    confidence = Math.min(1, (200 - Math.abs(angle - 180)) / 20);
  }
  // Left angle: left shoulder further back, face pointing left
  else if (leftShoulder.x > rightShoulder.x && angle > 100 && angle < 140) {
    poseType = 'left-angle';
    confidence = Math.min(1, (140 - Math.abs(angle - 120)) / 20);
  }
  // Right angle: right shoulder further back, face pointing right
  else if (rightShoulder.x > leftShoulder.x && angle > 40 && angle < 80) {
    poseType = 'right-angle';
    confidence = Math.min(1, (80 - Math.abs(angle - 60)) / 20);
  } else {
    // Partial match
    poseType = 'unknown';
    confidence = 0;
  }

  return {
    poseType,
    confidence: Math.max(0, Math.min(1, confidence)),
    angle,
  };
}

/**
 * Validate a photo's pose angle.
 * Detects body keypoints and classifies pose (front, left, right).
 *
 * @param {File} photoFile - image file to validate
 * @param {string} requiredPose - expected pose ID (e.g., 'front-facing')
 * @returns {Promise<ValidationResult>}
 */
export async function validatePose(
  photoFile: File,
  requiredPose: string
): Promise<ValidationResult> {
  try {
    // Convert File to Image element for Transformers.js
    const url = URL.createObjectURL(photoFile);
    const img = new Image();

    const imageLoadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });

    await imageLoadPromise;

    // Load model
    const model = await loadModel();

    // Detect pose
    const results = await model(img);
    URL.revokeObjectURL(url);

    if (!results || results.length === 0) {
      return {
        valid: false,
        poseDetected: 'unknown',
        confidence: 0,
        feedback: 'Could not detect person in image. Try a clear full-body photo.',
      };
    }

    // Get primary pose (highest score)
    const bestPose = results[0];
    const { poseType, confidence } = determinePoseAngle(bestPose.keypoints);

    const valid = poseType === requiredPose && confidence > 0.75;

    const poseLabel = {
      'front-facing': 'Front Facing',
      'left-angle': 'Left 45°',
      'right-angle': 'Right 45°',
      'unknown': 'Unknown Angle',
    }[poseType] || poseType;

    const requiredLabel = {
      'front-facing': 'Front Facing',
      'left-angle': 'Left 45°',
      'right-angle': 'Right 45°',
    }[requiredPose] || requiredPose;

    return {
      valid,
      poseDetected: poseType,
      confidence: Math.round(confidence * 100),
      feedback: valid
        ? `Perfect! ${requiredLabel} angle detected (${Math.round(confidence * 100)}% confidence)`
        : `Detected ${poseLabel}, but expected ${requiredLabel}`,
    };
  } catch (error) {
    console.error('Pose validation failed:', error);

    // Graceful fallback
    return {
      valid: false,
      poseDetected: 'error',
      confidence: 0,
      feedback:
        'Validation unavailable. You can proceed anyway, or upload a different photo.',
    };
  }
}

/**
 * Check if pose validation is available (model can be loaded).
 * Useful for UI to show validation status.
 *
 * @returns {Promise<boolean>}
 */
export async function isValidationAvailable(): Promise<boolean> {
  try {
    await loadModel();
    return true;
  } catch {
    return false;
  }
}
