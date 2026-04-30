'use client';

/**
 * components-1-customer-web/components/team/photo-upload/ProgressBar.tsx
 *
 * Shows linear progress of photos uploaded.
 * Displays: "12/15 photos uploaded" + visual progress bar
 */

import type { ProgressData } from '@/lib/types/order';

interface ProgressBarProps {
  progress: ProgressData;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="mb-8">
      {/* Progress Bar Container */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-300 whitespace-nowrap">
          {progress.percentage}%
        </span>
      </div>

      {/* Photo Count */}
      <p className="text-sm text-gray-400">
        {progress.completed} of {progress.total} photos uploaded
      </p>
    </div>
  );
}
