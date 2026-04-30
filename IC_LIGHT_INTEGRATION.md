# IC-Light Integration — Design & Implementation

**Date**: April 30, 2026  
**Status**: ✅ Integrated into photo processing pipeline  
**Component**: Pipeline (Component 2)

---

## 🎯 Overview

IC-Light is a ComfyUI node that applies realistic relighting to photos. It's been integrated into the photo processing pipeline to run **after** BiRefNet background removal, adding brand-consistent lighting to all player cutout photos before they're used in compositions.

---

## 🔄 Workflow Integration

### Photo Processing Pipeline (Updated)

```
ORIGINAL PHOTO
    ↓
[Phase 1: BiRefNet Cutout]
Remove background → PNG with transparency
    ↓
[Phase 2: IC-Light Relighting] ← NEW
Apply brand lighting → Relit PNG with transparency
    ↓
[Phase 3: Compositions]
Use relit photo in animations/prints
    ↓
FINAL DELIVERABLES
```

### Key Points

- **When**: Applied during `process-photos` BullMQ job
- **Input**: Cutout PNG with transparency (from BiRefNet)
- **Output**: Relit PNG with transparency
- **Consent**: Same consent check as background removal (`backgroundRemoval` flag)
- **Failure**: Graceful fallback to cutout if IC-Light fails

---

## 📋 Configuration

### 1. **Default Settings** (config/ic-light-defaults.json)

All brands get standard lighting unless overridden. Contains:

```json
{
  "lighting": {
    "direction": 45,        // 0-360 degrees (45 = front-left)
    "intensity": 0.8,       // 0.1-1.0 (0.8 = strong)
    "colorTemperature": 5500 // 2700-6500K (5500 = daylight)
  },
  "presets": {
    "soft_front": {...},
    "dramatic_side": {...},
    "warm_fill": {...},
    "cool_professional": {...},
    "natural_daylight": {...}
  }
}
```

### 2. **Brand-Specific Overrides** (brand.json)

Each brand can customize lighting:

```json
{
  "lighting": {
    "enabled": true,
    "direction": 45,
    "intensity": 0.8,
    "colorTemperature": 5500,
    "notes": "Optional notes about lighting rationale"
  }
}
```

If `brand.json` doesn't have lighting settings, defaults are used.

### 3. **Parameter Meanings**

| Parameter | Range | Meaning |
|-----------|-------|---------|
| `direction` | 0-360° | Light source angle: 0°=front, 90°=left, 180°=back, 270°=right |
| `intensity` | 0.1-1.0 | Light strength: 0.1=subtle, 0.8=strong, 1.0=very intense |
| `colorTemperature` | 2700-6500K | Light color: 2700K=warm/sunset, 5500K=daylight, 6500K=cool/bluish |

---

## 🛠️ Implementation Details

### File Structure

```
src/pipeline/
├── comfyui-client.js          (updated - added applyICLight function)
├── ic-light/
│   └── ic-light-config.js     (new - config management)
└── consent/
    └── check-consent.js       (unchanged - used for consent check)

src/queue/jobs/
└── process-photos.js          (updated - added IC-Light step)

config/
└── ic-light-defaults.json     (new - default settings)

components/3-asset-generation/brands/
└── cinematic-dark/
    └── brand.json             (updated - added lighting section)
```

### Key Functions

#### 1. **comfyui-client.js**

```typescript
export async function applyICLight(
  inputPath: string,      // Cutout PNG path
  outputPath: string,     // Output relit PNG path
  lightingConfig: object  // { direction, intensity, colorTemperature }
): Promise<string>        // Returns outputPath
```

- Creates IC-Light ComfyUI workflow
- Submits to ComfyUI API
- Polls for completion
- Downloads and saves output
- Returns path to relit PNG

#### 2. **ic-light-config.js**

```typescript
export function resolveConfig(brandConfig?: object): object
// Merges brand config with defaults, validates parameters

export function getDefaults(): object
// Loads ic-light-defaults.json (cached)

export function validateLighting(lighting: object): object
// Validates parameters are in valid ranges

export function getPreset(presetName: string): object
// Returns lighting config for preset (e.g., 'soft_front')

export function listPresets(): Array
// Lists all available presets
```

#### 3. **process-photos.js** (Updated)

```typescript
async function processPlayer(
  player: object,           // Player data
  orderId: string,
  assetsPath: string,
  brandData: object,        // Now includes lighting config
  comfyUiReady: boolean
): Promise<object>          // Returns { photoPath, consentApplied, lightingApplied }
```

**Process**:
1. Check consent for background removal
2. If consented and ComfyUI ready:
   - Run BiRefNet → cutout PNG
   - Get lighting config from brand.json (or defaults)
   - Run IC-Light → relit PNG
   - Return path to relit photo
3. If IC-Light fails → fall back to cutout (don't fail entire job)
4. If no consent → use original photo

---

## 📊 Data Flow

```
team.json (players, consent)
    ↓
process-photos job
    ├── Load brand.json
    │   └── Extract lighting config
    ├── Load ic-light-defaults.json
    │   └── Merge with brand config
    └── For each player:
        ├── Check consent[backgroundRemoval]
        ├── Run BiRefNet
        │   └── Input: original photo
        │   └── Output: cutout PNG
        ├── Resolve lighting config
        │   └── Brand override ← defaults
        └── Run IC-Light
            ├── Input: cutout PNG + lighting config
            ├── Output: relit PNG
            └── Store in ~/renderPhotos/{orderId}/{playerId}/
```

---

## 🎨 Example Configurations

### Cinematic Dark (Current)

```json
{
  "lighting": {
    "direction": 45,
    "intensity": 0.8,
    "colorTemperature": 5500
  }
}
```

**Effect**: Neutral daylight, front-left light, strong shadows

### Warm Portrait Brand

```json
{
  "lighting": {
    "direction": 30,
    "intensity": 0.6,
    "colorTemperature": 4000
  }
}
```

**Effect**: Warm sunlight, soft shadows, gentle look

### Cool Professional Brand

```json
{
  "lighting": {
    "direction": 90,
    "intensity": 0.75,
    "colorTemperature": 6500
  }
}
```

**Effect**: Side-lit, cool tones, dramatic shadows

### Using a Preset

Brands can reference presets instead of raw values:

```javascript
// In process-photos.js
const lightingConfig = getPreset('dramatic_side');
// { direction: 90, intensity: 0.95, colorTemperature: 5500 }
```

---

## 🔐 Consent & Privacy

- **Consent Check**: Same as background removal (`BACKGROUND_REMOVAL` flag)
- **If Not Consented**: Original photo used, no relighting applied
- **Privacy**: Lighting is metadata, stored locally only
- **Audit Trail**: Logs record which photos had lighting applied

---

## ⚠️ Fallback & Error Handling

### If IC-Light Fails

1. Log the error
2. Keep the cutout (from BiRefNet)
3. Continue processing (don't fail entire order)
4. Compositions use cutout without relighting
5. Manual adjustment possible in post-processing

**Example**:
```
BiRefNet: ✅ (cutout created)
IC-Light: ❌ (fails)
→ Use cutout, log warning
→ Order still processes, just without custom lighting
```

### If ComfyUI Unavailable

- Both BiRefNet and IC-Light skip
- Original photos used
- No error thrown
- Pipeline continues

---

## 🧪 Testing

### Unit Tests

```javascript
// ic-light-config.test.js
test('resolveConfig merges brand overrides', () => {
  const brand = { direction: 90, intensity: 0.5 };
  const config = resolveConfig(brand);
  expect(config.direction).toBe(90);
  expect(config.intensity).toBe(0.5);
  expect(config.colorTemperature).toBe(5500); // default
});

test('validateLighting rejects invalid ranges', () => {
  expect(() => validateLighting({ direction: 400 })).toThrow();
  expect(() => validateLighting({ intensity: 1.5 })).toThrow();
});

test('getPreset returns valid preset', () => {
  const preset = getPreset('soft_front');
  expect(preset.intensity).toBe(0.6);
});
```

### Integration Tests

```javascript
// process-photos.test.js
test('applies IC-Light after BiRefNet', async () => {
  const result = await processPlayer(player, orderId, assetsPath, brand, true);
  expect(result.lightingApplied).toBe(true);
  expect(result.photoPath).toContain('_relit.png');
});

test('falls back to cutout if IC-Light fails', async () => {
  // Mock IC-Light to fail
  expect(result.photoPath).toContain('_cutout.png');
});
```

---

## 📈 Future Enhancements

### Possible Additions

1. **Per-Pose Lighting**: Different lighting for front/left/right angles
2. **Team Customization**: Teams can adjust lighting in dashboard
3. **AI Lighting**: Auto-detect best lighting based on photo analysis
4. **Multi-Light Setup**: Multiple light sources (3-point lighting)
5. **Preview**: Show preview of lighting before applying
6. **Post-Processing**: Quick edits in proof review phase

### Not Planned (Out of Scope)

- ❌ Real-time lightning detection
- ❌ ML-based lighting recommendation
- ❌ Full lighting studio simulation
- ❌ Per-player customization

---

## 🔍 Monitoring & Debugging

### Logs to Check

```
INFO: Background removal applied
INFO: IC-Light relighting applied
WARN: IC-Light relighting failed, using cutout
WARN: Consent granted but ComfyUI unavailable
WARN: Failed to load brand.json, using defaults
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "IC-Light relighting failed" | ComfyUI IC-Light node not available | Install IC-Light in ComfyUI |
| Photos look wrong | Incorrect lighting direction | Adjust `direction` in brand.json |
| Lighting too intense | Intensity value too high | Lower to 0.5-0.7 |
| Lighting too subtle | Intensity value too low | Raise to 0.8+ |
| Errors in logs | Invalid parameter ranges | Check ic-light-defaults.json |

---

## 📝 Usage in Process-Photos Job

### Before (Without IC-Light)

```javascript
// Old workflow
const cutoutPath = await removeBackground(inputPath, outputPath);
return { playerId, status: 'processed', cutoutPath };
```

### After (With IC-Light)

```javascript
// New workflow
const cutoutPath = await removeBackground(inputPath, cutoutPath);
const lightingConfig = resolveICLightConfig(brandData.lighting);
const relitPath = await applyICLight(cutoutPath, relitPath, lightingConfig);
return { 
  playerId, 
  status: 'processed', 
  photoPath: relitPath,  // Use relit version
  consentApplied: true,
  lightingApplied: true
};
```

---

## 🎯 Success Criteria

✅ **Design**:
- [x] IC-Light workflow defined
- [x] Configuration schema created
- [x] Default settings established
- [x] Brand override capability implemented

✅ **Implementation**:
- [x] ComfyUI client: applyICLight() function
- [x] Config manager: ic-light-config.js
- [x] Pipeline integration: process-photos.js updated
- [x] Fallback error handling
- [x] Consent enforcement

✅ **Quality**:
- [ ] Unit tests (to be added)
- [ ] Integration tests (to be added)
- [ ] E2E tests (manual validation needed)
- [ ] Documented edge cases

---

## 🚀 Phase 0+ Implementation

IC-Light is integrated into the photo processing phase:

**Phase 0: Photo Upload** (Days 1-5)
- Photo upload UI with drag-drop
- BiRefNet background removal ✅
- **NEW**: IC-Light relighting ✅
- BullMQ job: process-photos (updated)

**Phase 1+**: Rendering and fulfillment use relit photos automatically

---

## 📚 Reference

**Files Modified**:
- `src/pipeline/comfyui-client.js` — Added `applyICLight()` function
- `src/queue/jobs/process-photos.js` — Added IC-Light step, updated workflow

**Files Created**:
- `config/ic-light-defaults.json` — Default lighting settings
- `src/pipeline/ic-light/ic-light-config.js` — Config management
- `components/3-asset-generation/brands/cinematic-dark/brand.json` — Updated with lighting

**Documentation**:
- This file (IC-Light integration guide)

---

## ✨ Summary

IC-Light adds professional relighting to all player photos after background removal. Lighting is configurable per brand but has sensible defaults, making it:

- ✅ Automatic (no manual per-photo adjustments)
- ✅ Brand-consistent (lighting matches brand aesthetic)
- ✅ Flexible (customizable per brand)
- ✅ Graceful (falls back if unavailable)
- ✅ Non-intrusive (respects consent)

Ready for Phase 0 implementation! 🚀

