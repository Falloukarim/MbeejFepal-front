'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getSubscriptionStatus, SubscriptionStatus } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';

interface SubscriptionContextType {
  status: SubscriptionStatus | null;
  loading: boolean;
  refreshStatus: () => Promise<SubscriptionStatus | null>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // ✅ useCallback : identité stable, ne change pas entre les renders
  const refreshStatus = useCallback(async (): Promise<SubscriptionStatus | null> => {
    if (!isAuthenticated()) {
      setLoading(false);
      return null;
    }
    try {
      const data = await getSubscriptionStatus();
      setStatus(data);
      return data;
    } catch (error) {
      console.error('Erreur chargement abonnement', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [pathname, refreshStatus]);

  useEffect(() => {
    if (loading || !isAuthenticated() || !status) return;

    const isPublicRoute = pathname === '/login' || pathname === '/register';
    const isSubscriptionRoute = pathname?.startsWith('/subscription');
    const isPaymentRoute = pathname?.startsWith('/payment');

    if (isPublicRoute) return;
    if (!status.active && !isSubscriptionRoute && !isPaymentRoute) {
      router.push('/subscription');
    }
  }, [status, loading, pathname, router]);

  return (
    <SubscriptionContext.Provider value={{ status, loading, refreshStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription doit être utilisé dans un SubscriptionProvider');
  return context;
};