'use client';

import { useEffect, useState, useRef } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const [phase, setPhase] = useState<'polling' | 'success' | 'timeout'>('polling');
  const [attempts, setAttempts] = useState(0);
  const { refreshStatus } = useSubscription();
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    if (hasFinishedRef.current) return;

    let attemptsCount = 0;
    const maxAttempts = 30;
    let intervalId: ReturnType<typeof setInterval> | null = null;

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
        console.log('[SUCCESS] Active = true ! Bouton prêt.');
        if (intervalId) clearInterval(intervalId);
        return;
      }

      if (attemptsCount >= maxAttempts) {
        hasFinishedRef.current = true;
        setPhase('timeout');
        if (intervalId) clearInterval(intervalId);
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

  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  // ✅ NOUVEAU : Texte dynamique pour rassurer l'utilisateur
  const getPollingMessage = () => {
    if (attempts <= 1) return "Nous vérifions votre paiement...";
    if (attempts < 5) return "Confirmation en cours, merci de patienter...";
    return "Cela prend un peu plus de temps que prévu, mais c'est en bonne voie...";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-amber-200">

        {/* PHASE 1 : Polling en cours */}
        {phase === 'polling' && (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Activation en cours...</h1>
            
            {/* ✅ Message dynamique ici */}
            <p className="text-gray-600 mb-4 min-h-[3rem] flex items-center justify-center transition-all">
              {getPollingMessage()}
            </p>
            
            <div className="inline-block px-4 py-2 bg-amber-50 rounded-full text-sm text-amber-700 font-medium">
              Tentative {attempts} / 30
            </div>
          </>
        )}

        {/* PHASE 2 : Abonnement activé — bouton cliquable */}
        {phase === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Abonnement Activé !</h1>
            <p className="text-gray-600 mb-8">
              Votre paiement a bien été confirmé. Vous pouvez maintenant accéder à votre espace.
            </p>
            <button
              onClick={goToDashboard}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-4 px-6 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              <LayoutDashboard className="w-5 h-5" />
              Aller au tableau de bord
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* PHASE 3 : Timeout — bouton quand même dispo */}
        {phase === 'timeout' && (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Délai dépassé</h1>
            <p className="text-gray-600 mb-6">
              Votre paiement a peut-être été reçu, mais l'activation n'est pas encore confirmée.
              Vous pouvez vérifier votre tableau de bord.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={goToDashboard}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 px-6 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                Aller au tableau de bord
              </button>
              <Link
                href="/subscription"
                className="w-full border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition-all text-center"
              >
                Voir les plans
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Mention support si jamais */}
      <p className="mt-6 text-sm text-gray-500 text-center max-w-md">
        Un problème ? Contactez le support à{' '}
        <a href="mailto:support@mbeejfepal.com" className="text-amber-600 hover:underline">
          support@mbeejfepal.com
        </a>
      </p>
    </div>
  );
}