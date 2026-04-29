# Photo Upload Workflow Design

**Status**: Design Phase  
**Date**: April 29, 2026  
**Component**: Order Creation → Photo Ingestion  
**Actor**: Team Admin/Coach

---

## 🎯 Design Principles

1. **Simple drag-and-drop** — No complex wizards
2. **Visual matching** — Black silhouettes show exactly what's needed
3. **Batch processing** — Admin uploads all players at once
4. **AI-assisted validation** — Transformers.js auto-checks poses
5. **Forgiving errors** — Easy retry without losing work

---

## 📋 Requirements Gathered

| Aspect | Decision |
|--------|----------|
| **Poses per brand** | 3-5+ required; varies by brand and deliverables |
| **Team banner** | Requires 3+ different poses |
| **Individual banners/posters** | Reuse same poses, 2-3+ per player |
| **Variety** | More poses = better variety in designs |
| **Who uploads** | Team admin/coach (batch) — NOT individual players |
| **Source of truth** | Admin is single source; players don't self-upload |
| **Validation** | Auto-validate with Transformers.js (pose detection ML) |
| **Examples** | Black silhouettes (not reference photos) |
| **Across deliverables** | Same pose types work for all (banner, poster, graphic) |
| **Timeline** | Batch: Coach uploads all at order creation time |

---

## 🏗️ Workflow Architecture

### High-Level Order Flow

```
1. Admin creates order (team selected)
    ↓
2. System fetches required poses from brand config
    ↓
3. Admin uploads photos (drag & drop by pose)
    ↓
4. Transformers.js validates each photo
    ↓
5a. IF valid → Photo marked ✅
5b. IF invalid → Show error, retry allowed
    ↓
6. All required poses complete? YES → Ready to process
                            NO → Show missing
    ↓
7. Admin clicks "Submit Order"
    ↓
8. Order moves to rendering pipeline
```

---

## 🎨 UI Flow: Photo Upload Interface

### Screen: "Upload Player Photos"

**Context**: 
- Order created with 5 players
- Brand = "Cinematic Dark" (requires 3 poses)
- Each player needs: Front Facing, Left Angle, Right Angle

**Layout** (Desktop):

```
┌─────────────────────────────────────────────────────────────┐
│                    Order #12345                             │
│         Upload Photos for 5 Players (Cinematic Dark)        │
│                                                             │
│  ⚠️  Status: 0/15 photos uploaded (need 3 per player)      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ PLAYER 1: Jordan Smith (#42)                               │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│ │ Front Facing    │  │ Left Angle      │  │ Right Angle │ │
│ │ ░░░             │  │ ░░░             │  │   ░░░       │ │
│ │ ░ ↓ ░           │  │ ░   ↓           │  │     ↓   ░   │ │
│ │ ░   ░ ░         │  │ ░     ░ ░       │  │   ░ ░       │ │
│ │ Drag photo here │  │ Drag photo here │  │ Drag here   │ │
│ │ or click        │  │ or click        │  │ or click    │ │
│ └─────────────────┘  └─────────────────┘  └─────────────┘ │
│      ⭕ Hover       ❌ Invalid            ✅ Valid       │
│                                                             │
│ PLAYER 2: Marcus Johnson (#23)                             │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│ │ Front Facing    │  │ Left Angle      │  │ Right Angle │ │
│ │ ░░░             │  │ ░░░             │  │   ░░░       │ │
│ └─────────────────┘  └─────────────────┘  └─────────────┘ │
│      ✅ Valid           ⭕ Hover             ❌ Invalid    │
│                                                             │
│  [← Back]                             [Continue →] (dim)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements**:

1. **Status Bar** — Shows "0/15 uploaded" with progress
2. **Player Sections** — One per player, each showing required poses
3. **Pose Boxes** — Black silhouette + label + drag target
4. **Status Badges**:
   - ⭕ Empty (gray)
   - ⏳ Validating (spinner)
   - ✅ Valid (green checkmark)
   - ❌ Invalid (red X) + retry option
5. **Actions**:
   - Drag image into box
   - Click to open file picker
   - Hover to see full silhouette
6. **Continue Button** — Disabled until all required photos uploaded

---

## 🔄 Detailed Upload Sequence

### Step 1: Drag & Drop Image

**User Action**: Admin drags JPG/PNG file onto "Front Facing" box

**System**:
1. Detect file drop
2. Show preview thumbnail (small, 100px)
3. Start validation immediately (don't wait for user to finish)

**UI State**: 
```
┌─────────────────┐
│ Front Facing    │
│  [Image Thumb]  │ ← File previewed
│ Validating... ⏳ │
└─────────────────┘
```

### Step 2: Pose Detection (Transformers.js)

**On Backend** (`src/lib/pose-validation.ts`):

```javascript
// Pseudo-code
async function validatePose(imageBuffer, requiredPose) {
  // requiredPose = 'front-facing' | 'left-angle' | 'right-angle'
  
  // Load model (cached after first call)
  const detector = await posenet.load();
  
  // Detect keypoints in image
  const poses = await detector.estimateSinglePose(image);
  const keypoints = poses.keypoints;
  
  // Analyze keypoints to match required pose
  const poseType = analyzePose(keypoints);
  
  // Return result
  return {
    valid: poseType === requiredPose,
    confidence: 0.85,
    feedback: "Perfect angle for front-facing shot",
    keypoints: keypoints // For visualization
  };
}
```

**Why This Works**:
- Transformers.js runs on client OR lightweight server endpoint
- Fast response (< 2 seconds)
- Detects body keypoints → angles → pose type
- Provides confidence score for soft validation

### Step 3: Validation Result

**IF Valid** ✅:
```
┌─────────────────────┐
│ Front Facing        │
│  [Image Thumb] ✅   │
│ Perfect angle!      │
│ [Clear] [Retry]     │
└─────────────────────┘
```

**IF Invalid** ❌:
```
┌─────────────────────────────┐
│ Front Facing                │
│  [Image Thumb] ❌           │
│ ⚠️  Looks like left angle   │
│ Expected: front-facing      │
│ [Upload Different] [Retry]  │
└─────────────────────────────┘
```

**Note**: Validation is **not strict** — admin can override
- Option 1: Upload different photo
- Option 2: "Use anyway" button (override validation)

### Step 4: Repeat for All Players & Poses

Admin repeats for all 5 players × 3 poses = 15 total

**Smart UI**:
- Show progress: "12/15 uploaded"
- Highlight next empty slot (auto-scroll)
- Enable "Continue" only when all required photos present

---

## 📱 Responsive Design

### Mobile (Tablet/iPad):

```
PLAYER 1: Jordan Smith
┌──────────────────────┐
│   Front Facing       │
│   [Silhouette]       │
│   Tap to upload      │
└──────────────────────┘
┌──────────────────────┐
│   Left Angle         │
│   [Silhouette]       │
└──────────────────────┘
┌──────────────────────┐
│   Right Angle        │
│   [Silhouette]       │
└──────────────────────┘

[Scroll down for next player]
```

**Touch-Friendly**:
- Larger tap targets (60px minimum)
- Single column layout
- Scroll-based progress
- Full-screen preview on tap

---

## 🔄 State Management

### Data Structure (Component State)

```typescript
type PhotoUploadState = {
  playerId: string;
  poses: {
    [poseName: string]: {
      file: File | null;
      preview: string | null; // Data URL
      validationStatus: 'empty' | 'validating' | 'valid' | 'invalid';
      validationError?: string;
      poseConfidence?: number;
      userOverride?: boolean;
    };
  };
  allComplete: boolean;
};

type UploadContextType = {
  players: PhotoUploadState[];
  orderId: string;
  requiredPosesPerPlayer: string[]; // ['front-facing', 'left-angle', 'right-angle']
  addPhoto: (playerId: string, poseName: string, file: File) => Promise<void>;
  removePhoto: (playerId: string, poseName: string) => void;
  overrideValidation: (playerId: string, poseName: string) => void;
  getProgress: () => { uploaded: number; total: number };
  canSubmit: () => boolean;
};
```

**Storage**: 
- React Context for upload state
- LocalStorage for auto-save (in case of network issue)
- Appwrite storage for persisted photos (after submit)

---

## 🎯 Brand Configuration Schema

### In brand.json

```json
{
  "id": "cinematic-dark",
  "name": "Cinematic Dark",
  "requiredPoses": [
    {
      "id": "front-facing",
      "label": "Front Facing",
      "description": "Face the camera, chest out",
      "silhouette": "front-facing.svg",
      "examples": ["example-1.jpg", "example-2.jpg"],
      "validationTips": "Ensure shoulders are level and camera at eye height"
    },
    {
      "id": "left-angle",
      "label": "Left Angle (45°)",
      "description": "Turn 45° to the left",
      "silhouette": "left-angle.svg",
      "examples": ["example-3.jpg"],
      "validationTips": "Show left shoulder toward camera"
    },
    {
      "id": "right-angle",
      "label": "Right Angle (45°)",
      "description": "Turn 45° to the right",
      "silhouette": "right-angle.svg",
      "examples": ["example-4.jpg"],
      "validationTips": "Show right shoulder toward camera"
    }
  ],
  "deliverables": [
    {
      "name": "Team Banner",
      "format": "1920x1080",
      "poses": ["front-facing", "left-angle", "right-angle"], // uses all 3
      "description": "Group photo with all players"
    },
    {
      "name": "Individual Banner",
      "format": "1920x1080",
      "poses": ["front-facing", "left-angle", "right-angle"], // uses all 3
      "description": "Single player with background"
    },
    {
      "name": "Player Poster",
      "format": "16x20",
      "poses": ["front-facing"], // can use any one pose
      "description": "Portrait print"
    }
  ]
}
```

**Note**: Even though deliverables can use subsets, the admin uploads all poses for maximum variety.

---

## 🚨 Error Handling

### Network Errors

```
┌─────────────────────────────────────────┐
│ ❌ Connection lost                      │
│ Failed to validate image               │
│ [Retry] [Skip Validation] [Go Offline] │
└─────────────────────────────────────────┘
```

**Options**:
- **Retry** — Re-upload and validate
- **Skip Validation** — Use anyway (low connectivity areas)
- **Go Offline** — Use localStorage, submit when online

### File Errors

```
❌ File too large (>10MB)
❌ Wrong file type (only JPG/PNG allowed)
❌ Image too small (minimum 1024x768)
```

**Auto-Fix Suggestions**:
- Compress image before upload
- Show accepted formats
- Suggest minimum resolution

### Validation Mismatch

```
⚠️ This looks like a LEFT ANGLE
   but you're uploading to FRONT FACING
   
[Use Anyway] [Upload to Left Angle Instead] [Choose Different Photo]
```

**Smart Suggestion**: If ML detects a different pose, offer to move it.

---

## 💾 Persistence & Recovery

### Auto-Save Strategy

1. **Upload Queue** — Files staged locally (IndexedDB)
2. **Validation Cache** — Results cached during session
3. **Recovery** — If user closes tab mid-upload:
   - Show "Resume upload?" on return
   - Restore state from localStorage
   - Continue from where they left off

### Example: LocalStorage Structure

```javascript
localStorage['order-12345-photos'] = {
  playerId: {
    'front-facing': {
      file: Blob,
      preview: 'data:image/jpeg;...',
      validationResult: { valid: true, confidence: 0.92 }
    }
  }
};
```

---

## 📊 Integration Points

### 1. Order Creation Flow

```
Admin clicks "Create Order"
  ↓
Select brand (triggers pose requirements)
  ↓
Select players
  ↓
→ Photo upload interface (THIS DESIGN)
  ↓
Submit order
  ↓
BullMQ job: process-photos.js
```

### 2. Process Photos Job

**File**: `src/queue/jobs/process-photos.js`

```javascript
async function processPhotos(orderId) {
  const order = await appwrite.database.getDocument('orders', orderId);
  const photoLinks = order.photos; // URLs to uploaded photos
  
  // For each player in order:
  //   1. Fetch photos from Appwrite storage
  //   2. Store to shared folder for rendering pipeline
  //   3. Create entries in team's data folder
  
  // Trigger render-video.js for each player
  // Trigger render-print.js for each format
}
```

### 3. Rendering Pipeline

**Uses these photos**:
- `src/renderPhotos/[playerId]/front-facing.jpg`
- `src/renderPhotos/[playerId]/left-angle.jpg`
- `src/renderPhotos/[playerId]/right-angle.jpg`

**GSAP compositions rotate through poses** for visual variety.

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// src/lib/__tests__/pose-validation.test.ts

describe('Pose Validation', () => {
  test('detects front-facing pose correctly', async () => {
    const imageBuffer = fs.readFileSync('fixtures/front-facing.jpg');
    const result = await validatePose(imageBuffer, 'front-facing');
    expect(result.valid).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  test('rejects wrong angle', async () => {
    const imageBuffer = fs.readFileSync('fixtures/left-angle.jpg');
    const result = await validatePose(imageBuffer, 'front-facing');
    expect(result.valid).toBe(false);
  });

  test('handles low-light images gracefully', async () => {
    const imageBuffer = fs.readFileSync('fixtures/dark-room.jpg');
    const result = await validatePose(imageBuffer, 'front-facing');
    expect(result.confidence).toBeLessThan(0.7);
    // Still allows user override
  });
});
```

### E2E Tests (Playwright)

```typescript
test('admin can upload photos and submit order', async ({ page }) => {
  await page.goto('/team/orders/new');
  
  // Select brand
  await page.click('text=Cinematic Dark');
  
  // Add players
  await page.click('text=Add Player');
  
  // Upload photos
  const poses = ['front-facing', 'left-angle', 'right-angle'];
  for (const pose of poses) {
    const uploadButton = page.locator(`[data-pose="${pose}"]`);
    await uploadButton.setInputFiles('fixtures/sample-photo.jpg');
    await page.waitForSelector(`[data-pose="${pose}"][data-valid="true"]`);
  }
  
  // Submit
  await page.click('text=Submit Order');
  await page.waitForURL('/team/orders/12345');
});
```

---

## 🔐 Security Considerations

### File Validation

- Max size: 10 MB (enforced client + server)
- Allowed types: `image/jpeg`, `image/png` only
- Scan for malware (ClamAV or similar on server)

### Storage

- Photos stored in **private Appwrite bucket**
- Bucket rules: Only team members + pipeline can read
- Encryption at rest (if VPS hosted)
- Signed URLs (24-hour expiry) for rendering pipeline

### Privacy

- No public URLs for team photos
- Coach/admin never sees other teams' photos
- Photos deleted after 90 days (or per GDPR request)

---

## 📱 Mobile-First Checklist

- [x] Touch-friendly drag targets (60px min)
- [x] File picker on click (fallback for drag)
- [x] Responsive grid (1-2 columns)
- [x] Landscape + portrait support
- [x] Auto-retry on connection loss
- [x] Preview on tap (full-screen modal)
- [x] Progress bar visible at all times

---

## 🎬 Next Steps

1. **Build UI Components**:
   - `components/PhotoUploadGrid.tsx` — Main interface
   - `components/PoseBox.tsx` — Single pose upload target
   - `components/ValidationStatus.tsx` — Status display

2. **Implement Validation**:
   - `src/lib/pose-validation.ts` — Transformers.js integration
   - `src/lib/pose-config.ts` — Brand pose requirements
   - Handle graceful fallback if ML unavailable

3. **Connect to Order Flow**:
   - `app/team/orders/new/page.tsx` — Embed photo uploader
   - `app/api/orders/upload/route.ts` — Handle file uploads
   - `src/queue/jobs/process-photos.js` — Store for rendering

4. **Add Error Handling**:
   - Network errors with retry
   - File type/size validation
   - Graceful ML model loading

5. **Test**:
   - Unit tests for validation
   - E2E tests for full flow
   - Manual testing on tablet/mobile

---

## 🎯 Success Metrics

- ✅ Upload 15 photos in <5 minutes (simple drag-drop)
- ✅ 90%+ first-time validation success rate
- ✅ <2 second validation response time
- ✅ Mobile experience as smooth as desktop
- ✅ Clear feedback for invalid poses
- ✅ Admin can override validation if needed
- ✅ Photos persist if connection drops
- ✅ No manual retouching needed in rendering (poses are clear)

