/**
 * Consent gate for AI enhancements.
 * Checks consent flags from SCHEMA.md and routes to primary or fallback path.
 * All flags default to false. Must be explicitly opted in.
 */

/**
 * Check if a consent flag is true for a given enhancement.
 * @param {Object|null|undefined} consentLog - The consentLog object from a player
 * @param {string} flag - Consent flag name (backgroundRemoval, colorAdjustment, poseAdjustment, aiMotion, marketingUse)
 * @returns {boolean} true if flag is explicitly true, false otherwise
 */
export function checkConsent(consentLog, flag) {
  if (!consentLog || typeof consentLog !== 'object') {
    return false;
  }

  const value = consentLog[flag];
  return value === true;
}

/**
 * Apply an enhancement, choosing between primary path (with consent) or fallback (without).
 * @param {string} flag - Consent flag name
 * @param {Object|null|undefined} consentLog - The consentLog object from a player
 * @param {Function} primaryPath - Enhancement function (called when consent is true)
 * @param {Function} fallbackPath - Fallback function (called when consent is false)
 * @returns {Promise} Result from primary or fallback path
 */
export async function applyEnhancement(flag, consentLog, primaryPath, fallbackPath) {
  const hasConsent = checkConsent(consentLog, flag);

  if (hasConsent) {
    return primaryPath();
  } else {
    return fallbackPath();
  }
}
