'use client';

import { useEffect, useState, useRef } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const REDIRECT_DELAY_SECONDS = 5;

export default function SubscriptionSuccessPage() {
  const [phase, setPhase] = useState<'polling' | 'success' | 'timeout'>('polling');
  const [attempts, setAttempts] = useState(0);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_SECONDS);
  const { refreshStatus } = useSubscription();

  // Toujours la dernière version de refreshStatus, sans relancer l'effet
  const refreshRef = useRef(refreshStatus);
  useEffect(() => {
    refreshRef.current = refreshStatus;
  }, [refreshStatus]);

  // 1) Polling : ne s'exécute qu'une seule fois
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attemptsCount = 0;
    const maxAttempts = 30;

    const checkStatus = async () => {
      if (cancelled) return;

      attemptsCount++;
      setAttempts(attemptsCount);

      const data = await refreshRef.current();
      if (cancelled) return;

      if (data?.active) {
        setPhase('success');
        return;
      }

      if (attemptsCount < maxAttempts) {
        timer = setTimeout(checkStatus, 2000);
      } else {
        setPhase('timeout');
      }
    };

    timer = setTimeout(checkStatus, 1500);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  // 2) Compte à rebours + redirection automatique (indépendant du polling)
  useEffect(() => {
    if (phase !== 'success') return;

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      window.location.href = '/dashboard';
    }, REDIRECT_DELAY_SECONDS * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(redirectTimer);
    };
  }, [phase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-amber-200">
        {phase === 'polling' && (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Activation en cours...</h1>
            <p className="text-gray-600 mb-4">
              Nous confirmons votre paiement auprès de PayDunya. Cela ne prendra que quelques secondes.
            </p>
            <p className="text-sm text-gray-400">Tentative {attempts} / 30</p>
          </>
        )}

        {phase === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Abonnement Activé !</h1>
            <p className="text-gray-600 mb-2">
              Votre paiement a bien été confirmé. Votre compte est prêt.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Redirection automatique dans {Math.max(countdown, 0)} s...
            </p>
            <a
              href="/dashboard"
              className="block w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              Aller vers le dashboard
            </a>
          </>
        )}

        {phase === 'timeout' && (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Délai dépassé</h1>
            <p className="text-gray-600 mb-6">
              Votre paiement a peut-être été reçu, mais nous n'avons pas encore pu confirmer l'activation.
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