'use client';

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getSubscriptionPlans, chooseSubscription, upgradeToLevel2, SubscriptionPlan } from '@/lib/api';
import { useSubscription } from '../context/SubscriptionContext';
import {
  Check,
  Shield,
  Zap,
  AlertCircle,
  ArrowRight,
  Wallet,
  RefreshCw,
  Router,
  PlusCircle,
  Lock,
  Crown,
  Calendar,
  Clock,
  Save,
  Ticket,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ⚠️ Doit être aligné avec `LoadBalancingPrice` dans subscription_usecase.go.
// Facturé une seule fois, obligatoire pour TOUS les plans.
const LOAD_BALANCING_PRICE = 3000;

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20;

function SubscriptionContent() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [handledSuccess, setHandledSuccess] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { status, refreshStatus } = useSubscription();

  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';

  // ────────────────────────────────────────────────────────
  // SUCCESS FLOW — polling jusqu'à activation par webhook
  // ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSuccess || handledSuccess) return;
    if (status?.active) return;

    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        await refreshStatus();
      } catch {
        // erreur réseau ponctuelle, on continue
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        toast.error(
          "Le paiement est bien reçu. L'activation prend plus de temps que prévu — vérifiez dans quelques minutes.",
          { duration: 8000 }
        );
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, handledSuccess]);

  useEffect(() => {
    if (!isSuccess || handledSuccess) return;
    if (!status?.active) return;

    setHandledSuccess(true);

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    toast.success('Abonnement activé avec succès !');
    window.history.replaceState({}, '', '/subscription');
  }, [isSuccess, status?.active, handledSuccess]);

  // ────────────────────────────────────────────────────────
  // Chargement des plans
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getSubscriptionPlans();
        setPlans(data);
      } catch {
        toast.error('Erreur lors du chargement des plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const currentSub = status?.subscription;
  const isGold = currentSub?.plan?.level === 'level2';
  const isActive = !!status?.active;
  const isExempt = !!status?.is_exempt;
const blockNavigation = !isActive && !isExempt;
  // ✅ LB déjà payé sur une souscription précédente → on ne le refacture pas.
  const alreadyPaidLB = !!currentSub?.has_load_balancing;

  const plansToDisplay = useMemo(
    () =>
      currentSub?.plan?.level === 'level2'
        ? plans.filter((p) => p.level === 'level2')
        : plans,
    [plans, currentSub?.plan?.level]
  );

  useEffect(() => {
    if (!plansToDisplay.length) return;
    const stillValid = plansToDisplay.some((p) => p.id === selectedId);
    if (selectedId === null || !stillValid) {
      const premium = plansToDisplay.find((p) => p.level === 'level1');
      setSelectedId((premium ?? plansToDisplay[0]).id);
    }
  }, [plansToDisplay, selectedId]);

  // ────────────────────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────────────────────
  const handleChoose = async (plan: SubscriptionPlan) => {
    setProcessingId(plan.id);

    if (status?.active && status.subscription?.plan.level === 'level1' && plan.level === 'level2') {
      try {
        await upgradeToLevel2();
        await refreshStatus();
        toast.success('Passage au Niveau Gold effectué !');
      } catch {
        toast.error("Erreur lors de l'upgrade");
      } finally {
        setProcessingId(null);
      }
      return;
    }

    try {
      // Le backend ignore wantLoadBalancing (LB obligatoire), on envoie true par cohérence.
      const res: any = await chooseSubscription(plan.id, true);

      const waveUrl: string | undefined = res.wave_url || res.paydunya_url;

      if (!waveUrl) {
        throw new Error("L'URL de paiement n'a pas été retournée par le serveur");
      }

      toast.success('Redirection vers Wave...', { duration: 2000 });
      window.location.href = waveUrl;
    } catch (error: any) {
      const data = error?.response?.data;
      const backendMsg =
        typeof data === 'string' ? data : data?.message || data?.error || null;

      toast.error(backendMsg || error?.message || "Erreur lors de la création de l'abonnement");
      setProcessingId(null);
    }
  };

  const calculatePrice = (plan: SubscriptionPlan) => {
    const currentRouters = status?.router_count || 0;
    if (currentRouters <= plan.included_routers) {
      return plan.base_price;
    }
    const extra = currentRouters - plan.included_routers;
    return plan.base_price + extra * plan.extra_router_price;
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Chargement des forfaits..." />
      </Layout>
    );
  }

  const busy = processingId !== null;
  const expiresLabel = currentSub?.expires_at
    ? format(new Date(currentSub.expires_at), 'dd MMMM yyyy', { locale: fr })
    : null;

  const meta = (plan: SubscriptionPlan) => {
    const level1 = plan.level === 'level1';
    return {
      level1,
      name: level1 ? 'Premium' : 'Gold',
      desc: level1
        ? 'Pour démarrer (1 routeur)'
        : 'Pour les grands réseaux (dès 5 routeurs)',
    };
  };

  const sel = plansToDisplay.find((p) => p.id === selectedId) ?? null;
  const selMeta = sel ? meta(sel) : null;
  const basePrice = sel ? calculatePrice(sel) : 0;

  // ✅ LB facturé uniquement si pas encore payé
  const lbExtra = sel && !alreadyPaidLB ? LOAD_BALANCING_PRICE : 0;
  const totalButtonPrice = basePrice + lbExtra;

  const features = sel
    ? [
        {
          icon: Router,
          title: `Jusqu'à ${sel.included_routers} routeur(s) inclus`,
          sub: 'Gérez votre réseau au même endroit',
        },
        ...(sel.extra_router_price > 0
          ? [
              {
                icon: PlusCircle,
                title: `${sel.extra_router_price.toLocaleString('fr-FR')} FCFA / routeur supp.`,
                sub: selMeta?.level1 ? 'Maximum 5 routeurs' : 'Pour chaque routeur supplémentaire',
              },
            ]
          : []),
        { icon: Ticket, title: 'Tickets générés', sub: 'Gratuit & illimité' },
        { icon: Wallet, title: 'Paiement automatique', sub: 'Gratuit' },
        { icon: Save, title: 'Sauvegarde auto', sub: 'Gratuit' },
      ]
    : [];

  return (
    <div
      className={
        blockNavigation
          ? 'pointer-events-none [&_[data-logout]]:pointer-events-auto [&_[data-logout]]:cursor-pointer'
          : ''
      }
    >
      <Layout>
        <style>{`
          @keyframes sub-slide-in {
            from { opacity: 0; transform: translateY(14px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          .sub-enter { animation: sub-slide-in .35s cubic-bezier(.2,.8,.2,1) both; }
          .sub-row { animation: sub-slide-in .4s cubic-bezier(.2,.8,.2,1) both; }
        `}</style>

        <div
          className={`${blockNavigation ? 'pointer-events-auto ' : ''}max-w-md mx-auto px-4 pt-4 ${
            isActive ? 'pb-10' : 'pb-28'
          }`}
        >
          <header className="mb-5">
            <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-white">
              Abonnement
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Gérez votre plan et consultez votre historique
            </p>
          </header>
          {/* ───────── CAS 0 : ADMIN EXEMPTÉ (sans abonnement) ───────── */}
{isExempt && !currentSub && (
  <div className="sub-enter space-y-4">
    <section className="relative overflow-hidden rounded-[28px] p-6 border border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-gray-900 to-black">
      <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center border bg-amber-500/15 border-amber-500/30 text-amber-400">
          <Crown className="w-7 h-7" />
        </div>
        <span className="bg-amber-500 text-black text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full">
          ADMIN
        </span>
      </div>

      <h2 className="relative mt-5 text-2xl font-extrabold text-white">
        Compte administrateur
      </h2>
      <p className="relative text-sm text-gray-400 mt-1">
        Vous êtes le propriétaire de la plateforme. Aucun abonnement n&apos;est requis.
      </p>

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">
            Routeurs
          </p>
          <p className="text-lg font-bold text-white mt-0.5 tabular-nums">
            {status?.router_count ?? 0}
            <span className="text-xs font-medium text-gray-400 ml-1">/ ∞</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">
            Coût mensuel
          </p>
          <p className="text-lg font-bold text-green-400 mt-0.5">
            0 <span className="text-xs font-medium text-gray-400">FCFA</span>
          </p>
        </div>
      </div>

      <p className="relative mt-4 text-xs text-gray-500 text-center">
      </p>
    </section>
  </div>
)}

          {/* ───────── CAS 1 : ACTIF ───────── */}
          {currentSub && isActive && (
            <div className="space-y-4">
              <section className="sub-enter relative overflow-hidden rounded-[28px] p-6 border border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-gray-900 to-black">
                <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

                <div className="relative flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                      isGold
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-white/5 border-white/10 text-gray-300'
                    }`}
                  >
                    {isGold ? <Crown className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
                  </div>
                  <span className="bg-green-500/15 text-green-400 border border-green-500/30 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full">
                    ACTIF
                  </span>
                </div>

                <h2 className="relative mt-5 text-2xl font-extrabold text-white">
                  {isGold ? 'Gold' : 'Premium'}
                </h2>
                <p className="relative text-sm text-gray-400">
                  Votre abonnement est actif et fonctionnel.
                </p>

                <div className="relative mt-5 flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">
                      Prochain paiement
                    </p>
                    <p className="text-lg font-bold text-amber-400 mt-0.5">
                      {expiresLabel ?? 'N/A'}
                    </p>
                  </div>
                  <Calendar className="w-6 h-6 text-amber-500" />
                </div>

                <div className="relative mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">
                      Prix mensuel
                    </p>
                    <p className="text-lg font-bold text-white mt-0.5 tabular-nums">
                      {currentSub.monthly_amount?.toLocaleString('fr-FR') || 0}{' '}
                      <span className="text-xs font-medium text-gray-400">FCFA</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">
                      Routeurs
                    </p>
                    <p className="text-lg font-bold text-white mt-0.5 tabular-nums">
                      {currentSub.router_count}{' '}
                      <span className="text-xs font-medium text-gray-400">
                        / {currentSub.plan?.included_routers || 0}
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              {!isGold && (
                <section className="sub-enter rounded-[28px] border border-amber-500/20 bg-gradient-to-r from-amber-900/40 to-black p-5">
                  <h3 className="text-base font-bold text-white mb-1">
                    Passez à la vitesse supérieure
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Débloquez plus de routeurs et les fonctionnalités avancées avec Gold.
                  </p>
                  <button
                    onClick={() => {
                      const goldPlan = plans.find((p) => p.level === 'level2');
                      if (goldPlan) handleChoose(goldPlan);
                    }}
                    disabled={busy}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-amber-600/30 transition-all active:scale-[0.97] disabled:opacity-60"
                  >
                    {busy ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5" /> Passer à Gold
                      </>
                    )}
                  </button>
                </section>
              )}
            </div>
          )}

          {/* ───────── CAS 2 : EXPIRÉ, EN ATTENTE OU NOUVEAU ───────── */}
          {!isExempt && (!isActive || !currentSub) && (
            <>
              {currentSub ? (
                currentSub.status === 'pending' ? (
                  <div className="sub-enter bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-5 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-400 mb-1">Paiement en attente</p>
                      <p className="text-sm text-blue-200/80">
                        Votre commande pour le plan {currentSub.plan?.name} est en attente de
                        validation. Si vous n&apos;avez pas finalisé le paiement, veuillez le refaire
                        ci-dessous.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="sub-enter bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-5 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-400 mb-1">
                        Votre abonnement a expiré
                      </p>
                      <p className="text-sm text-red-200/80">
                        Votre plan {currentSub.plan?.name || 'précédent'} a expiré le{' '}
                        {expiresLabel ?? 'récemment'}. Veuillez le renouveler ci-dessous.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="sub-enter bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-5 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">
                    Vous n&apos;avez pas d&apos;abonnement actif. Choisissez un plan ci-dessous.
                  </p>
                </div>
              )}

              {/* Segmented control */}
              {plansToDisplay.length > 1 && (
                <div
                  role="tablist"
                  className="grid bg-white/5 border border-white/10 rounded-2xl p-1 mb-5"
                  style={{
                    gridTemplateColumns: `repeat(${plansToDisplay.length}, minmax(0, 1fr))`,
                  }}
                >
                  {plansToDisplay.map((plan) => {
                    const m = meta(plan);
                    const active = plan.id === selectedId;
                    return (
                      <button
                        key={plan.id}
                        role="tab"
                        aria-selected={active}
                        disabled={busy}
                        onClick={() => setSelectedId(plan.id)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                          active
                            ? m.level1
                              ? 'bg-white text-black shadow-lg'
                              : 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                            : 'text-gray-400'
                        }`}
                      >
                        {m.level1 ? <Shield className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {sel && selMeta && (
                <div key={sel.id} className="space-y-4">
                  {/* Carte héro : prix */}
                  <section
                    className={`sub-enter relative overflow-hidden rounded-[28px] p-6 border bg-gradient-to-br ${
                      selMeta.level1
                        ? 'from-white/10 via-gray-900 to-black border-white/10'
                        : 'from-amber-500/25 via-gray-900 to-black border-amber-500/40'
                    }`}
                  >
                    <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

                    <div className="relative flex items-start justify-between">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                          selMeta.level1
                            ? 'bg-white/5 border-white/10 text-gray-300'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {selMeta.level1 ? (
                          <Shield className="w-7 h-7" />
                        ) : (
                          <Zap className="w-7 h-7" />
                        )}
                      </div>
                      {!selMeta.level1 && (
                        <span className="bg-amber-500 text-black text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full">
                          RECOMMANDÉ
                        </span>
                      )}
                    </div>

                    <h2 className="relative mt-5 text-2xl font-extrabold text-white">
                      {selMeta.name}
                    </h2>
                    <p className="relative text-sm text-gray-400">{selMeta.desc}</p>

                    <div className="relative mt-5 flex items-end gap-2">
                      <span className="text-5xl font-black tracking-tight text-amber-400 tabular-nums">
                        {basePrice.toLocaleString('fr-FR')}
                      </span>
                      <span className="pb-1.5 text-sm font-medium text-gray-400">
                        FCFA / mois
                      </span>
                    </div>

                    {basePrice > sel.base_price && (
                      <p className="relative mt-2 text-xs text-gray-400">
                        Dont {(basePrice - sel.base_price).toLocaleString('fr-FR')} FCFA pour vos
                        routeurs supplémentaires
                      </p>
                    )}
                    {lbExtra > 0 && (
                      <p className="relative mt-1 text-xs text-amber-300">
                        + {lbExtra.toLocaleString('fr-FR')} FCFA (Load Balancing, facturé une seule
                        fois)
                      </p>
                    )}
                  </section>

                  {/* Liste des features */}
                  <section className="rounded-[28px] bg-white/5 border border-white/10 overflow-hidden">
                    <h3 className="px-5 pt-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      Inclus dans l&apos;offre
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
                              <p className="text-sm font-semibold text-white leading-snug">
                                {f.title}
                              </p>
                              <p className="text-xs text-gray-400 leading-snug mt-0.5">{f.sub}</p>
                            </div>
                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                  {/* Option Load Balancing — OBLIGATOIRE, tous plans */}
                  {sel && (
                    <section className="sub-enter rounded-[28px] bg-amber-500/5 border border-amber-500/30 px-5 py-4 flex items-center gap-3.5">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white leading-snug flex items-center gap-2">
                          Option Load Balancing
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold">
                            Requis
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 leading-snug mt-0.5">
                          {alreadyPaidLB
                            ? 'Déjà payée sur votre précédente souscription — non refacturée.'
                            : `+${LOAD_BALANCING_PRICE.toLocaleString('fr-FR')} FCFA facturés une seule fois`}
                        </p>
                      </div>

                      {/* Toggle verrouillé ON */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={true}
                        aria-label="Option Load Balancing obligatoire"
                        disabled
                        className="relative w-12 h-7 shrink-0 rounded-full bg-amber-500 cursor-not-allowed"
                      >
                        <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md translate-x-5" />
                      </button>
                    </section>
                  )}
                </div>
              )}
            </>
          )}

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 mt-6">
            <Lock className="w-3 h-3" /> Paiement sécurisé via Wave
          </p>
        </div>

        {/* Bottom bar sticky */}
        {!isExempt && !isActive && sel && selMeta && (
          <div className="pointer-events-auto sticky bottom-0 z-30 -mt-24 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 bg-gradient-to-t from-black via-black/90 to-transparent">
            <div className="max-w-md mx-auto">
              <button
                onClick={() => handleChoose(sel)}
                disabled={busy}
                className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97] shadow-xl ${
                  selMeta.level1
                    ? 'bg-white text-black'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-600/30'
                }`}
              >
                {processingId === sel.id ? (
                  <>
                    <span className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    {currentSub ? 'Renouveler' : 'Souscrire à'} {selMeta.name} ·{' '}
                    {totalButtonPrice.toLocaleString('fr-FR')} FCFA
                    <ArrowRight className="w-5 h-5" />
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

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="max-w-md mx-auto px-4 py-6 space-y-4 animate-pulse">
            <div className="h-8 w-48 rounded-xl bg-white/10" />
            <div className="h-12 rounded-2xl bg-white/10" />
            <div className="h-44 rounded-[28px] bg-white/10" />
          </div>
        </Layout>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}