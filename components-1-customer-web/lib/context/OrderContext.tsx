'use client';

/**
 * components-1-customer-web/lib/context/OrderContext.tsx
 *
 * Global order state management.
 * Provides order data and methods to child components.
 * Integrates with localStorage for persistence.
 */

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import type { OrderData, Player, Pose, PhotoUploadState } from '../types/order';

interface OrderContextType {
  currentOrder: OrderData | null;
  setBrandId: (brandId: string) => void;
  setPlayers: (players: Player[]) => void;
  setPhotos: (photos: PhotoUploadState) => void;
  setStatus: (status: OrderData['status']) => void;
  clearOrder: () => void;
  restoreOrder: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

interface OrderProviderProps {
  children: ReactNode;
}

export function OrderProvider({ children }: OrderProviderProps) {
  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);

  // ─── Initialize from localStorage on mount ────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('current-order');
    if (saved) {
      try {
        const order = JSON.parse(saved);
        setCurrentOrder(order);
      } catch (error) {
        console.error('Failed to restore order from localStorage:', error);
      }
    }
  }, []);

  // ─── Persist order to localStorage on change ──────────────────
  const updateOrder = useCallback((updater: (prev: OrderData) => OrderData) => {
    setCurrentOrder(prev => {
      if (!prev) return prev;
      const updated = updater(prev);
      localStorage.setItem('current-order', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setBrandId = useCallback(
    (brandId: string) => {
      updateOrder(prev => ({ ...prev, brandId, brandName: '' }));
    },
    [updateOrder]
  );

  const setPlayers = useCallback(
    (players: Player[]) => {
      updateOrder(prev => ({ ...prev, players }));
    },
    [updateOrder]
  );

  const setPhotos = useCallback(
    (photos: PhotoUploadState) => {
      updateOrder(prev => ({ ...prev, photos }));
    },
    [updateOrder]
  );

  const setStatus = useCallback(
    (status: OrderData['status']) => {
      updateOrder(prev => ({ ...prev, status }));
    },
    [updateOrder]
  );

  const clearOrder = useCallback(() => {
    setCurrentOrder(null);
    localStorage.removeItem('current-order');
  }, []);

  const restoreOrder = useCallback(async (orderId: string) => {
    // TODO: Fetch order from API
    // const response = await fetch(`/api/orders/${orderId}`);
    // const order = await response.json();
    // setCurrentOrder(order);
    // localStorage.setItem('current-order', JSON.stringify(order));
  }, []);

  const value: OrderContextType = {
    currentOrder,
    setBrandId,
    setPlayers,
    setPhotos,
    setStatus,
    clearOrder,
    restoreOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
