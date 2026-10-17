'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/context/SubscriptionContext';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const [isActivating, setIsActivating] = useState(true);
  const { refreshStatus, status } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 15; // 30 secondes max

    const checkStatus = async () => {
      await refreshStatus();
      
      // On attend que le webhook mette à jour la base
      const res = await fetch('/api/proxy/subscription-status'); // Ou utilisez getSubscriptionStatus() d'axios
      const data = await res.json();

      if (data.active) {
        setIsActivating(false);
        setTimeout(() => router.push('/dashboard'), 2000); // Petite pause pour lire le message
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkStatus, 2000); // Polling toutes les 2s
      } else {
        router.push('/subscription'); // Timeout
      }
    };

    checkStatus();
  }, [refreshStatus, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
        {isActivating ? (
          <>
            <Loader2 className="w-16 h-16 text-amber-500 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Activation en cours...</h1>
            <p className="text-gray-600">Nous confirmons votre paiement auprès de PayDunya. Cela ne prendra que quelques secondes.</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Abonnement Activé !</h1>
            <p className="text-gray-600">Votre compte est prêt. Redirection vers votre tableau de bord...</p>
          </>
        )}
      </div>
    </div>
  );
}