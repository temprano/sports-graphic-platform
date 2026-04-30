/**
 * src/pipeline/ic-light/ic-light-config.js
 *
 * IC-Light configuration management.
 * Handles loading default lighting settings and merging with brand-specific config.
 *
 * Features:
 * - Load default IC-Light settings from config/ic-light-defaults.json
 * - Merge brand-specific lighting config from brand.json
 * - Validate lighting parameters
 * - Apply fallbacks for missing values
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let defaultsCache = null;

/**
 * Load IC-Light defaults from config file.
 * Cached after first load.
 *
 * @returns {Object} default lighting settings
 */
export function getDefaults() {
  if (defaultsCache) {
    return defaultsCache;
  }

  try {
    const configPath = resolve(__dirname, '../../config/ic-light-defaults.json');
    const configJson = readFileSync(configPath, 'utf-8');
    defaultsCache = JSON.parse(configJson);
    return defaultsCache;
  } catch (error) {
    throw new Error(`Failed to load IC-Light defaults: ${error.message}`);
  }
}

/**
 * Validate lighting parameters.
 *
 * @param {Object} lighting - lighting config to validate
 * @returns {Object} validated lighting config with corrected values
 * @throws {Error} if parameters are invalid
 */
export function validateLighting(lighting) {
  const validated = { ...lighting };

  if (typeof validated.direction !== 'number' || validated.direction < 0 || validated.direction > 360) {
    throw new Error('Light direction must be a number between 0 and 360 degrees');
  }

  if (typeof validated.intensity !== 'number' || validated.intensity < 0.1 || validated.intensity > 1.0) {
    throw new Error('Light intensity must be a number between 0.1 and 1.0');
  }

  if (typeof validated.colorTemperature !== 'number' || validated.colorTemperature < 2700 || validated.colorTemperature > 6500) {
    throw new Error('Light colorTemperature must be between 2700K and 6500K');
  }

  return validated;
}

/**
 * Get effective lighting config for a brand.
 * Merges brand-specific config with defaults, applying fallbacks.
 *
 * @param {Object} brandConfig - brand.json lighting section
 * @returns {Object} effective lighting config with all required parameters
 */
export function resolveConfig(brandConfig = {}) {
  const defaults = getDefaults();
  const defaultLighting = defaults.lighting;

  // Merge: brand config overrides defaults
  const resolved = {
    direction: brandConfig.direction ?? defaultLighting.direction.value,
    intensity: brandConfig.intensity ?? defaultLighting.intensity.value,
    colorTemperature: brandConfig.colorTemperature ?? defaultLighting.colorTemperature.value,
  };

  // Validate merged config
  const validated = validateLighting(resolved);

  return validated;
}

/**
 * Get preset lighting config by name.
 *
 * @param {string} presetName - name of preset (e.g., 'soft_front', 'dramatic_side')
 * @returns {Object} lighting config for preset
 * @throws {Error} if preset not found
 */
export function getPreset(presetName) {
  const defaults = getDefaults();
  const preset = defaults.presets[presetName];

  if (!preset) {
    const available = Object.keys(defaults.presets).join(', ');
    throw new Error(`Unknown preset: ${presetName}. Available: ${available}`);
  }

  return {
    direction: preset.lighting.direction.value,
    intensity: preset.lighting.intensity.value,
    colorTemperature: preset.lighting.colorTemperature.value,
  };
}

/**
 * Get all available presets.
 *
 * @returns {Array} array of preset names
 */
export function listPresets() {
  const defaults = getDefaults();
  return Object.entries(defaults.presets).map(([key, val]) => ({
    id: key,
    name: val.name,
    description: val.description,
  }));
}
