'use client';

/**
 * components-1-customer-web/components/team/photo-upload/ActionBar.tsx
 *
 * Bottom action buttons for photo upload flow.
 * - Back button: return to previous step
 * - Continue button: proceed to next step (disabled until all photos uploaded)
 */

interface ActionBarProps {
  onBack: () => void;
  onContinue: () => void;
  isComplete: boolean;
  isLoading?: boolean;
}

export function ActionBar({
  onBack,
  onContinue,
  isComplete,
  isLoading = false,
}: ActionBarProps) {
  return (
    <div className="flex items-center justify-between pt-8 border-t border-gray-700">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
        disabled={isLoading}
      >
        ← Back
      </button>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        disabled={!isComplete || isLoading}
        className={`px-8 py-2 rounded-lg font-medium transition-all ${
          isComplete && !isLoading
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white cursor-pointer'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
        }`}
      >
        {isLoading ? 'Uploading...' : 'Continue →'}
      </button>
    </div>
  );
}
