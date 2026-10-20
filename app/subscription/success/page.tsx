'use client';

import { useEffect, useState, useRef } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { safeLocalStorage } from '@/lib/storage';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, LayoutDashboard, Smartphone } from 'lucide-react';
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
    if (attempts <= 1) return "Nous vérifions votre paiement...";
    if (attempts < 5) return "Confirmation en cours, merci de patienter...";
    return "Cela prend un peu plus de temps que prévu, mais c'est en bonne voie...";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      {/* Carte Sombre */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl p-8 max-w-md w-full text-center border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10">
          {phase === 'polling' && (
            <>
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Activation en cours...</h1>
              <p className="text-gray-400 mb-4 min-h-[3rem] flex items-center justify-center transition-all">
                {getPollingMessage()}
              </p>
              <div className="inline-block px-4 py-2 bg-amber-500/10 rounded-full text-sm text-amber-500 font-medium mb-6 border border-amber-500/20">
                Tentative {attempts} / 30
              </div>
              <div className="pt-4 border-t border-white/10">
                <button onClick={goToDashboard} className="w-full text-amber-500 hover:text-amber-400 text-sm font-medium hover:underline">
                  Aller au dashboard manuellement →
                </button>
              </div>
            </>
          )}

          {phase === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Abonnement Activé !</h1>
              <p className="text-gray-400 mb-8">
                Votre paiement a bien été confirmé. Vous pouvez maintenant accéder à votre espace.
              </p>
              <button onClick={goToDashboard} className="w-full bg-[#d97706] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#b45309] transition-all shadow-lg flex items-center justify-center gap-3">
                <LayoutDashboard className="w-5 h-5" />
                Aller au tableau de bord
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {phase === 'timeout' && (
            <>
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                <AlertCircle className="w-12 h-12 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Délai dépassé</h1>
              <p className="text-gray-400 mb-6">
                Votre paiement a peut-être été reçu, mais l'activation n'est pas encore confirmée.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={goToDashboard} className="w-full bg-[#d97706] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#b45309] transition-all flex items-center justify-center gap-2">
                  <LayoutDashboard className="w-5 h-5" />
                  Aller au tableau de bord
                </button>
                <Link href="/subscription" className="w-full border border-white/10 text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-white/5 transition-all text-center">
                  Voir les plans
                </Link>
              </div>
            </>
          )}

          {phase === 'no-auth' && (
            <>
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                <Smartphone className="w-12 h-12 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Paiement reçu !</h1>
              <p className="text-gray-400 mb-6">
                Votre paiement a bien été enregistré. Pour accéder à votre espace, rouvrez ce site dans votre navigateur habituel.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-blue-200 font-medium mb-2">💡 Que faire ?</p>
                <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
                  <li>Fermez cet onglet</li>
                  <li>Ouvrez Chrome ou Safari</li>
                  <li>Connectez-vous : votre abonnement est actif !</li>
                </ul>
              </div>
              <button onClick={goToLogin} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all">
                Se connecter
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-500 text-center max-w-md">
        Un problème ? Contactez le support à{' '}
        <a href="mailto:support@mbeejfepal.com" className="text-amber-600 hover:underline">
          support@mbeejfepal.com
        </a>
      </p>
    </div>
  );
}