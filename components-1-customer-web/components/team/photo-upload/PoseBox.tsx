'use client';

/**
 * components-1-customer-web/components/team/photo-upload/PoseBox.tsx
 *
 * Main drag-drop component for uploading a single pose photo.
 * Features:
 * - Drag-drop or click to upload
 * - Image preview with thumbnail
 * - Real-time validation status (empty/validating/valid/invalid)
 * - Confidence score display
 * - Remove/Replace buttons
 */

import { useState, useRef, useCallback } from 'react';
import type { Pose, PhotoUpload } from '@/lib/types/order';

interface PoseBoxProps {
  playerId: string;
  pose: Pose;
  photoData: PhotoUpload;
  onPhotoAdd: (file: File) => Promise<void>;
  onPhotoRemove: () => void;
  onOverride: () => void;
}

type ValidationStatus = 'empty' | 'validating' | 'valid' | 'invalid';

const statusConfig = {
  empty: { icon: '⭕', color: 'text-gray-400', label: 'Empty' },
  validating: { icon: '⏳', color: 'text-yellow-400', label: 'Validating...' },
  valid: { icon: '✅', color: 'text-green-400', label: 'Valid' },
  invalid: { icon: '❌', color: 'text-red-400', label: 'Invalid' },
};

export function PoseBox({
  playerId,
  pose,
  photoData,
  onPhotoAdd,
  onPhotoRemove,
  onOverride,
}: PoseBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreviewActions, setShowPreviewActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = photoData.validationStatus || 'empty';
  const statusInfo = statusConfig[status as ValidationStatus];

  // Handle file selection (either via drag-drop or click)
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (JPG, PNG)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File is too large. Max 10MB.');
        return;
      }

      setIsUploading(true);
      try {
        await onPhotoAdd(file);
      } catch (error) {
        alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
      }
    },
    [onPhotoAdd]
  );

  // Drag-drop handlers
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
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  // Show action buttons on hover (when there's a preview)
  const showActions = photoData.preview && !isUploading;

  return (
    <div className="relative">
      {/* Main Pose Box Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!showActions ? handleClickUpload : undefined}
        className={`
          aspect-square rounded-lg border-2 transition-all cursor-pointer
          flex flex-col items-center justify-center relative overflow-hidden
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-gray-900/30'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onMouseEnter={() => showActions && setShowPreviewActions(true)}
        onMouseLeave={() => setShowPreviewActions(false)}
      >
        {/* Preview Image */}
        {photoData.preview && (
          <img
            src={photoData.preview}
            alt={`${pose.label} preview`}
            className="w-full h-full object-cover"
          />
        )}

        {/* Silhouette (when empty) */}
        {!photoData.preview && (
          <>
            <div className="text-4xl mb-3">👤</div>
            <p className="text-sm font-medium text-gray-300 text-center px-2">{pose.label}</p>
            <p className="text-xs text-gray-500 text-center px-2 mt-2">{pose.description}</p>
          </>
        )}

        {/* Preview Overlay with Actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={e => {
                e.stopPropagation();
                handleClickUpload();
              }}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
            >
              Replace
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onPhotoRemove();
              }}
              className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
            >
              Remove
            </button>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs flex items-center gap-1">
          <span className={statusInfo.color}>{statusInfo.icon}</span>
          <span className="text-gray-300">{statusInfo.label}</span>
        </div>

        {/* Confidence Score */}
        {photoData.poseConfidence !== undefined && (
          <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-gray-300">
            {photoData.poseConfidence}% match
          </div>
        )}

        {/* Loading Spinner */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="animate-spin">⏳</div>
          </div>
        )}
      </div>

      {/* Validation Error Message */}
      {status === 'invalid' && photoData.validationError && (
        <div className="mt-2">
          <p className="text-xs text-red-400">{photoData.validationError}</p>
          <button
            onClick={onOverride}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Use anyway →
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}
