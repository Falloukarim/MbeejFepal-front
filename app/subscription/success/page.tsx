'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '../../context/SubscriptionContext';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const [isActivating, setIsActivating] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { refreshStatus } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    let attemptsCount = 0;
    const maxAttempts = 30; // 30 tentatives × 2s = 60 secondes
    let cancelled = false;

    const checkStatus = async () => {
      if (cancelled) return;

      attemptsCount++;
      setAttempts(attemptsCount);

      // ✅ Appel direct au lieu du fetch fantôme
      const data = await refreshStatus();

      if (cancelled) return;

      if (data?.active) {
        setIsActivating(false);
        setTimeout(() => {
          if (!cancelled) router.push('/dashboard');
        }, 2000);
        return;
      }

      if (attemptsCount < maxAttempts) {
        setTimeout(checkStatus, 2000);
      } else {
        setIsActivating(false);
        setTimedOut(true);
      }
    };

    // Petit délai initial pour laisser le webhook arriver
    const timer = setTimeout(checkStatus, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refreshStatus, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-amber-200">
        {isActivating && (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Activation en cours...</h1>
            <p className="text-gray-600 mb-4">
              Nous confirmons votre paiement auprès de PayDunya. Cela ne prendra que quelques secondes.
            </p>
            <p className="text-sm text-gray-400">
              Tentative {attempts} / 30
            </p>
          </>
        )}

        {!isActivating && !timedOut && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Abonnement Activé !</h1>
            <p className="text-gray-600">
              Votre compte est prêt. Redirection vers votre tableau de bord...
            </p>
          </>
        )}

        {timedOut && (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Délai dépassé</h1>
            <p className="text-gray-600 mb-6">
              Votre paiement a peut-être été reçu, mais nous n'avons pas encore pu confirmer l'activation.
              Vérifiez votre tableau de bord dans un instant, ou contactez le support si l'abonnement n'apparaît pas.
            </p>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all"
              >
                Aller au dashboard
              </Link>
              <Link
                href="/subscription"
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all"
              >
                Voir les plans
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}