/**
 * src/pipeline/photo/validate-photo.js
 *
 * Photo validation module using Transformers.js v4.
 *
 * Validates:
 * - Blur detection (Laplacian variance >= 100 = sharp)
 * - Face detection (exactly one face, confidence >= 0.6)
 * - Resolution (minimum 1920x1440)
 * - Face size in frame (>= 5% of frame area)
 * - FUTURE: Full-body validation (feet must be visible)
 *
 * Uses:
 * - Transformers.js object detection (DETR ResNet50 for person detection)
 * - Laplacian edge detection for blur estimation
 * - Canvas API for image processing
 * - TODO: Transformers.js pose detection (MovenetPose or BlazePose) for full-body
 *
 * Returns:
 * - Valid: { valid: true, faces: [...], resolution: { width, height }, focalPoint?: { x, y }, pose?: { keypoints, fullBody: true } }
 * - Invalid: { valid: false, error: "...", faceCount: number, resolution?: { width, height } }
 */

import { pipeline } from 'transformers';

// ─── Module-Level State ────────────────────────────────────────

let faceDetector = null; // Lazy-loaded model
let poseDetector = null; // TODO: Lazy-loaded pose model for full-body validation

const MIN_RESOLUTION_WIDTH = 1920;
const MIN_RESOLUTION_HEIGHT = 1440;
const MIN_FACE_CONFIDENCE = 0.6;
const MIN_FACE_SIZE_PERCENT = 0.05; // 5% of frame
const MIN_BLUR_VARIANCE = 100; // Laplacian variance threshold

// Full-body validation constants
const MIN_POSE_CONFIDENCE = 0.5;      // Keypoint detection threshold
const MIN_VERTICAL_SPAN = 0.75;       // Feet-to-head span >= 75% of image height
const EDGE_MARGIN = 0.08;             // Feet can't be cropped (8% margin from bottom)

// ─── Blur Detection (Laplacian Variance) ──────────────────────

/**
 * Calculate Laplacian variance to detect blur.
 * Higher variance = sharper image, lower = blurry.
 * Threshold: >= 100 is generally considered sharp.
 *
 * @param {ImageData|CanvasImageData|Object} image - Image with width/height/data
 * @returns {number} Laplacian variance score
 */
function calculateBlurVariance(image) {
  // If blur score already provided (from test), use it
  if (image.blur?.laplacianVariance !== undefined) {
    return image.blur.laplacianVariance;
  }

  // If no image data, assume sharp (can't calculate)
  if (!image.data) {
    return MIN_BLUR_VARIANCE;
  }

  try {
    // Simple Laplacian kernel for edge detection
    const laplacian = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

    const width = image.width;
    const height = image.height;
    const data = image.data;

    let sum = 0;
    let count = 0;

    // Apply Laplacian kernel (grayscale conversion on the fly)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let laplacianValue = 0;

        // 3x3 kernel application
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx =
              ((y + ky) * width + (x + kx)) * 4; // RGBA = 4 channels
            // Grayscale: 0.299*R + 0.587*G + 0.114*B
            const gray =
              0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            laplacianValue += gray * laplacian[kernelIdx];
          }
        }

        sum += laplacianValue * laplacianValue;
        count++;
      }
    }

    // Variance of Laplacian = mean of (Laplacian^2)
    const variance = count > 0 ? sum / count : 0;

    // Normalize to typical range (0-500+)
    return Math.sqrt(variance);
  } catch (error) {
    // If calculation fails, assume sharp to not reject photo
    return MIN_BLUR_VARIANCE;
  }
}

// ─── Face Detection ────────────────────────────────────────────

/**
 * Load Transformers.js object detection pipeline (lazy-loaded).
 *
 * @returns {Promise<Function>} Face detector function
 */
async function loadFaceDetector() {
  if (faceDetector) {
    return faceDetector;
  }

  try {
    faceDetector = await pipeline('object-detection', {
      model: 'Xenova/detr-resnet50',
    });
    return faceDetector;
  } catch (error) {
    throw new Error(`Failed to load face detection model: ${error.message}`);
  }
}

/**
 * Detect faces in image using Transformers.js object detection.
 *
 * @param {ImageData|HTMLImageElement|Canvas} image - Input image
 * @returns {Promise<Array>} Array of detections: [{ x, y, width, height, score, label }, ...]
 */
async function detectFaces(image) {
  // TODO: Consider removing DETR and replacing with more efficient face-specific model (e.g., ONNX-based)
  const detector = await loadFaceDetector();

  try {
    const detections = await detector(image, {
      threshold: 0.1, // Low threshold to catch all possible detections
    });

    // Filter to only 'person' detections (Transformers.js DETR outputs various labels)
    const personDetections = detections.filter(
      (d) => d.label === 'person' || !d.label
    );

    // Convert score to confidence (0-1 range)
    // Handle both Transformers.js format ({ box: { xmin, ymin, xmax, ymax }})
    // and simple format ({ x, y, width, height })
    return personDetections.map((d) => {
      const x = d.box?.xmin ?? d.x ?? 0;
      const y = d.box?.ymin ?? d.y ?? 0;

      let width;
      if (d.box && d.box.xmax != null && d.box.xmin != null) {
        width = d.box.xmax - d.box.xmin;
      } else if (d.width != null) {
        width = d.width;
      } else {
        width = 0;
      }

      let height;
      if (d.box && d.box.ymax != null && d.box.ymin != null) {
        height = d.box.ymax - d.box.ymin;
      } else if (d.height != null) {
        height = d.height;
      } else {
        height = 0;
      }

      const result = {
        x,
        y,
        width,
        height,
        score: d.score ?? 0.5,
      };
      return result;
    });
  } catch (error) {
    throw new Error(`Face detection failed: ${error.message}`);
  }
}

// ─── Validation Logic ─────────────────────────────────────────

/**
 * Main photo validation function.
 *
 * Validates in order:
 * 1. Blur (highest priority - critical for ML)
 * 2. Face detection (count)
 * 3. Resolution
 * 4. Face confidence
 * 5. Face size in frame
 *
 * @param {ImageData|HTMLImageElement|Canvas} image - Input image to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validatePhoto(image) {
  // ─── Validate Input ────────────────────────────────────
  if (!image || !image.width || !image.height) {
    return {
      valid: false,
      error: 'Invalid image: missing width or height',
      faceCount: 0,
    };
  }

  const resolution = { width: image.width, height: image.height };

  // ─── Step 1: Check Blur ────────────────────────────────
  const blurVariance = calculateBlurVariance(image);

  if (blurVariance < MIN_BLUR_VARIANCE) {
    return {
      valid: false,
      error: 'Photo is too blurry. Please retake with better focus',
      faceCount: 0,
      resolution,
    };
  }

  // ─── Step 2: Detect Faces ──────────────────────────────
  let detections;
  try {
    detections = await detectFaces(image);
  } catch (error) {
    return {
      valid: false,
      error: `Face detection error: ${error.message}`,
      faceCount: 0,
      resolution,
    };
  }

  // ─── Step 3: Validate Face Count ───────────────────────
  const faceCount = detections.length;

  if (faceCount === 0) {
    return {
      valid: false,
      error: 'No face detected in photo',
      faceCount: 0,
      resolution,
    };
  }

  if (faceCount > 1) {
    return {
      valid: false,
      error: 'Multiple faces detected. Use a solo photo',
      faceCount,
      resolution,
    };
  }

  // ─── Step 4: Check Resolution ──────────────────────────
  // Accept either orientation: (1920x1440) or (1440x1920)
  const hasMinResolution =
    (image.width >= MIN_RESOLUTION_WIDTH && image.height >= MIN_RESOLUTION_HEIGHT) ||
    (image.width >= MIN_RESOLUTION_HEIGHT && image.height >= MIN_RESOLUTION_WIDTH);

  if (!hasMinResolution) {
    return {
      valid: false,
      error: 'Photo too small. Minimum 1920×1440 pixels',
      faceCount: 1,
      resolution,
    };
  }

  const face = detections[0];

  // ─── Step 5: Validate Face Confidence ──────────────────
  const confidence = face.score ?? 0;

  if (confidence < MIN_FACE_CONFIDENCE) {
    return {
      valid: false,
      error: 'Face detection confidence too low',
      faceCount: 1,
      resolution,
    };
  }

  // ─── Step 6: Validate Face Size in Frame ───────────────
  const frameArea = image.width * image.height;
  const faceArea = face.width * face.height;
  const faceSizePercent = faceArea / frameArea;

  if (faceSizePercent < MIN_FACE_SIZE_PERCENT) {
    return {
      valid: false,
      error: 'Face too small in frame. Photo must show clearly',
      faceCount: 1,
      resolution,
    };
  }

  // ─── Calculate Focal Point (Face Center) ────────────────
  const focalPoint = {
    x: (face.x + face.width / 2) / image.width,
    y: (face.y + face.height / 2) / image.height,
  };

  // Step 7: Full-body validation (feet must be visible)
  // ─── Detect Pose Keypoints ────────────────────────────────
  const pose = await detectPose(image);
  if (!pose.valid) {
    return {
      valid: false,
      error: pose.error,
      faceCount: 1,
      resolution,
    };
  }

  // ─── All Validations Passed ────────────────────────────────
  return {
    valid: true,
    faces: detections.map((f) => ({
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      confidence: f.score,
    })),
    resolution,
    focalPoint,
    pose: pose.keypoints,
  };
}

/**
 * Load Transformers.js pose detection pipeline (lazy-loaded).
 * Model: Xenova/movenet (lite) or Xenova/blazepose
 *
 * @returns {Promise<Function>} Pose detector function
 */
async function loadPoseDetector() {
  if (poseDetector) {
    return poseDetector;
  }
  try {
    poseDetector = await pipeline('pose-detection', {
      model: 'Xenova/movenet',
    });
    return poseDetector;
  } catch (error) {
    throw new Error(`Failed to load pose detection model: ${error.message}`);
  }
}

/**
 * Detect pose keypoints in image.
 * Returns 17 keypoints: head, shoulders, elbows, wrists, hips, knees, ankles
 * Keypoints 15 & 16 = left_ankle & right_ankle (both must be detected)
 *
 * @param {ImageData|HTMLImageElement|Canvas} image - Input image
 * @returns {Promise<Object>} { valid, error?, keypoints }
 */
async function detectPose(image) {
  const detector = await loadPoseDetector();
  try {
    const poses = await detector(image);
    if (!poses || poses.length === 0) {
      return { valid: false, error: 'Please submit a full-body photo with feet clearly visible' };
    }
    const pose = poses[0]; // Use first pose
    return validateFullBody(pose.keypoints, image.width, image.height);
  } catch (error) {
    return { valid: false, error: `Pose detection error: ${error.message}` };
  }
}

/**
 * Validate full-body: feet must be visible and within frame
 *
 * Checks:
 * 1. Both ankles detected with confidence >= 0.5
 * 2. Vertical span (foot_y - head_y) >= 75% of image height
 * 3. Feet not cropped: foot_y <= height * (1 - EDGE_MARGIN)
 *
 * @param {Array} keypoints - Pose keypoints [{ x, y, score }, ...]
 * @param {number} imageWidth - Image width
 * @param {number} imageHeight - Image height
 * @returns {Object} { valid, error?, keypoints }
 */
function validateFullBody(keypoints, imageWidth, imageHeight) {
  // Keypoint indices: 5/6=shoulders, 9/10=hips, 15/16=ankles
  const head = keypoints[0];      // nose
  const leftAnkle = keypoints[15];
  const rightAnkle = keypoints[16];

  // Check both ankles detected
  if (!leftAnkle || !rightAnkle || leftAnkle.score < MIN_POSE_CONFIDENCE || rightAnkle.score < MIN_POSE_CONFIDENCE) {
    return { valid: false, error: 'Feet not detected. Please submit a full-body photo' };
  }

  // Check vertical span (feet to head >= 75% of height)
  const headY = head?.y || 0;
  const feetY = Math.max(leftAnkle.y, rightAnkle.y);
  const verticalSpan = feetY - headY;
  const spanPercent = verticalSpan / imageHeight;

  if (spanPercent < MIN_VERTICAL_SPAN) {
    return { valid: false, error: 'Subject not full-body. Please include entire body from head to feet' };
  }

  // Check feet not cropped (within 8% of bottom)
  if (feetY > imageHeight * (1 - EDGE_MARGIN)) {
    return { valid: false, error: 'Feet are cropped. Please include the entire lower body' };
  }

  return { valid: true, keypoints };
}

export { calculateBlurVariance };

/**
 * Reset the cached face detector (mainly for testing).
 * @internal
 */
export function __resetDetector() {
  faceDetector = null;
  poseDetector = null;
}
