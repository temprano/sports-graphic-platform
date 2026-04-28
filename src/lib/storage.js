/**
 * src/lib/storage.js
 *
 * Abstracts the dev (1 bucket) vs prod (4 bucket) storage difference.
 *
 * All pipeline and API code uses this module to get bucket IDs and
 * build file IDs. Never reference bucket names or prefixes directly.
 *
 * Dev:  single 'assets' bucket, file IDs prefixed by area
 * Prod: separate buckets per area, no prefix needed
 *
 * Usage:
 *   import { storage } from './lib/storage.js';
 *
 *   // Get the bucket ID for an area
 *   const bucketId = storage.bucketId('uploads');
 *
 *   // Build a file ID for storage
 *   const fileId = storage.fileId('uploads', orderId, playerId, 'photo.png');
 *
 *   // Parse area from a file ID (dev mode)
 *   const area = storage.parseArea(fileId); // 'uploads'
 */

import { config } from '../config.js';

// Storage areas — these are the logical names used throughout the codebase
export const STORAGE_AREAS = {
  UPLOADS:  'uploads',   // customer photo uploads
  PROOFS:   'proofs',    // watermarked proof assets
  FINALS:   'finals',    // final deliverables
  PREVIEWS: 'previews',  // parent store previews
};

// ─── Bucket resolution ───────────────────────────────────────────

/**
 * Returns the Appwrite bucket ID for a given storage area.
 * Dev: always returns 'assets'
 * Prod: returns the area name as the bucket ID
 *
 * @param {string} area - one of STORAGE_AREAS values
 * @returns {string} Appwrite bucket ID
 */
export function bucketId(area) {
  if (!Object.values(STORAGE_AREAS).includes(area)) {
    throw new Error(`storage.bucketId: unknown area '${area}'`);
  }
  return config.storage.mode === 'prod' ? area : 'assets';
}

// ─── File ID construction ────────────────────────────────────────

const SEP = '__';

/**
 * Builds a file ID for storing in Appwrite.
 * Dev: prefixes with area name so files are identifiable in shared bucket
 * Prod: uses a clean ID without prefix (bucket provides the separation)
 *
 * @param {string} area      - storage area (STORAGE_AREAS value)
 * @param {...string} parts  - ID components (orderId, playerId, filename, etc.)
 * @returns {string} file ID safe for Appwrite storage
 */
export function fileId(area, ...parts) {
  if (!Object.values(STORAGE_AREAS).includes(area)) {
    throw new Error(`storage.fileId: unknown area '${area}'`);
  }

  // Sanitize parts — Appwrite file IDs allow alphanumeric, dash, underscore
  const sanitized = parts
    .filter(Boolean)
    .map(p => String(p).replace(/[^a-zA-Z0-9_-]/g, '-'));

  if (config.storage.mode === 'prod') {
    return sanitized.join(SEP);
  }

  return [area, ...sanitized].join(SEP);
}

/**
 * Parses the storage area from a dev-mode file ID.
 * Returns null in prod mode (no prefix to parse).
 *
 * @param {string} id - Appwrite file ID
 * @returns {string|null} area name or null
 */
export function parseArea(id) {
  if (config.storage.mode === 'prod') return null;
  const prefix = id.split(SEP)[0];
  return Object.values(STORAGE_AREAS).includes(prefix) ? prefix : null;
}

// ─── Convenience named exports ───────────────────────────────────
// These make call sites read clearly without importing STORAGE_AREAS

export const storage = {
  bucketId,
  fileId,
  parseArea,
  areas: STORAGE_AREAS,
};

// ─── File ID examples (for reference) ───────────────────────────
//
// DEV MODE (config.storage.mode = 'dev'):
//
//   uploads__ord-abc123__player-001__photo-original.png
//   uploads__ord-abc123__player-001__photo-cutout.png
//   proofs__ord-abc123__player-intro-full-proof.mp4
//   proofs__ord-abc123__poster-16x20-proof.jpg
//   finals__ord-abc123__delivery.zip
//   previews__westview-hawks__jordan-smith__poster-mockup.jpg
//
// PROD MODE (config.storage.mode = 'prod'):
//   bucket: uploads  →  ord-abc123__player-001__photo-original.png
//   bucket: proofs   →  ord-abc123__player-intro-full-proof.mp4
//   bucket: finals   →  ord-abc123__delivery.zip
//   bucket: previews →  westview-hawks__jordan-smith__poster-mockup.jpg