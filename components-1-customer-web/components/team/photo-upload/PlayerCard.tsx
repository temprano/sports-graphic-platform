'use client';

/**
 * components-1-customer-web/components/team/photo-upload/PlayerCard.tsx
 *
 * Card for a single player showing their name and poses to upload.
 * Contains a PoseBoxRow for all poses for this player.
 */

import type { Pose, PhotoUploadState, Player } from '@/lib/types/order';
import { PoseBoxRow } from './PoseBoxRow';

interface PlayerCardProps {
  player: Player;
  poses: Pose[];
  photos: PhotoUploadState;
  onPhotoAdd: (playerId: string, poseId: string, file: File) => Promise<void>;
  onPhotoRemove: (playerId: string, poseId: string) => void;
  onOverride: (playerId: string, poseId: string) => void;
}

export function PlayerCard({
  player,
  poses,
  photos,
  onPhotoAdd,
  onPhotoRemove,
  onOverride,
}: PlayerCardProps) {
  return (
    <div className="mb-12">
      {/* Player Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{player.name}</h3>
          {player.position && (
            <p className="text-sm text-gray-400">{player.position}</p>
          )}
        </div>
        {player.number && (
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center">
            #{player.number}
          </div>
        )}
      </div>

      {/* Pose Boxes */}
      <PoseBoxRow
        playerId={player.id}
        poses={poses}
        photos={photos[player.id] || {}}
        onPhotoAdd={onPhotoAdd}
        onPhotoRemove={onPhotoRemove}
        onOverride={onOverride}
      />
    </div>
  );
}
