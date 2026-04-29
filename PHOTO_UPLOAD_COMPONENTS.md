# Photo Upload UI Components

**Location**: `components-1-customer-web/components/team/`  
**Status**: Design/Implementation Guide  
**Date**: April 29, 2026

---

## Component Tree

```
PhotoUploadFlow (container)
├── OrderContext (provides state)
├── PhotoUploadInterface (main UI)
│   ├── ProgressBar
│   ├── PlayerGrid
│   │   ├── PlayerCard (repeating per player)
│   │   │   ├── PoseBoxRow
│   │   │   │   ├── PoseBox (× 3-5 per player)
│   │   │   │   │   ├── Silhouette
│   │   │   │   │   ├── DragDropZone
│   │   │   │   │   └── ValidationStatus
│   │   │   │   └── PoseBox
│   │   │   └── PlayerName
│   │   └── PlayerCard
│   └── ActionBar
│       ├── BackButton
│       ├── SkipForNow (future: revisit flow)
│       └── ContinueButton (disabled until complete)
├── ValidationErrorModal
│   ├── ErrorMessage
│   ├── UploadDifferent
│   ├── UseAnyway (override)
│   └── RetryButton
└── FileUploadHandler (invisible, manages drop)
```

---

## Component Files to Create

### 1. `PhotoUploadFlow.tsx` (Container)

```typescript
// components/team/PhotoUploadFlow.tsx

import { useState, useEffect } from 'react';
import { PhotoUploadInterface } from './PhotoUploadInterface';
import { useOrderContext } from '@/context/OrderContext';

export function PhotoUploadFlow() {
  const { orderId, players, requiredPoses, dispatch } = useOrderContext();
  const [uploadState, setUploadState] = useState<PhotoUploadState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize upload state for each player/pose combo
  useEffect(() => {
    const initialState = players.reduce((acc, player) => {
      acc[player.id] = requiredPoses.reduce((poses, pose) => {
        poses[pose.id] = {
          file: null,
          preview: null,
          validationStatus: 'empty',
          validationError: undefined,
          poseConfidence: undefined,
          userOverride: false,
        };
        return poses;
      }, {});
      return acc;
    }, {});
    setUploadState(initialState);
    
    // Auto-load from localStorage if available
    const saved = localStorage.getItem(`order-${orderId}-photos`);
    if (saved) setUploadState(JSON.parse(saved));
  }, [orderId, players, requiredPoses]);
  
  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(`order-${orderId}-photos`, JSON.stringify(uploadState));
  }, [uploadState, orderId]);
  
  const handlePhotoAdd = async (playerId: string, poseId: string, file: File) => {
    // Update preview immediately
    const preview = URL.createObjectURL(file);
    setUploadState(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [poseId]: {
          file,
          preview,
          validationStatus: 'validating',
        }
      }
    }));
    
    // Validate asynchronously
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
      setUploadState(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          [poseId]: {
            file,
            preview,
            validationStatus: 'invalid',
            validationError: 'Validation unavailable, use anyway?',
          }
        }
      }));
    }
  };
  
  const handleRemovePhoto = (playerId: string, poseId: string) => {
    setUploadState(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [poseId]: {
          file: null,
          preview: null,
          validationStatus: 'empty',
          validationError: undefined,
          poseConfidence: undefined,
        }
      }
    }));
  };
  
  const handleOverride = (playerId: string, poseId: string) => {
    setUploadState(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [poseId]: {
          ...prev[playerId][poseId],
          validationStatus: 'valid',
          userOverride: true,
        }
      }
    }));
  };
  
  const getProgress = () => {
    let completed = 0;
    let total = 0;
    
    Object.values(uploadState).forEach((playerPhotos: any) => {
      Object.values(playerPhotos).forEach((photo: any) => {
        total++;
        if (photo.validationStatus === 'valid') completed++;
      });
    });
    
    return { completed, total };
  };
  
  const canSubmit = () => {
    const { completed, total } = getProgress();
    return completed === total && total > 0;
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Upload all photos to Appwrite storage
      const photoUrls = await uploadPhotosToStorage(orderId, uploadState);
      
      // Update order with photo references
      dispatch({
        type: 'UPDATE_ORDER',
        payload: { photos: photoUrls }
      });
      
      // Navigate to next step
      window.location.href = `/team/orders/new/review`;
    } catch (error) {
      console.error('Upload failed:', error);
      // Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const { completed, total } = getProgress();
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <PhotoUploadInterface
        players={players}
        requiredPoses={requiredPoses}
        uploadState={uploadState}
        progress={{ completed, total }}
        onPhotoAdd={handlePhotoAdd}
        onPhotoRemove={handleRemovePhoto}
        onOverride={handleOverride}
        onSubmit={handleSubmit}
        canSubmit={canSubmit()}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
```

### 2. `PhotoUploadInterface.tsx` (Main UI)

```typescript
// components/team/PhotoUploadInterface.tsx

import { ProgressBar } from './ProgressBar';
import { PlayerCard } from './PlayerCard';
import { ActionBar } from './ActionBar';

export function PhotoUploadInterface({
  players,
  requiredPoses,
  uploadState,
  progress,
  onPhotoAdd,
  onPhotoRemove,
  onOverride,
  onSubmit,
  canSubmit,
  isSubmitting,
}: PhotoUploadInterfaceProps) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-1 mb-2">Upload Player Photos</h1>
        <p className="text-gray-400">
          {players.length} players, {requiredPoses.length} poses each
        </p>
      </div>
      
      {/* Progress */}
      <ProgressBar completed={progress.completed} total={progress.total} />
      
      {/* Player Grid */}
      <div className="space-y-8 my-8">
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            poses={requiredPoses}
            photoState={uploadState[player.id] || {}}
            onPhotoAdd={(poseId, file) => onPhotoAdd(player.id, poseId, file)}
            onPhotoRemove={(poseId) => onPhotoRemove(player.id, poseId)}
            onOverride={(poseId) => onOverride(player.id, poseId)}
          />
        ))}
      </div>
      
      {/* Action Bar */}
      <ActionBar
        canContinue={canSubmit}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      />
    </div>
  );
}
```

### 3. `PlayerCard.tsx`

```typescript
// components/team/PlayerCard.tsx

import { PoseBoxRow } from './PoseBoxRow';

export function PlayerCard({
  player,
  poses,
  photoState,
  onPhotoAdd,
  onPhotoRemove,
  onOverride,
}: PlayerCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Player Header */}
      <div className="mb-6">
        <h2 className="heading-3">{player.name}</h2>
        <p className="text-sm text-gray-400">#{player.jerseyNumber}</p>
      </div>
      
      {/* Poses Grid */}
      <PoseBoxRow
        poses={poses}
        photoState={photoState}
        onPhotoAdd={onPhotoAdd}
        onPhotoRemove={onPhotoRemove}
        onOverride={onOverride}
      />
    </div>
  );
}
```

### 4. `PoseBoxRow.tsx`

```typescript
// components/team/PoseBoxRow.tsx

import { PoseBox } from './PoseBox';

export function PoseBoxRow({
  poses,
  photoState,
  onPhotoAdd,
  onPhotoRemove,
  onOverride,
}: PoseBoxRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {poses.map(pose => (
        <PoseBox
          key={pose.id}
          pose={pose}
          photo={photoState[pose.id]}
          onPhotoAdd={(file) => onPhotoAdd(pose.id, file)}
          onPhotoRemove={() => onPhotoRemove(pose.id)}
          onOverride={() => onOverride(pose.id)}
        />
      ))}
    </div>
  );
}
```

### 5. `PoseBox.tsx` (Main Upload Component)

```typescript
// components/team/PoseBox.tsx

import { useRef, useState } from 'react';

export function PoseBox({
  pose,
  photo,
  onPhotoAdd,
  onPhotoRemove,
  onOverride,
}: PoseBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onPhotoAdd(file);
      }
    }
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoAdd(file);
    }
  };
  
  // Determine box color based on status
  const getStatusColor = () => {
    switch (photo?.validationStatus) {
      case 'valid':
        return 'border-green-500 bg-green-900/20';
      case 'invalid':
        return 'border-red-500 bg-red-900/20';
      case 'validating':
        return 'border-yellow-500 bg-yellow-900/20';
      default:
        return isDragging ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 bg-gray-800/50';
    }
  };
  
  const getStatusBadge = () => {
    switch (photo?.validationStatus) {
      case 'valid':
        return <span className="text-green-400">✅ Valid</span>;
      case 'invalid':
        return <span className="text-red-400">❌ Invalid</span>;
      case 'validating':
        return <span className="text-yellow-400">⏳ Validating...</span>;
      default:
        return <span className="text-gray-400">⭕ Empty</span>;
    }
  };
  
  return (
    <div>
      {/* Main Pose Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative w-full aspect-square rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center justify-center ${getStatusColor()}`}
      >
        {/* Silhouette Background */}
        {!photo?.preview && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <img
              src={`/silhouettes/${pose.id}.svg`}
              alt={pose.label}
              className="w-16 h-16"
            />
          </div>
        )}
        
        {/* Preview Thumbnail */}
        {photo?.preview && (
          <img
            src={photo.preview}
            alt="uploaded"
            className="absolute inset-0 w-full h-full object-cover rounded-md"
          />
        )}
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
          {photo?.preview ? (
            <div className="space-y-2 text-center">
              <p className="text-sm">Change photo?</p>
              <div className="space-x-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onPhotoRemove(); }}
                  className="btn-secondary text-xs py-1 px-2"
                >
                  Remove
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleClick(); }}
                  className="btn-primary text-xs py-1 px-2"
                >
                  Replace
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-sm">Drop image here</p>
              <p className="text-xs text-gray-400">or click to browse</p>
            </div>
          )}
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      {/* Label & Status */}
      <div className="mt-3">
        <h3 className="font-semibold text-sm mb-1">{pose.label}</h3>
        <p className="text-xs text-gray-400 mb-2">{pose.description}</p>
        <div className="flex items-center justify-between">
          <div>{getStatusBadge()}</div>
          
          {/* Error with override */}
          {photo?.validationStatus === 'invalid' && (
            <button
              onClick={() => onOverride()}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Use anyway
            </button>
          )}
          
          {/* Confidence score */}
          {photo?.poseConfidence !== undefined && (
            <span className="text-xs text-gray-500">
              {(photo.poseConfidence * 100).toFixed(0)}% match
            </span>
          )}
        </div>
        
        {/* Error message */}
        {photo?.validationError && (
          <p className="text-xs text-red-400 mt-2">{photo.validationError}</p>
        )}
      </div>
    </div>
  );
}
```

### 6. `ProgressBar.tsx`

```typescript
// components/team/ProgressBar.tsx

export function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">Upload Progress</span>
        <span className="text-sm text-gray-400">
          {completed}/{total} photos
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

### 7. `ActionBar.tsx`

```typescript
// components/team/ActionBar.tsx

export function ActionBar({
  canContinue,
  isSubmitting,
  onSubmit,
}: {
  canContinue: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
      <button
        className="btn-ghost"
        disabled={isSubmitting}
      >
        ← Back
      </button>
      
      <button
        onClick={onSubmit}
        disabled={!canContinue || isSubmitting}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Uploading...' : 'Continue →'}
      </button>
    </div>
  );
}
```

---

## Integration into Order Flow

### Route: `/team/orders/new`

```
/team/orders/new/
├── page.tsx (OrderCreationFlow - main container)
├── layout.tsx (step indicator)
├── Step 1: Select Brand
│   └── route: /team/orders/new/brand
├── Step 2: Select Players
│   └── route: /team/orders/new/players
├── Step 3: Upload Photos
│   └── route: /team/orders/new/photos ← PhotoUploadFlow
├── Step 4: Review & Submit
│   └── route: /team/orders/new/review
└── Confirmation
    └── route: /team/orders/[orderId]
```

### OrderContext Setup

```typescript
// context/OrderContext.tsx

type OrderContextType = {
  orderId: string;
  brand: BrandConfig;
  players: Player[];
  photos: PhotoUploadState;
  dispatch: (action: OrderAction) => void;
};

export const OrderContext = createContext<OrderContextType>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  
  return (
    <OrderContext.Provider value={{ ...state, dispatch }}>
      {children}
    </OrderContext.Provider>
  );
}
```

---

## Type Definitions

```typescript
// types/photo-upload.ts

type PhotoUploadState = {
  [playerId: string]: {
    [poseId: string]: PhotoUpload;
  };
};

type PhotoUpload = {
  file: File | null;
  preview: string | null; // Data URL
  validationStatus: 'empty' | 'validating' | 'valid' | 'invalid';
  validationError?: string;
  poseConfidence?: number;
  userOverride?: boolean;
};

type Pose = {
  id: string;
  label: string;
  description: string;
  silhouette: string; // SVG filename
  validationTips?: string;
};

type PhotoUploadInterfaceProps = {
  players: Player[];
  requiredPoses: Pose[];
  uploadState: PhotoUploadState;
  progress: { completed: number; total: number };
  onPhotoAdd: (playerId: string, poseId: string, file: File) => Promise<void>;
  onPhotoRemove: (playerId: string, poseId: string) => void;
  onOverride: (playerId: string, poseId: string) => void;
  onSubmit: () => Promise<void>;
  canSubmit: boolean;
  isSubmitting: boolean;
};
```

---

## Styling Classes

All uses `@apply` from existing utility classes in `globals.css`:

```css
.pose-box-empty { @apply border-2 border-gray-600 bg-gray-800/50 rounded-lg; }
.pose-box-valid { @apply border-2 border-green-500 bg-green-900/20 rounded-lg; }
.pose-box-invalid { @apply border-2 border-red-500 bg-red-900/20 rounded-lg; }
.pose-box-validating { @apply border-2 border-yellow-500 bg-yellow-900/20 rounded-lg; }
.pose-box-dragging { @apply border-2 border-blue-500 bg-blue-900/20 rounded-lg; }
```

---

## Next Steps

1. ✅ Design completed (this document)
2. ⏳ Create components in `components-1-customer-web/components/team/`
3. ⏳ Integrate validation (`src/lib/pose-validation.ts`)
4. ⏳ Build brand pose configuration system
5. ⏳ Connect to order creation flow
6. ⏳ Test drag-drop and validation
7. ⏳ Add error states and recovery

