/**
 * components-1-customer-web/lib/types/order.ts
 *
 * Type definitions for order creation workflow
 */

export interface Pose {
  id: string;
  label: string;
  description: string;
  silhouette: string;
  validationTips?: string;
}

export interface PhotoUpload {
  file: File | null;
  preview: string | null;
  validationStatus: 'empty' | 'validating' | 'valid' | 'invalid';
  validationError?: string;
  poseConfidence?: number;
  userOverride?: boolean;
}

export interface PhotoUploadState {
  [playerId: string]: {
    [poseId: string]: PhotoUpload;
  };
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position?: string;
  email?: string;
}

export interface OrderData {
  brandId: string;
  brandName?: string;
  players: Player[];
  photos: PhotoUploadState;
  status: 'draft' | 'submitted' | 'processing' | 'approved' | 'completed';
  createdAt: number;
}

export interface PoseBoxProps {
  playerId: string;
  pose: Pose;
  photoData: PhotoUpload;
  onPhotoAdd: (file: File) => Promise<void>;
  onPhotoRemove: () => void;
  onOverride: () => void;
}

export interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
}

export interface ValidationResult {
  valid: boolean;
  poseDetected: string;
  confidence: number;
  feedback: string;
}
