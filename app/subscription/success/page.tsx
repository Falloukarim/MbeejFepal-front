'use client';

import { useEffect, useState, useRef } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const [phase, setPhase] = useState<'polling' | 'success' | 'timeout'>('polling');
  const [attempts, setAttempts] = useState(0);
  const { refreshStatus } = useSubscription();
  const hasFinishedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (hasFinishedRef.current) return;

    let attemptsCount = 0;
    const maxAttempts = 30;

    const poll = async () => {
      if (hasFinishedRef.current) return;

      attemptsCount++;
      setAttempts(attemptsCount);
      console.log(`[SUCCESS] Tentative ${attemptsCount}/30`);

      const data = await refreshStatus();
      console.log('[SUCCESS] Statut:', data);

      if (hasFinishedRef.current) return;

      if (data?.active) {
        hasFinishedRef.current = true;
        setPhase('success');
        console.log('[SUCCESS] Active = true → redirection immédiate');

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // ✅ REDIRECTION SYNCHRONE — pas de setTimeout
        // Petite pause de 50ms pour laisser le setPhase peindre
        // puis navigation hard replace
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.location.replace('/dashboard');
          });
        });
        return;
      }

      if (attemptsCount >= maxAttempts) {
        hasFinishedRef.current = true;
        setPhase('timeout');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Premier check après 1.5s pour laisser le webhook arriver
    const initialTimer = setTimeout(() => {
      poll();
      intervalRef.current = setInterval(poll, 2000);
    }, 1500);

    return () => {
      // ⚠️ On ne fait RIEN ici : on laisse les timers courir
      // (c'est le sens même du fix — le cleanup annulait la redirection)
    };
  }, [refreshStatus]);

  const goToDashboard = () => {
    window.location.replace('/dashboard');
  };

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
              Nous confirmons votre paiement auprès de PayDunya.
            </p>
            <p className="text-sm text-gray-400">Tentative {attempts} / 30</p>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={goToDashboard}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-all"
              >
                Ignorer et aller au dashboard
              </button>
            </div>
          </>
        )}

        {phase === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Abonnement Activé !</h1>
            <p className="text-gray-600 mb-6">
              Redirection vers votre tableau de bord...
            </p>
            {/* ✅ Bouton de secours : si la redirection auto échoue, un clic suffit */}
            <button
              onClick={goToDashboard}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
            >
              Aller au dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {phase === 'timeout' && (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Délai dépassé</h1>
            <p className="text-gray-600 mb-6">
              Le paiement a peut-être été reçu mais l'activation traîne.
            </p>
            <div className="flex gap-3">
              <button
                onClick={goToDashboard}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all"
              >
                Dashboard
              </button>
              <Link
                href="/subscription"
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all text-center"
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