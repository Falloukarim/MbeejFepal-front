'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans, chooseSubscription, upgradeToLevel2, SubscriptionPlan } from '@/lib/api';
import { useSubscription } from '../context/SubscriptionContext';
import {
  Check,
  Shield,
  Zap,
  AlertCircle,
  ArrowRight,
  Wallet,
  QrCode,
  RefreshCw,
  Router as RouterIcon,
  PlusCircle,
  Lock,
  Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const router = useRouter();
  const { status, refreshStatus } = useSubscription();

  useEffect(() => {
    if (status?.active && status.subscription?.plan.level === 'level2') {
      router.push('/dashboard');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getSubscriptionPlans();
        setPlans(data);
      } catch (error) {
        toast.error('Erreur lors du chargement des plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (plans.length && selectedId === null) {
      const premium = plans.find((p) => p.level === 'level1');
      setSelectedId((premium ?? plans[0]).id);
    }
  }, [plans, selectedId]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedId) ?? null,
    [plans, selectedId]
  );

  const handleChoose = async (plan: SubscriptionPlan) => {
    setProcessingId(plan.id);

    if (status?.active && status.subscription?.plan.level === 'level1' && plan.level === 'level2') {
      try {
        await upgradeToLevel2();
        toast.success('Passage au Niveau Gold effectué !');
        await refreshStatus();
        router.push('/dashboard');
      } catch (error) {
        toast.error("Erreur lors de l'upgrade");
        setProcessingId(null);
      }
      return;
    }

    try {
      const res = await chooseSubscription(plan.id);
      toast.success('Redirection vers le paiement...');
      window.location.href = res.paydunya_url;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la création de l'abonnement");
      setProcessingId(null);
    }
  };

  const calculatePrice = (plan: SubscriptionPlan) => {
    const currentRouters = status?.router_count || 0;
    if (plan.extra_router_price > 0 && currentRouters > plan.included_routers) {
      const extra = currentRouters - plan.included_routers;
      return plan.base_price + extra * plan.extra_router_price;
    }
    return plan.base_price;
  };

  if (loading) {
    return (
      <Layout>
        <div className="pointer-events-none fixed inset-0 z-0 bg-[#0a0a0a]" />
        <div className="relative z-10 max-w-md mx-auto px-4 py-6 space-y-4 animate-pulse">
          <div className="h-3 w-24 rounded bg-neutral-800" />
          <div className="h-8 w-48 rounded bg-neutral-800" />
          <div className="h-12 rounded-xl bg-neutral-800 mt-4" />
          <div className="h-44 rounded-2xl bg-neutral-800" />
          <div className="h-64 rounded-2xl bg-neutral-800" />
        </div>
      </Layout>
    );
  }

  const meta = (plan: SubscriptionPlan) => ({
    name: plan.level === 'level1' ? 'Premium' : 'Gold',
    desc: plan.level === 'level1' ? 'Idéal pour bien démarrer' : 'Pour les professionnels exigeants',
    gold: plan.level === 'level2',
  });

  const sel = selectedPlan;
  const selMeta = sel ? meta(sel) : null;
  const isCurrentPlan = !!(sel && status?.active && status.subscription?.plan.id === sel.id);
  const isLevel1User = !!(status?.active && status.subscription?.plan.level === 'level1');
  const isUpgrade = !!(sel && isLevel1User && sel.level === 'level2');
  const price = sel ? calculatePrice(sel) : 0;
  const busy = processingId !== null;

  const features = sel
    ? [
        {
          icon: RefreshCw,
          title: 'Paiement 100% automatisé',
          sub: 'Wave, Orange Money, etc.',
        },
        {
          icon: Wallet,
          title: 'Payout sécurisé',
          sub: 'Recevez vos gains directement sur votre compte Wave',
        },
        {
          icon: QrCode,
          title: 'QR Code & codes d’accès',
          sub: 'Partageables, limite d’appareils gérée par vous',
        },
        {
          icon: RouterIcon,
          title: `Jusqu’à ${sel.included_routers} routeurs inclus`,
          sub: 'Gérez tout votre réseau au même endroit',
        },
        ...(sel.extra_router_price > 0
          ? [
              {
                icon: PlusCircle,
                title: `+${sel.extra_router_price.toLocaleString()} FCFA / routeur`,
                sub: 'Pour chaque routeur supplémentaire',
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="pointer-events-none [&_[data-logout]]:pointer-events-auto [&_[data-logout]]:cursor-pointer">
      <Layout>
        {/* Fond uni noir */}
        <div className="pointer-events-none fixed inset-0 z-0 bg-[#0a0a0a]" />

        <style>{`
          @keyframes sub-slide-in {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .sub-enter { animation: sub-slide-in .3s cubic-bezier(.2,.8,.2,1) both; }
          .sub-row { animation: sub-slide-in .35s cubic-bezier(.2,.8,.2,1) both; }
        `}</style>

        <div className="pointer-events-auto relative z-10 max-w-md mx-auto px-4 pt-4 pb-28">
          {/* ===== HEADER (sobre, sans carré) ===== */}
          <header className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-orange-500">
              Abonnement
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Choisissez votre offre
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {status?.active
                ? `${status.router_count} routeur(s) configuré(s)`
                : 'Sélectionnez le plan adapté à votre réseau.'}
            </p>
          </header>

          {/* ===== SEGMENTED CONTROL ===== */}
          <div
            role="tablist"
            className="relative grid bg-[#111] border border-neutral-800 rounded-xl p-1 mb-6"
            style={{ gridTemplateColumns: `repeat(${plans.length || 1}, minmax(0, 1fr))` }}
          >
            {plans.map((plan) => {
              const m = meta(plan);
              const active = plan.id === selectedId;
              const isCurrent = status?.active && status.subscription?.plan.id === plan.id;
              return (
                <button
                  key={plan.id}
                  role="tab"
                  aria-selected={active}
                  disabled={busy}
                  onClick={() => setSelectedId(plan.id)}
                  className={`relative flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors active:scale-[0.98] ${
                    active
                      ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {m.gold ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {m.name}
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 absolute top-1.5 right-1.5" />
                  )}
                </button>
              );
            })}
          </div>

          {sel && selMeta && (
            <div key={sel.id} className="space-y-4">
              {/* ===== HERO CARD (prix) — sans carré d'icône ===== */}
              <section
                className={`sub-enter relative overflow-hidden rounded-2xl border bg-[#111] p-5 ${
                  selMeta.gold ? 'border-orange-500/25' : 'border-neutral-800/80'
                }`}
              >
                {selMeta.gold && (
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
                )}

                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {selMeta.gold ? (
                        <Zap className="w-3.5 h-3.5 text-orange-400" />
                      ) : (
                        <Shield className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                        {selMeta.name}
                      </span>
                    </div>
                    <h2 className="mt-1 text-lg font-semibold text-white">{selMeta.desc}</h2>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {selMeta.gold && (
                      <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-400 ring-1 ring-orange-500/30">
                        Recommandé
                      </span>
                    )}
                    {isCurrentPlan && (
                      <span className="rounded-md bg-green-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400 ring-1 ring-green-500/30">
                        Votre plan
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-orange-400 tabular-nums">
                    {price.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-neutral-500">FCFA / mois</span>
                </div>

                {price > sel.base_price && (
                  <p className="relative mt-1.5 text-xs text-neutral-500">
                    Dont {(price - sel.base_price).toLocaleString()} FCFA pour vos routeurs supplémentaires
                  </p>
                )}
              </section>

              {/* ===== ALERTE UPGRADE ===== */}
              {isUpgrade && (
                <div className="sub-enter flex items-start gap-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-xs text-orange-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Passez à Gold dès maintenant. La différence sera calculée au prorata et facturée le
                    mois prochain.
                  </span>
                </div>
              )}

              {/* ===== FEATURES — liste épurée, sans carré d'icône ===== */}
              <section className="rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden">
                <h3 className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                  Inclus dans l’offre
                </h3>
                <ul className="divide-y divide-neutral-800/60">
                  {features.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <li
                        key={f.title}
                        className="sub-row flex items-center gap-3 px-5 py-3"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-orange-400/70" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug text-white">{f.title}</p>
                          <p className="mt-0.5 text-xs leading-snug text-neutral-500">{f.sub}</p>
                        </div>
                        <Check className="w-4 h-4 shrink-0 text-green-400" />
                      </li>
                    );
                  })}
                </ul>
              </section>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-600">
                <Lock className="w-3 h-3" />
                Paiement sécurisé via PayDunya
              </p>
            </div>
          )}
        </div>

        {/* ===== BOTTOM BAR COLLANTE ===== */}
        {sel && selMeta && (
          <div className="pointer-events-auto sticky bottom-0 z-30 -mt-24 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent">
            <div className="max-w-md mx-auto">
              <button
                onClick={() => handleChoose(sel)}
                disabled={busy || isCurrentPlan}
                className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
                  isCurrentPlan
                    ? 'bg-neutral-900 text-neutral-500 ring-1 ring-neutral-800 cursor-not-allowed'
                    : selMeta.gold
                    ? 'bg-[#d97706] text-white shadow-lg shadow-amber-600/20 hover:bg-[#b45309]'
                    : 'bg-white text-black hover:bg-neutral-100'
                } ${busy && processingId !== sel.id ? 'opacity-50' : ''}`}
              >
                {processingId === sel.id ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Traitement...
                  </>
                ) : isCurrentPlan ? (
                  'Plan actuel'
                ) : isUpgrade ? (
                  <>
                    Mettre à niveau vers Gold <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Souscrire à {selMeta.name} · {price.toLocaleString()} FCFA <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Layout>
    </div>
  );
}