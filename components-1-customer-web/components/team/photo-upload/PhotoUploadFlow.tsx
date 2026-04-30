'use client';

/**
 * components-1-customer-web/components/team/photo-upload/PhotoUploadFlow.tsx
 *
 * Main container component for photo upload workflow.
 * Manages:
 * - Photo upload state per player/pose
 * - localStorage persistence (auto-save)
 * - Pose validation coordination
 * - Progress calculation
 * - Multi-step form integration
 */

import { useEffect, useState, useCallback } from 'react';
import type { Pose, Player, PhotoUploadState, PhotoUpload } from '@/lib/types/order';
import { validatePose } from '@/lib/pose-validation/transformers-client';
import { ProgressBar } from './ProgressBar';
import { PlayerCard } from './PlayerCard';
import { ActionBar } from './ActionBar';

interface PhotoUploadFlowProps {
  brandId: string;
  players: Player[];
  poses: Pose[];
  onComplete: (uploadState: PhotoUploadState) => Promise<void>;
  onBack: () => void;
}

export function PhotoUploadFlow({
  brandId,
  players,
  poses,
  onComplete,
  onBack,
}: PhotoUploadFlowProps) {
  const [uploadState, setUploadState] = useState<PhotoUploadState>({});
  const [isLoading, setIsLoading] = useState(false);
  const storageKey = `photo-upload-${brandId}`;

  // ─── Initialize state from localStorage ────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUploadState(parsed);
      } catch (error) {
        console.error('Failed to restore upload state:', error);
      }
    } else {
      // Initialize empty state for all players/poses
      const initialState: PhotoUploadState = {};
      for (const player of players) {
        initialState[player.id] = {};
        for (const pose of poses) {
          initialState[player.id][pose.id] = {
            file: null,
            preview: null,
            validationStatus: 'empty',
          };
        }
      }
      setUploadState(initialState);
    }
  }, [brandId, players, poses]);

  // ─── Save state to localStorage ────────────────────────────────
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(uploadState));
  }, [uploadState, storageKey]);

  // ─── Calculate progress ────────────────────────────────────────
  const calculateProgress = useCallback(() => {
    let completed = 0;
    let total = 0;

    for (const player of players) {
      for (const pose of poses) {
        total++;
        if (
          uploadState[player.id]?.[pose.id]?.validationStatus === 'valid' ||
          uploadState[player.id]?.[pose.id]?.userOverride
        ) {
          completed++;
        }
      }
    }

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [players, poses, uploadState]);

  // ─── Handle photo addition ─────────────────────────────────────
  const handlePhotoAdd = useCallback(
    async (playerId: string, poseId: string, file: File) => {
      try {
        // Create preview
        const preview = URL.createObjectURL(file);

        // Update state to show preview + validating status
        setUploadState(prev => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            [poseId]: {
              file,
              preview,
              validationStatus: 'validating',
              userOverride: false,
            },
          },
        }));

        // Run validation
        const result = await validatePose(file, poseId);

        // Update state with validation result
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
              userOverride: false,
            },
          },
        }));
      } catch (error) {
        console.error('Photo upload failed:', error);
        throw error;
      }
    },
    []
  );

  // ─── Handle photo removal ──────────────────────────────────────
  const handlePhotoRemove = useCallback((playerId: string, poseId: string) => {
    setUploadState(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [poseId]: {
          file: null,
          preview: null,
          validationStatus: 'empty',
        },
      },
    }));
  }, []);

  // ─── Handle override (use photo despite invalid validation) ────
  const handleOverride = useCallback((playerId: string, poseId: string) => {
    setUploadState(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [poseId]: {
          ...prev[playerId][poseId],
          userOverride: true,
          validationStatus: 'valid', // Treat as valid for progress
        },
      },
    }));
  }, []);

  // ─── Handle continue/submit ────────────────────────────────────
  const handleContinue = useCallback(async () => {
    setIsLoading(true);
    try {
      await onComplete(uploadState);
    } finally {
      setIsLoading(false);
    }
  }, [uploadState, onComplete]);

  const progress = calculateProgress();
  const isComplete = progress.completed === progress.total && progress.total > 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <h2 className="heading-2 text-white mb-2">Upload Player Photos</h2>
      <p className="text-gray-400 mb-8">
        Drag and drop photos into each pose box, or click to browse. We'll validate the pose
        automatically.
      </p>

      {/* Progress Bar */}
      <ProgressBar progress={progress} />

      {/* Player Cards */}
      <div className="mb-12">
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            poses={poses}
            photos={uploadState}
            onPhotoAdd={handlePhotoAdd}
            onPhotoRemove={handlePhotoRemove}
            onOverride={handleOverride}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <ActionBar
        onBack={onBack}
        onContinue={handleContinue}
        isComplete={isComplete}
        isLoading={isLoading}
      />
    </div>
  );
}
