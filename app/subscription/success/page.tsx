'use client';

import { useEffect, useState, useRef } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { safeLocalStorage } from '@/lib/storage';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const [phase, setPhase] = useState<'polling' | 'success' | 'timeout' | 'no-auth'>('polling');
  const [attempts, setAttempts] = useState(0);
  const { refreshStatus } = useSubscription();
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    const hasToken = !!safeLocalStorage.getItem('token');
    if (!hasToken) {
      setPhase('no-auth');
      return;
    }

    if (hasFinishedRef.current) return;

    let attemptsCount = 0;
    const maxAttempts = 30;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      if (hasFinishedRef.current) return;
      attemptsCount++;
      setAttempts(attemptsCount);

      try {
        const data = await refreshStatus();
        if (hasFinishedRef.current) return;

        if (data?.active) {
          hasFinishedRef.current = true;
          setPhase('success');
          if (intervalId) clearInterval(intervalId);
          return;
        }

        if (attemptsCount >= maxAttempts) {
          hasFinishedRef.current = true;
          setPhase('timeout');
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error('[SUCCESS] Erreur polling:', err);
      }
    };

    const initialDelay = setTimeout(() => {
      poll();
      intervalId = setInterval(poll, 2000);
    }, 1500);

    return () => {
      if (initialDelay) clearTimeout(initialDelay);
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshStatus]);

  const goToDashboard = () => { window.location.href = '/dashboard'; };
  const goToLogin = () => { window.location.href = '/login'; };

  const getPollingMessage = () => {
    if (attempts <= 1) return 'Vérification de votre paiement…';
    if (attempts < 5) return 'Confirmation en cours…';
    return 'Cela prend un peu plus de temps que prévu…';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      {/* Carte */}
      <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#111] p-8 text-center">
        {/* ---- POLLING ---- */}
        {phase === 'polling' && (
          <>
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-white mb-2">Activation en cours</h1>
            <p className="text-sm text-neutral-500 mb-4 min-h-[1.25rem]">
              {getPollingMessage()}
            </p>
            <p className="text-xs text-neutral-600 mb-4 tabular-nums">
              Tentative {attempts} / 30
            </p>
            <div className="border-t border-neutral-800 pt-4">
              <button
                onClick={goToDashboard}
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                Aller au dashboard →
              </button>
            </div>
          </>
        )}

        {/* ---- SUCCESS ---- */}
        {phase === 'success' && (
          <>
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-white mb-1">Abonnement activé</h1>
            <p className="text-sm text-neutral-500 mb-6">
              Votre paiement a bien été confirmé.
            </p>
            <button
              onClick={goToDashboard}
              className="w-full bg-[#d97706] text-white font-semibold py-3 rounded-xl hover:bg-[#b45309] transition-colors flex items-center justify-center gap-2"
            >
              Accéder au tableau de bord
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* ---- TIMEOUT ---- */}
        {phase === 'timeout' && (
          <>
            <AlertCircle className="w-8 h-8 text-orange-400 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-white mb-1">Délai dépassé</h1>
            <p className="text-sm text-neutral-500 mb-6">
              L'activation n'est pas encore confirmée.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={goToDashboard}
                className="w-full bg-[#d97706] text-white font-semibold py-3 rounded-xl hover:bg-[#b45309] transition-colors"
              >
                Aller au tableau de bord
              </button>
              <Link
                href="/subscription"
                className="w-full text-neutral-400 text-sm py-2 hover:text-white transition-colors"
              >
                Voir les plans
              </Link>
            </div>
          </>
        )}

        {/* ---- NO AUTH ---- */}
        {phase === 'no-auth' && (
          <>
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-white mb-6">Paiement reçu</h1>
            <button
              onClick={goToLogin}
              className="w-full bg-[#d97706] text-white font-semibold py-3 rounded-xl hover:bg-[#b45309] transition-colors"
            >
              Se connecter
            </button>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-neutral-600 text-center">
        Besoin d'aide ?{' '}
        <a href="mailto:support@mbeejfepal.com" className="text-orange-400 hover:underline">
          support@mbeejfepal.com
        </a>
      </p>
    </div>
  );
}