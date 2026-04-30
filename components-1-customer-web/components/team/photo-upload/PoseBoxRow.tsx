'use client';

/**
 * components-1-customer-web/components/team/photo-upload/PoseBoxRow.tsx
 *
 * Grid row of pose boxes for a single player.
 * Maps poses to PoseBox components.
 */

import type { Pose, PhotoUploadState } from '@/lib/types/order';
import { PoseBox } from './PoseBox';

interface PoseBoxRowProps {
  playerId: string;
  poses: Pose[];
  photos: PhotoUploadState[string];
  onPhotoAdd: (playerId: string, poseId: string, file: File) => Promise<void>;
  onPhotoRemove: (playerId: string, poseId: string) => void;
  onOverride: (playerId: string, poseId: string) => void;
}

export function PoseBoxRow({
  playerId,
  poses,
  photos,
  onPhotoAdd,
  onPhotoRemove,
  onOverride,
}: PoseBoxRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {poses.map(pose => (
        <PoseBox
          key={`${playerId}-${pose.id}`}
          playerId={playerId}
          pose={pose}
          photoData={photos?.[pose.id] || { file: null, preview: null, validationStatus: 'empty' }}
          onPhotoAdd={file => onPhotoAdd(playerId, pose.id, file)}
          onPhotoRemove={() => onPhotoRemove(playerId, pose.id)}
          onOverride={() => onOverride(playerId, pose.id)}
        />
      ))}
    </div>
  );
}
