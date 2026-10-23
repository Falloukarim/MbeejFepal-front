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
  Router,
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

  // Sélection par défaut : plan Premium, sinon le premier
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
        <div className="max-w-md mx-auto px-4 py-6 space-y-4 animate-pulse">
          <div className="h-8 w-48 rounded-xl bg-white/10" />
          <div className="h-12 rounded-2xl bg-white/10" />
          <div className="h-44 rounded-[28px] bg-white/10" />
          <div className="h-64 rounded-[28px] bg-white/10" />
        </div>
      </Layout>
    );
  }

  const meta = (plan: SubscriptionPlan) => ({
    name: plan.level === 'level1' ? 'Premium' : 'Gold',
    desc: plan.level === 'level1' ? 'Idéal pour bien démarrer' : 'Pour les professionnels exigeants',
    gold: plan.level === 'level2',
  });

  // Données dérivées du plan sélectionné
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
          icon: Router,
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
        <style>{`
          @keyframes sub-slide-in {
            from { opacity: 0; transform: translateY(14px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          .sub-enter { animation: sub-slide-in .35s cubic-bezier(.2,.8,.2,1) both; }
          .sub-row { animation: sub-slide-in .4s cubic-bezier(.2,.8,.2,1) both; }
        `}</style>

        <div className="pointer-events-auto max-w-md mx-auto px-4 pt-4 pb-28">
          {/* Titre façon "large title" iOS */}
          <header className="mb-5">
            <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-white">
              Abonnement
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {status?.active
                ? `${status.router_count} routeur(s) configuré(s)`
                : 'Choisissez l’offre adaptée à votre réseau'}
            </p>
          </header>

          {/* Segmented control */}
          <div
            role="tablist"
            className="relative grid bg-white/5 border border-white/10 rounded-2xl p-1 mb-5"
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
                  className={`relative flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                    active
                      ? m.gold
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                        : 'bg-white text-black shadow-lg'
                      : 'text-gray-400'
                  }`}
                >
                  {m.gold ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  {m.name}
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 absolute top-2 right-2" />
                  )}
                </button>
              );
            })}
          </div>

          {sel && selMeta && (
            <div key={sel.id} className="space-y-4">
              {/* Carte héro : prix */}
              <section
                className={`sub-enter relative overflow-hidden rounded-[28px] p-6 border bg-gradient-to-br ${
                  selMeta.gold
                    ? 'from-amber-500/25 via-gray-900 to-black border-amber-500/40'
                    : 'from-white/10 via-gray-900 to-black border-white/10'
                }`}
              >
                <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

                <div className="relative flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                      selMeta.gold
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-white/5 border-white/10 text-gray-300'
                    }`}
                  >
                    {selMeta.gold ? <Zap className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {selMeta.gold && (
                      <span className="bg-amber-500 text-black text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full">
                        RECOMMANDÉ
                      </span>
                    )}
                    {isCurrentPlan && (
                      <span className="bg-green-500/15 text-green-400 border border-green-500/30 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full">
                        VOTRE PLAN
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="relative mt-5 text-2xl font-extrabold text-white">{selMeta.name}</h2>
                <p className="relative text-sm text-gray-400">{selMeta.desc}</p>

                <div className="relative mt-5 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight text-amber-400 tabular-nums">
                    {price.toLocaleString()}
                  </span>
                  <span className="pb-1.5 text-sm font-medium text-gray-400">FCFA / mois</span>
                </div>

                {price > sel.base_price && (
                  <p className="relative mt-2 text-xs text-gray-400">
                    Dont {(price - sel.base_price).toLocaleString()} FCFA pour vos routeurs supplémentaires
                  </p>
                )}
              </section>

              {/* Alerte upgrade */}
              {isUpgrade && (
                <div className="sub-enter flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-200">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>
                    Passez à Gold dès maintenant. La différence sera calculée au prorata et facturée le mois
                    prochain.
                  </span>
                </div>
              )}

              {/* Liste groupée façon réglages iOS */}
              <section className="rounded-[28px] bg-white/5 border border-white/10 overflow-hidden">
                <h3 className="px-5 pt-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  Inclus dans l’offre
                </h3>
                <ul className="divide-y divide-white/5">
                  {features.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <li
                        key={f.title}
                        className="sub-row flex items-center gap-3.5 px-5 py-3.5"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white leading-snug">{f.title}</p>
                          <p className="text-xs text-gray-400 leading-snug mt-0.5">{f.sub}</p>
                        </div>
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                      </li>
                    );
                  })}
                </ul>
              </section>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <Lock className="w-3 h-3" />
                Paiement sécurisé via PayDunya
              </p>
            </div>
          )}
        </div>

        {/* Barre d'action collante, façon bottom bar d'appli */}
        {sel && selMeta && (
          <div className="pointer-events-auto sticky bottom-0 z-30 -mt-24 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 bg-gradient-to-t from-black via-black/90 to-transparent">
            <div className="max-w-md mx-auto">
              <button
                onClick={() => handleChoose(sel)}
                disabled={busy || isCurrentPlan}
                className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97] shadow-xl ${
                  isCurrentPlan
                    ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed shadow-none'
                    : selMeta.gold
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-600/30'
                    : 'bg-white text-black'
                } ${busy && processingId !== sel.id ? 'opacity-50' : ''}`}
              >
                {processingId === sel.id ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Traitement...
                  </>
                ) : isCurrentPlan ? (
                  'Plan actuel'
                ) : isUpgrade ? (
                  <>
                    Mettre à niveau vers Gold <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Souscrire à {selMeta.name} · {price.toLocaleString()} FCFA <ArrowRight className="w-5 h-5" />
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