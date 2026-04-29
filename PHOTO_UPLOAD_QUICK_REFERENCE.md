# Photo Upload - Quick Reference Guide

**Purpose**: Visual quick-start for implementing the photo upload workflow  
**Date**: April 29, 2026

---

## 🎯 The One-Page Overview

### What Gets Built

```
STEP 1: ADMIN CREATES ORDER
┌───────────────────────────────────┐
│ Select Brand (e.g., Cinematic)   │
│ Select Players (e.g., 5 players)  │
└─────────────┬─────────────────────┘
              ↓
STEP 2: UPLOAD PHOTOS (Phase 0)
┌────────────────────────────────────────────┐
│  PhotoUploadFlow Component                 │
│  ┌──────────────────────────────────────┐  │
│  │ Progress: 0/15 uploaded              │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  PLAYER 1: Jordan Smith                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Front    │ │ Left 45° │ │ Right45°│   │
│  │ ░░░      │ │ ░░░      │ │ ░░░     │   │
│  │ 🚫       │ │ ✅       │ │ ⏳      │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                            │
│  PLAYER 2: Marcus Johnson                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Front    │ │ Left 45° │ │ Right45°│   │
│  │ ░░░      │ │ ░░░      │ │ ░░░     │   │
│  │ ✅       │ │ ✅       │ │ ❌      │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                            │
│  [← Back]                [Continue →]     │
└────────────────────────────────────────────┘
              ↓
STEP 3: SUBMIT ORDER
┌─────────────────────────────────┐
│ POST /api/orders/create         │
│ - Upload photos to Appwrite     │
│ - Create order document         │
│ - Queue: process-photos job     │
└─────────────┬───────────────────┘
              ↓
STEP 4: PIPELINE PROCESSING
┌────────────────────────────────────────────┐
│ BullMQ Job: process-photos.js              │
│ - Download photos from Appwrite            │
│ - Save to ~/src/renderPhotos/{orderId}/    │
│ - Create metadata.json                     │
│ - Queue rendering jobs                     │
└─────────────┬───────────────────────────────┘
              ├─→ render-video.js
              ├─→ render-print.js
              └─→ package-order.js
              ↓
STEP 5: USE IN COMPOSITIONS
┌────────────────────────────────────────────┐
│ Hyperframes Composition                    │
│ ┌────────────────────────────────────────┐ │
│ │ Animation Timeline (10 seconds)        │ │
│ │ 0-2s:  Front pose (fade in)            │ │
│ │ 2-4s:  Left pose (slide transition)    │ │
│ │ 4-6s:  Right pose (zoom out)           │ │
│ │ 6-8s:  Left pose again (rotation)      │ │
│ │ 8-10s: Front pose (zoom in)            │ │
│ └────────────────────────────────────────┘ │
│ Result: Video with pose variety            │
└────────────────────────────────────────────┘
```

---

## 📱 UI Component Hierarchy

```
PhotoUploadFlow
├── State Management
│   ├── localStorage (auto-save)
│   ├── uploadState (photos per player/pose)
│   └── OrderContext (global order data)
│
├── ProgressBar
│   └── Shows: 12/15 uploaded
│
├── PlayerCard (× 5 players)
│   ├── Player Header (name, number)
│   └── PoseBoxRow
│       ├── PoseBox (× 3-5 poses)
│       │   ├── Silhouette (visual guide)
│       │   ├── Drag-drop zone
│       │   ├── File input (hidden)
│       │   ├── Preview thumbnail
│       │   └── Validation status (✅/❌/⏳)
│       ├── PoseBox
│       └── PoseBox
│
└── ActionBar
    ├── Back button
    └── Continue button (disabled until complete)
```

---

## 🔄 Validation Flow

```
USER DRAGS PHOTO
       ↓
Detect drop event
       ↓
Create preview (Data URL)
       ↓
Call validatePose(file, requiredPose)
       ↓
┌──────────────────────────────────┐
│ Transformers.js (Client-side)    │
│ Load PoseNet model (cached)       │
│ Detect keypoints in image         │
│ Calculate pose angle              │
│ Match to required pose type       │
│ Return: { valid, confidence }    │
└──────────────────────────────────┘
       ↓
IF valid (confidence > 0.80):
  Show ✅ green checkmark
  Mark as "ready"
  
ELSE IF invalid:
  Show ❌ red X
  Show message: "Looks like left angle"
  Offer: [Use Anyway] [Upload Different]
  
ELSE IF error (ML unavailable):
  Show ⚠️ warning
  Offer: [Use Anyway] [Skip This]
```

---

## 📁 File Organization

### Component Files to Create

```
components-1-customer-web/
├── app/
│   └── team/
│       └── orders/
│           └── new/
│               ├── page.tsx          ← Multi-step form
│               ├── step-[1-4].tsx    ← Individual steps
│               └── photos/
│                   └── page.tsx      ← Embed PhotoUploadFlow
│
└── components/
    └── team/
        ├── PhotoUploadFlow.tsx       ← Container (state + logic)
        ├── PhotoUploadInterface.tsx  ← Main UI layout
        ├── PlayerCard.tsx            ← Player section
        ├── PoseBoxRow.tsx            ← Row of poses
        ├── PoseBox.tsx               ← Single pose upload
        ├── ProgressBar.tsx           ← Progress display
        ├── ActionBar.tsx             ← Back/Continue buttons
        └── ValidationErrorModal.tsx  ← Error display
```

### Support Files

```
src/
├── lib/
│   ├── pose-validation.ts     ← Transformers.js integration
│   ├── pose-config.ts         ← Brand pose definitions
│   └── upload-handler.ts      ← File upload logic
│
├── context/
│   └── OrderContext.tsx       ← Global order state
│
└── hooks/
    ├── usePhotoUpload.ts      ← Upload state hook
    └── useOrderContext.ts     ← Order context hook

public/
└── silhouettes/
    ├── front-facing.svg       ← Pose visual guide
    ├── left-angle.svg
    └── right-angle.svg
```

### Configuration

```
components/3-asset-generation/brands/
└── cinematic-dark/
    └── brand.json (update)
        ├── requiredPoses: [...]
        └── deliverables: [...]
```

---

## 💻 Code Snippets

### Brand Configuration

```json
{
  "id": "cinematic-dark",
  "requiredPoses": [
    {
      "id": "front-facing",
      "label": "Front Facing",
      "silhouette": "front-facing.svg",
      "validationTips": "Face camera, shoulders level"
    },
    {
      "id": "left-angle",
      "label": "Left 45°",
      "silhouette": "left-angle.svg",
      "validationTips": "Turn left, show left shoulder"
    },
    {
      "id": "right-angle",
      "label": "Right 45°",
      "silhouette": "right-angle.svg",
      "validationTips": "Turn right, show right shoulder"
    }
  ]
}
```

### Pose Validation Function

```typescript
async function validatePose(imageBuffer: Buffer, requiredPose: string) {
  // Load model (cached after first call)
  const net = await posenet.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: { width: 640, height: 480 },
    multiplier: 0.75,
    quantBytes: 2,
  });
  
  // Detect poses
  const poses = await net.estimateSinglePose(image, { flipHorizontal: false });
  
  // Analyze keypoints to determine pose
  const poseType = determinePoseFromKeypoints(poses.keypoints);
  const confidence = calculateConfidence(poses.keypoints);
  
  return {
    valid: poseType === requiredPose && confidence > 0.8,
    confidence,
    poseDetected: poseType,
    feedback: poseType === requiredPose 
      ? `Perfect ${requiredPose} angle!`
      : `Looks like ${poseType}, expected ${requiredPose}`,
  };
}
```

### Upload Handler

```typescript
async function handlePhotoAdd(playerId: string, poseId: string, file: File) {
  // Validate file
  if (!isValidImage(file)) throw new Error('Invalid image');
  if (file.size > 10 * 1024 * 1024) throw new Error('File too large');
  
  // Create preview
  const preview = URL.createObjectURL(file);
  
  // Update UI with preview
  setUploadState(prev => ({
    ...prev,
    [playerId]: {
      ...prev[playerId],
      [poseId]: { file, preview, validationStatus: 'validating' }
    }
  }));
  
  // Validate
  try {
    const result = await validatePose(file, poseId);
    setUploadState(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [poseId]: {
          file,
          preview,
          validationStatus: result.valid ? 'valid' : 'invalid',
          validationError: result.feedback,
          poseConfidence: result.confidence,
        }
      }
    }));
  } catch (error) {
    // Graceful fallback
    console.error('Validation failed:', error);
    setUploadState(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [poseId]: {
          file,
          preview,
          validationStatus: 'invalid',
          validationError: 'Validation unavailable - use anyway?',
        }
      }
    }));
  }
}
```

### API Route (Upload to Appwrite)

```typescript
// app/api/orders/create/route.ts

export async function POST(req: Request) {
  const { orderId, players } = await req.json();
  
  // Upload photos to Appwrite
  for (const player of players) {
    for (const [poseId, photoData] of Object.entries(player.photos)) {
      await appwrite.storage.createFile(
        'team-photos-bucket',
        `${orderId}/raw-photos/${player.id}/${poseId}.jpg`,
        photoData.file
      );
    }
  }
  
  // Create order document
  const order = await appwrite.database.createDocument('orders', {
    id: orderId,
    team_id: req.user.team_id,
    status: 'IN_PRODUCTION',
    photos: photoUrls,
  });
  
  // Queue processing job
  await queue.add('process-photos', { orderId });
  
  return Response.json({ success: true, orderId });
}
```

### BullMQ Job (Process Photos)

```javascript
// src/queue/jobs/process-photos.js

export async function processPhotos(job) {
  const { orderId } = job.data;
  
  // Create local directory
  const outputDir = `~/src/renderPhotos/${orderId}`;
  
  // Download photos from Appwrite
  for (const player of order.players) {
    const playerDir = `${outputDir}/${player.id}`;
    mkdirSync(playerDir, { recursive: true });
    
    for (const pose of requiredPoses) {
      const photoUrl = await appwrite.storage.getFileDownload(
        'team-photos-bucket',
        `${orderId}/raw-photos/${player.id}/${pose.id}.jpg`
      );
      
      // Download file
      const response = await fetch(photoUrl);
      const buffer = await response.buffer();
      writeFileSync(`${playerDir}/${pose.id}.jpg`, buffer);
    }
  }
  
  // Queue rendering jobs
  for (const player of order.players) {
    await queue.add('render-video', {
      orderId,
      playerId: player.id,
      photosPath: `${outputDir}/${player.id}`,
    });
  }
  
  return { status: 'complete' };
}
```

---

## ✅ Implementation Checklist (Phase 0)

### UI Components (Days 1-2)
- [ ] PhotoUploadFlow.tsx with state management
- [ ] PoseBox.tsx with drag-drop
- [ ] PlayerCard.tsx grouping
- [ ] ProgressBar.tsx tracking
- [ ] ActionBar.tsx buttons
- [ ] Responsive design (mobile + desktop)
- [ ] LocalStorage auto-save
- [ ] Error state handling

### Validation (Days 2-3)
- [ ] Transformers.js PoseNet integration
- [ ] validatePose() function
- [ ] Confidence scoring
- [ ] Test with 10+ sample images
- [ ] Graceful fallback if ML unavailable
- [ ] Error messages + user guidance

### Backend (Days 3-5)
- [ ] POST /api/orders/create route
- [ ] Appwrite storage setup
- [ ] process-photos.js job
- [ ] File organization validation
- [ ] Metadata creation
- [ ] Queue next jobs
- [ ] Error handling + logging

### Testing
- [ ] Unit tests (validation, upload)
- [ ] E2E tests (full order flow)
- [ ] Mobile testing (drag-drop on tablet)
- [ ] Network disconnection recovery
- [ ] Validation edge cases (low light, etc.)

---

## 🎯 Success = 5-Minute Workflow

```
0:00  Admin clicks "Create Order"
0:10  Selects brand "Cinematic Dark"
0:20  Selects 5 players
0:30  → Photo Upload Screen
0:45  Drags 3 photos for Player 1 (with validation)
1:00  Photos for Player 2
1:15  Photos for Player 3
1:30  Photos for Player 4
1:45  Photos for Player 5
2:00  All 15 photos uploaded ✅
2:05  Clicks "Continue"
2:10  → Order Review
2:30  Confirms and submits
→ Processing starts immediately
```

**Total Time**: 2 minutes 30 seconds of actual interaction (+ validation time)

---

## 📊 Status

✅ **Design Complete**:
- [x] UX flow documented
- [x] Component structure defined
- [x] Integration points mapped
- [x] Implementation plan created

🚀 **Ready to Implement**:
- Phase 0 is highest priority
- All technical decisions made
- Code structure clear
- Timeline: 5 days

📚 **Documentation**:
- PHOTO_UPLOAD_WORKFLOW.md (detailed design)
- PHOTO_UPLOAD_COMPONENTS.md (implementation guide)
- PHOTO_UPLOAD_INTEGRATION.md (end-to-end flow)
- PHOTO_UPLOAD_SUMMARY.md (overview)

---

## 🔗 Quick Links

- **Start Building**: PHOTO_UPLOAD_COMPONENTS.md
- **Understand Flow**: PHOTO_UPLOAD_INTEGRATION.md
- **Full Design**: PHOTO_UPLOAD_WORKFLOW.md
- **Implementation Plan**: COMPONENT_1_IMPLEMENTATION_ROADMAP.md (Phase 0)

