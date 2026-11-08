'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, X, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/app/context/SubscriptionContext';

export function SubscriptionBanner() {
  const { status, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  // Ne rien afficher pendant le chargement ou si abonnement actif ET pas imminent
  if (loading || !status) return null;

  const expiresAt = status.subscription?.expires_at;
  if (!expiresAt) return null;

  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const diffMs = expiry - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // ✅ CAS 1 : Abonnement actif mais expire dans < 7 jours
  const isExpiringSoon = status.active && diffDays > 0 && diffDays <= 7;

  // ✅ CAS 2 : Abonnement expiré
  const isExpired = !status.active;

  if (!isExpiringSoon && !isExpired) return null;
  if (dismissed) return null;

  // Style selon le cas
  const variant = isExpired ? 'expired' : 'warning';
  const config = {
    expired: {
      bg: 'bg-red-500/15 border-red-500/30',
      text: 'text-red-400',
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
      title: 'Votre abonnement est expiré',
      subtitle: "Certaines fonctionnalités sont bloquées jusqu'au renouvellement.",
      btnBg: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      bg: 'bg-amber-500/15 border-amber-500/30',
      text: 'text-amber-400',
      icon: <Clock className="w-4 h-4 shrink-0" />,
      title: diffDays === 1
        ? 'Votre abonnement expire demain'
        : `Votre abonnement expire dans ${diffDays} jours`,
      subtitle: `Le ${new Date(expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
      btnBg: 'bg-amber-500 hover:bg-amber-600',
    },
  }[variant];

  return (
    <div className={`sticky top-0 z-50 border-b ${config.bg} backdrop-blur-md px-4 py-3`}>
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <span className={config.text}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${config.text} truncate`}>
            {config.title}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {config.subtitle}
          </p>
        </div>
        <Link
          href="/subscription"
          className={`shrink-0 inline-flex items-center gap-1.5 ${config.btnBg} text-white text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95`}
        >
          Renouveler
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}