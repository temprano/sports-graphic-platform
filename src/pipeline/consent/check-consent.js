/**
 * src/pipeline/consent/check-consent.js
 *
 * Consent gate for all AI enhancements in the pipeline.
 * Every AI enhancement job must call checkConsent() before running.
 * If consent is not explicitly granted, the fallback path is used.
 *
 * See SCHEMA.md for consent flag definitions.
 * See check-consent.test.js for full test coverage.
 *
 * Usage:
 *   import { checkConsent, applyWithConsent } from './check-consent.js';
 *
 *   // Check a single flag
 *   if (checkConsent(player.consentLog, 'aiMotion')) { ... }
 *
 *   // Apply enhancement with automatic fallback
 *   const result = await applyWithConsent(
 *     player.consentLog,
 *     'poseAdjustment',
 *     () => runPoseAdjustment(photo),   // enhancement fn
 *     () => useOriginalPhoto(photo)     // fallback fn
 *   );
 */

// ─── Valid consent flags ──────────────────────────────────────────

export const CONSENT_FLAGS = {
  BACKGROUND_REMOVAL: 'backgroundRemoval',
  COLOR_ADJUSTMENT:   'colorAdjustment',
  POSE_ADJUSTMENT:    'poseAdjustment',
  AI_MOTION:          'aiMotion',
  MARKETING_USE:      'marketingUse',
};

// ─── Core functions ───────────────────────────────────────────────

/**
 * Checks whether a specific AI enhancement has been consented to.
 * Returns false for any absent, null, or non-true value.
 * Consent must be explicitly true — never assumed.
 *
 * @param {object|string} consentLog - consent log object or JSON string
 * @param {string} flag              - consent flag key (use CONSENT_FLAGS)
 * @returns {boolean}
 */
export function checkConsent(consentLog, flag) {
  if (!consentLog) return false;
  if (!Object.values(CONSENT_FLAGS).includes(flag)) {
    throw new Error(`checkConsent: unknown flag '${flag}'`);
  }

  // Handle both parsed object and JSON string
  const log = typeof consentLog === 'string'
    ? JSON.parse(consentLog)
    : consentLog;

  // Consent must be explicitly true — missing or null defaults to false
  return log?.flags?.[flag] === true;
}

/**
 * Applies an AI enhancement if consent is given, otherwise runs fallback.
 * Both paths must return a value — fallback must produce valid output.
 * Logs which path was taken for audit purposes.
 *
 * @param {object}   consentLog   - player consent log
 * @param {string}   flag         - consent flag to check
 * @param {Function} enhanceFn    - async fn to run if consent granted
 * @param {Function} fallbackFn   - async fn to run if consent not granted
 * @param {object}   context      - logging context { playerId, orderId }
 * @returns {Promise<any>}        result of whichever fn ran
 */
export async function applyWithConsent(consentLog, flag, enhanceFn, fallbackFn, context = {}) {
  const consented = checkConsent(consentLog, flag);

  if (consented) {
    console.info('Applying AI enhancement', { flag, ...context });
    return enhanceFn();
  }

  console.info('Consent not granted — using fallback', { flag, ...context });
  return fallbackFn();
}

/**
 * Returns a summary of all consent flags for a player.
 * Useful for logging and proof generation metadata.
 *
 * @param {object|string} consentLog
 * @returns {object} { flag: boolean, ... } for all known flags
 */
export function consentSummary(consentLog) {
  return Object.values(CONSENT_FLAGS).reduce((acc, flag) => {
    acc[flag] = checkConsent(consentLog, flag);
    return acc;
  }, {});
}