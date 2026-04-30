/**
 * components-1-customer-web/lib/hooks/usePhotoUpload.ts
 *
 * Custom hook for managing photo uploads and validation.
 * Provides upload state, validation, and error handling.
 */

import { useState, useCallback } from 'react';
import type { PhotoUploadState, PhotoUpload } from '../types/order';
import { validatePose } from '../pose-validation/transformers-client';

export function usePhotoUpload(brandId: string) {
  const [uploadState, setUploadState] = useState<PhotoUploadState>({});
  const [isValidating, setIsValidating] = useState(false);

  const addPhoto = useCallback(
    async (playerId: string, poseId: string, file: File) => {
      // Create preview
      const preview = URL.createObjectURL(file);

      // Update state to show preview
      setUploadState(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          [poseId]: {
            file,
            preview,
            validationStatus: 'validating',
            poseConfidence: 0,
            userOverride: false,
          },
        },
      }));

      // Run validation
      setIsValidating(true);
      try {
        const validation = await validatePose(file, { id: poseId });

        setUploadState(prev => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            [poseId]: {
              ...prev[playerId][poseId],
              validationStatus: validation.valid ? 'valid' : 'invalid',
              poseConfidence: validation.confidence,
            },
          },
        }));
      } catch (error) {
        console.error('Validation error:', error);

        // On error, mark as invalid but allow override
        setUploadState(prev => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            [poseId]: {
              ...prev[playerId][poseId],
              validationStatus: 'invalid',
            },
          },
        }));
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const removePhoto = useCallback((playerId: string, poseId: string) => {
    setUploadState(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [poseId]: {
          file: null,
          preview: null,
          validationStatus: 'empty',
          poseConfidence: 0,
          userOverride: false,
        },
      },
    }));
  }, []);

  const overrideValidation = useCallback((playerId: string, poseId: string) => {
    setUploadState(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [poseId]: {
          ...prev[playerId][poseId],
          validationStatus: 'valid',
          userOverride: true,
        },
      },
    }));
  }, []);

  return {
    uploadState,
    isValidating,
    addPhoto,
    removePhoto,
    overrideValidation,
  };
}
