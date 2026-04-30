'use client';

/**
 * components-1-customer-web/app/team/orders/new/page.tsx
 *
 * Page for creating a new order.
 * Displays OrderCreationForm with multi-step workflow.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Pose, Player, OrderData } from '@/lib/types/order';
import { OrderCreationForm } from '@/components/team/order-creation/OrderCreationForm';

// ─── Mock data (replace with API call) ────────────────────────
const MOCK_BRANDS = [
  {
    id: 'cinematic-dark',
    name: 'Cinematic Dark',
    requiredPoses: [
      { id: 'front', label: 'Front', description: 'Face camera', silhouette: '👤' },
      { id: 'left', label: 'Left Profile', description: 'Looking left', silhouette: '👤' },
      { id: 'right', label: 'Right Profile', description: 'Looking right', silhouette: '👤' },
    ] as Pose[],
  },
  {
    id: 'tech-dynamic',
    name: 'Tech Dynamic',
    requiredPoses: [
      { id: 'front', label: 'Front', description: 'Face camera', silhouette: '👤' },
      { id: 'three-quarter', label: '3/4 View', description: 'Looking 45° away', silhouette: '👤' },
    ] as Pose[],
  },
];

const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: 'John Smith', position: 'Center' },
  { id: 'p2', name: 'Mike Johnson', position: 'Guard' },
  { id: 'p3', name: 'Alex Davis', position: 'Forward' },
  { id: 'p4', name: 'Chris Wilson', position: 'Guard' },
  { id: 'p5', name: 'Pat Martinez', position: 'Center' },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (orderData: OrderData) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Call API endpoint to create order
      // const response = await fetch('/api/orders/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(orderData),
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Failed to create order');
      // }
      //
      // const { orderId } = await response.json();

      // Mock response for now
      const orderId = `order-${Date.now()}`;

      // Redirect to order detail page
      router.push(`/team/orders/${orderId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="heading-1 text-white mb-4">Create New Order</h1>
          <p className="text-lg text-gray-400">
            Upload photos for your team's graphics package
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-900/20 border border-red-600/30 text-red-300">
            {error}
          </div>
        )}

        <OrderCreationForm
          brands={MOCK_BRANDS}
          availablePlayers={MOCK_PLAYERS}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
