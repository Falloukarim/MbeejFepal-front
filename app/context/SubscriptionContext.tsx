'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSubscriptionStatus, SubscriptionStatus } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth'; // Assurez-vous que ce fichier existe
import { useRouter, usePathname } from 'next/navigation';

interface SubscriptionContextType {
  status: SubscriptionStatus | null;
  loading: boolean;
  refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchStatus = async () => {
    // Si pas de token, on ne fait pas d'appel API
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    
    try {
      const data = await getSubscriptionStatus();
      setStatus(data);
    } catch (error) {
      console.error('Erreur chargement abonnement', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [pathname]); // Re-vérifier à chaque changement de page

  // Gestion de la redirection
  useEffect(() => {
    // Ne rien faire si on charge, si on n'est pas connecté, ou si pas de statut
    if (loading || !isAuthenticated() || !status) return;

    const isPublicRoute = pathname === '/login' || pathname === '/register';
    const isSubscriptionRoute = pathname?.startsWith('/subscription');
    const isPaymentRoute = pathname?.startsWith('/payment');
    
    // Si l'utilisateur est sur une page publique, on ne redirige pas
    if (isPublicRoute) return;

    // Si pas actif et pas sur une route d'abonnement ou de paiement -> redirection
    if (!status.active && !isSubscriptionRoute && !isPaymentRoute) {
      router.push('/subscription');
    }
  }, [status, loading, pathname, router]);

  return (
    <SubscriptionContext.Provider value={{ status, loading, refreshStatus: fetchStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription doit être utilisé dans un SubscriptionProvider');
  return context;
};