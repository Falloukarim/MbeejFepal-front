'use client';

import { useEffect, useState } from 'react';
import { getQuotaStatus, type QuotaStatus } from '@/lib/api';
import { Gauge, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export function QuotaWidget({ routerId }: { routerId: number }) {
  const [status, setStatus] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchQuota = async () => {
      try {
        const data = await getQuotaStatus(routerId);
        if (isMounted) {
          setStatus(data);
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Erreur quota:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuota();
    const interval = setInterval(fetchQuota, 30000); // 30 secondes
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [routerId]);

  if (loading) {
    return (
      <div className="p-4 bg-white/5 rounded-xl border border-white/5 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-8 bg-white/10 rounded w-2/3 mb-2" />
        <div className="h-2 bg-white/10 rounded w-full" />
      </div>
    );
  }

  if (!status || status.daily_quota_gb <= 0) {
    return (
      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-bold text-white">Quota journalier</p>
        </div>
        <p className="text-xs text-gray-500">
          Quota illimité. Définissez une limite dans le formulaire ci-contre.
        </p>
      </div>
    );
  }

  const barColor =
    status.is_blocked ? 'bg-red-500' :
    status.percent < 70 ? 'bg-emerald-500' :
    status.percent < 90 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-bold text-white">Quota journalier</p>
        </div>
        {status.is_blocked ? (
          <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-3 h-3" /> Bloqué
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
            <CheckCircle2 className="w-3 h-3" /> Actif
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-black text-white tabular-nums">
          {status.used_gb.toFixed(2)}
          <span className="text-sm text-gray-400 font-medium ml-1">Go</span>
        </span>
        <span className="text-xs text-gray-400">sur {status.daily_quota_gb} Go</span>
      </div>

      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(status.percent, 100)}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500">
        <span>{status.percent.toFixed(0)}% consommé</span>
        <span className="flex items-center gap-1">
          <RefreshCw className="w-2.5 h-2.5" />
          {lastUpdate?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <p className="text-[10px] text-gray-600 mt-2 italic">Reset automatique à minuit</p>
    </div>
  );
}