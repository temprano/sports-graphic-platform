/**
 * src/brands/validate-brand.js
 *
 * Validates a brand.json registry entry against the schema defined
 * in SCHEMA.md. Run before marking any brand as active: true.
 *
 * TODO: Implement when Component 3 brand template build begins.
 * See TODO.md — Component 3 / Brand Infrastructure
 *
 * Usage:
 *   import { validateBrand } from './validate-brand.js';
 *   const result = validateBrand(brandJson, brandFolderPath);
 *   if (!result.valid) console.error(result.errors);
 */

/**
 * Validates a brand.json object.
 *
 * @param {object} brandJson       - parsed brand.json content
 * @param {string} brandFolderPath - absolute path to brand folder (for file checks)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBrand(brandJson, brandFolderPath) {
  const errors = [];

  // TODO: validate required top-level fields (id, name, active, tokenSchema)
  // TODO: validate tokenSchema has all required color keys (primary, accent, text, background)
  // TODO: validate tokenSchema has required font keys (heading, body)
  // TODO: validate compositions entries have required fields (file, duration, width, height, fps)
  // TODO: validate print entries have required fields (file, width, height, dpi, format, colorSpace)
  // TODO: check composition file paths exist on disk (relative to brandFolderPath)
  // TODO: check print script file paths exist on disk
  // TODO: validate outputSpecs dimensions are positive integers

  return {
    valid: errors.length === 0,
    errors,
  };
}