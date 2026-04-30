'use client';

/**
 * components-1-customer-web/components/team/order-creation/OrderCreationForm.tsx
 *
 * Multi-step form for creating a new order:
 * Step 1: Brand Selection
 * Step 2: Player Selection
 * Step 3: Photo Upload
 * Step 4: Review & Submit
 */

import { useState, useCallback } from 'react';
import type { Pose, Player, PhotoUploadState, OrderData } from '@/lib/types/order';
import { PhotoUploadFlow } from '../photo-upload';

type FormStep = 'brand' | 'players' | 'photos' | 'review';

interface Brand {
  id: string;
  name: string;
  requiredPoses: Pose[];
}

interface OrderCreationFormProps {
  brands: Brand[];
  availablePlayers: Player[];
  onSubmit: (orderData: OrderData) => Promise<void>;
  onCancel: () => void;
}

export function OrderCreationForm({
  brands,
  availablePlayers,
  onSubmit,
  onCancel,
}: OrderCreationFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('brand');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoUploadState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  // ─── Brand Selection ──────────────────────────────────────────
  const handleSelectBrand = useCallback((brandId: string) => {
    setSelectedBrandId(brandId);
  }, []);

  const handleBrandContinue = useCallback(() => {
    if (!selectedBrandId) {
      alert('Please select a brand');
      return;
    }
    setCurrentStep('players');
  }, [selectedBrandId]);

  // ─── Player Selection ─────────────────────────────────────────
  const handleTogglePlayer = useCallback((player: Player) => {
    setSelectedPlayers(prev => {
      const exists = prev.find(p => p.id === player.id);
      if (exists) {
        return prev.filter(p => p.id !== player.id);
      }
      return [...prev, player];
    });
  }, []);

  const handlePlayersContinue = useCallback(() => {
    if (selectedPlayers.length === 0) {
      alert('Please select at least one player');
      return;
    }
    setCurrentStep('photos');
  }, [selectedPlayers]);

  // ─── Photo Upload ────────────────────────────────────────────
  const handlePhotoUploadComplete = useCallback(async (photos: PhotoUploadState) => {
    setUploadedPhotos(photos);
    setCurrentStep('review');
  }, []);

  // ─── Review & Submit ─────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!selectedBrand) return;

    setIsSubmitting(true);
    try {
      const orderData: OrderData = {
        brandId: selectedBrand.id,
        brandName: selectedBrand.name,
        players: selectedPlayers,
        photos: uploadedPhotos,
        status: 'draft',
        createdAt: Date.now(),
      };

      await onSubmit(orderData);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedBrand, selectedPlayers, uploadedPhotos, onSubmit]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step Indicator */}
      <div className="flex gap-2 mb-12">
        {(['brand', 'players', 'photos', 'review'] as const).map((step, idx) => (
          <div key={step} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${
                  currentStep === step
                    ? 'bg-blue-600 text-white'
                    : currentStep > step || (currentStep === 'review' && step !== 'review')
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                }
              `}
            >
              {idx + 1}
            </div>
            {idx < 3 && <div className="w-12 h-0.5 mx-2 bg-gray-700" />}
          </div>
        ))}
      </div>

      {/* Brand Selection Step */}
      {currentStep === 'brand' && (
        <div>
          <h2 className="heading-2 text-white mb-8">Select a Brand</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {brands.map(brand => (
              <button
                key={brand.id}
                onClick={() => handleSelectBrand(brand.id)}
                className={`
                  p-6 rounded-lg border-2 text-left transition-all
                  ${
                    selectedBrandId === brand.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                  }
                `}
              >
                <h3 className="text-lg font-bold text-white mb-2">{brand.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{brand.requiredPoses.length} poses required</p>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            >
              ← Cancel
            </button>
            <button
              onClick={handleBrandContinue}
              disabled={!selectedBrandId}
              className="px-8 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Player Selection Step */}
      {currentStep === 'players' && (
        <div>
          <h2 className="heading-2 text-white mb-2">Select Players</h2>
          <p className="text-gray-400 mb-8">Choose which players to include in this order</p>

          <div className="space-y-2 mb-12 max-h-96 overflow-y-auto">
            {availablePlayers.map(player => (
              <label
                key={player.id}
                className="flex items-center gap-3 p-3 rounded hover:bg-gray-800/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPlayers.some(p => p.id === player.id)}
                  onChange={() => handleTogglePlayer(player)}
                  className="w-4 h-4"
                />
                <span className="text-white">{player.name}</span>
                {player.position && <span className="text-gray-400 ml-auto">{player.position}</span>}
              </label>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep('brand')}
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handlePlayersContinue}
              disabled={selectedPlayers.length === 0}
              className="px-8 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Photo Upload Step */}
      {currentStep === 'photos' && selectedBrand && (
        <PhotoUploadFlow
          brandId={selectedBrand.id}
          players={selectedPlayers}
          poses={selectedBrand.requiredPoses}
          onComplete={handlePhotoUploadComplete}
          onBack={() => setCurrentStep('players')}
        />
      )}

      {/* Review Step */}
      {currentStep === 'review' && selectedBrand && (
        <div>
          <h2 className="heading-2 text-white mb-8">Review Order</h2>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 mb-12 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Brand</h3>
              <p className="text-lg text-white">{selectedBrand.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Players ({selectedPlayers.length})</h3>
              <div className="flex flex-wrap gap-2">
                {selectedPlayers.map(player => (
                  <span
                    key={player.id}
                    className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-sm"
                  >
                    {player.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                Photos ({Object.values(uploadedPhotos).flat().length} uploaded)
              </h3>
              <p className="text-sm text-gray-300">
                Ready to process through the rendering pipeline
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep('photos')}
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Create Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
