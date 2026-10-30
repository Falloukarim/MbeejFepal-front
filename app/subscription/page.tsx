'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSubscriptionPlans, chooseSubscription, upgradeToLevel2, SubscriptionPlan } from '@/lib/api';
import { useSubscription } from '../context/SubscriptionContext';
import { Check, Shield, Zap, AlertCircle, ArrowRight, Wallet, QrCode, RefreshCw, Router, PlusCircle, Lock, Crown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function SubscriptionContent() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [wantLoadBalancing, setWantLoadBalancing] = useState(false); // ✅ State pour la case à cocher
  const { status, refreshStatus } = useSubscription();
  
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    if (isSuccess) {
      toast.success('Abonnement activé avec succès !');
      refreshStatus();
      window.history.replaceState({}, '', '/subscription');
    }
  }, [isSuccess, refreshStatus]);

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

  const handleChoose = async (plan: SubscriptionPlan) => {
    setProcessingId(plan.id);

       if (status?.active && status.subscription?.plan.level === 'level1' && plan.level === 'level2') {
      try {
        await upgradeToLevel2();
        await refreshStatus();
        toast.success('Passage au Niveau Gold effectué !');
      } catch (error) {
        toast.error("Erreur lors de l'upgrade");
      } finally {
        setProcessingId(null);
      }
      return;
    }

    try {
      // ✅ On passe wantLoadBalancing à l'API
      const res = await chooseSubscription(plan.id, wantLoadBalancing);
      toast.success('Redirection vers le paiement...');
      window.location.href = res.paydunya_url;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la création de l'abonnement");
      setProcessingId(null);
    }
  };

  const calculatePrice = (plan: SubscriptionPlan) => {
    const currentRouters = status?.router_count || 0;
    if (currentRouters <= plan.included_routers) {
      return plan.base_price;
    }
    const extra = currentRouters - plan.included_routers;
    return plan.base_price + (extra * plan.extra_router_price);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </Layout>
    );
  }

  const currentSub = status?.subscription;
  const isGold = currentSub?.plan?.level === 'level2';
  const isActive = status?.active;
  const blockNavigation = !isActive;
  return (
      <div className={blockNavigation ? "pointer-events-none [&_[data-logout]]:pointer-events-auto [&_[data-logout]]:cursor-pointer" : ""}>
      <Layout>
        <div className={blockNavigation ? "pointer-events-auto max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8" : "max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8"}>
          
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-white">Votre Abonnement</h1>
            <p className="text-gray-300 mt-2">Gérez votre plan et consultez votre historique</p>
          </div>

          {/* CAS 1 : ACTIF */}
          {isActive && currentSub && (
            <div className="space-y-6 mb-12">
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl p-8 border border-amber-500/30">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {isGold ? <Crown className="w-8 h-8 text-amber-500" /> : <Shield className="w-8 h-8 text-gray-300" />}
                      <h2 className="text-3xl font-extrabold text-white">{isGold ? 'Gold' : 'Premium'}</h2>
                    </div>
                    <p className="text-gray-400">Votre abonnement est actif et fonctionnel.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[200px]">
                    <p className="text-sm text-gray-400 mb-1">Prochain paiement</p>
                    <p className="text-xl font-bold text-amber-500 flex items-center justify-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {currentSub.expires_at ? format(new Date(currentSub.expires_at), 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm text-gray-400">Prix mensuel</p>
                     <p className="text-xl font-bold text-white">{currentSub.monthly_amount.toLocaleString()} FCFA</p>
                   </div>
                   <div>
                     <p className="text-sm text-gray-400">Routeurs inclus</p>
                     <p className="text-xl font-bold text-white">{currentSub.router_count} / {currentSub.plan?.included_routers || 0}</p>
                   </div>
                </div>
              </div>

              {!isGold && (
                <div className="bg-gradient-to-r from-amber-900/40 to-black border border-amber-500/20 rounded-[32px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Passez à la vitesse supérieure</h3>
                    <p className="text-sm text-gray-400">Débloquez plus de routeurs et les fonctionnalités avancées avec Gold.</p>
                  </div>
                  <button
                    onClick={() => {
                      const goldPlan = plans.find(p => p.level === 'level2');
                      if (goldPlan) handleChoose(goldPlan);
                    }}
                    disabled={processingId !== null}
                    className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all shadow-lg whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    {processingId ? 'Traitement...' : <><Crown className="w-5 h-5" /> Passer à Gold</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CAS 2 : EXPIRÉ OU NOUVEAU */}
          {(!isActive || !currentSub) && (
            <>
              {currentSub ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-400 mb-1">Votre abonnement a expiré</p>
                    <p className="text-sm text-red-200/80">
                      Votre plan {currentSub.plan?.name || 'précédent'} a expiré le {currentSub.expires_at ? format(new Date(currentSub.expires_at), 'dd MMMM yyyy', { locale: fr }) : 'récemment'}. 
                      Veuillez le renouveler ci-dessous.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">
                    Vous n'avez pas d'abonnement actif. Choisissez un plan ci-dessous.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-6">
                {(() => {
                  const plansToDisplay = currentSub?.plan?.level === 'level2'
                    ? plans.filter(p => p.level === 'level2')
                    : plans;

                  return plansToDisplay.map((plan) => {
                    const isLevel1 = plan.level === 'level1';
                    const planName = isLevel1 ? 'Premium' : 'Gold';
                    const planDesc = isLevel1 ? 'Pour démarrer (1 routeur)' : 'Pour les grands réseaux (dès 5 routeurs)';
                    const basePrice = calculatePrice(plan);
                    
                    // ✅ Calcul du prix à afficher sur le bouton
                    const totalButtonPrice = basePrice + (isLevel1 && wantLoadBalancing ? 3000 : 0);

                    return (
                      <div
                        key={plan.id}
                        className={`relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl p-6 sm:p-8 border ${
                          !isLevel1 ? 'border-amber-500/50' : 'border-white/10'
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        {!isLevel1 && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-black px-4 py-1.5 rounded-bl-2xl font-bold text-xs tracking-wide z-20">
                            RECOMMANDÉ
                          </div>
                        )}

                        <div className="relative z-10 pt-2">
                          <div className="flex items-center gap-3 mb-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                              !isLevel1 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/10 text-gray-400'
                            }`}>
                              {isLevel1 ? <Shield className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-white">{planName}</h2>
                              <p className="text-sm text-gray-400">{planDesc}</p>
                            </div>
                          </div>

                          <div className="mb-6 bg-white/5 rounded-2xl p-4 border border-white/5 flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold text-amber-500">{basePrice.toLocaleString()}</span>
                            <span className="text-gray-400 font-medium"> FCFA / mois</span>
                          </div>

                          {/* ✅ LISTE DES FONCTIONNALITÉS CORRIGÉE */}
                          <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-gray-200 text-sm">
                              <Router className="w-5 h-5 text-green-500 shrink-0" />
                              <span>Jusqu'à <strong>{plan.included_routers} routeur(s)</strong> inclus</span>
                            </li>
                            
                            {plan.extra_router_price > 0 && (
                              <li className="flex items-start gap-3 text-gray-200 text-sm">
                                <PlusCircle className="w-5 h-5 text-green-500 shrink-0" />
                                <span><strong>{plan.extra_router_price.toLocaleString()} FCFA</strong> / routeur supp. 
                                  {isLevel1 && " (max 5)"}
                                </span>
                              </li>
                            )}

                            <li className="flex items-start gap-3 text-gray-200 text-sm">
                              <RefreshCw className="w-5 h-5 text-green-500 shrink-0" />
                              <span><strong>Tickets générés</strong> : Gratuit & Illimité</span>
                            </li>
                            <li className="flex items-start gap-3 text-gray-200 text-sm">
                              <Wallet className="w-5 h-5 text-green-500 shrink-0" />
                              <span><strong>Paiement automatique</strong> : Gratuit</span>
                            </li>
                            <li className="flex items-start gap-3 text-gray-200 text-sm">
                              <Check className="w-5 h-5 text-green-500 shrink-0" />
                              <span><strong>Sauvegarde auto</strong> : Gratuit</span>
                            </li>
                            
                            {isLevel1 && (
                              <li className="flex items-start gap-3 text-gray-400 text-sm italic">
                                <Zap className="w-5 h-5 shrink-0" />
                                <span>Load Balancing : 3 000 FCFA (option unique)</span>
                              </li>
                            )}
                          </ul>

                          {/* ✅ CHECKBOX POUR LE LOAD BALANCING (PREMIUM UNIQUEMENT) */}
                          {isLevel1 && (
                            <label className="flex items-center gap-3 mb-6 cursor-pointer p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={wantLoadBalancing} 
                                onChange={(e) => setWantLoadBalancing(e.target.checked)}
                                className="w-5 h-5 accent-amber-500 rounded"
                              />
                              <div>
                                <p className="text-white text-sm font-medium">Ajouter l'option Load Balancing</p>
                                <p className="text-xs text-gray-400">+3 000 FCFA facturés une seule fois</p>
                              </div>
                            </label>
                          )}

                          <button
                            onClick={() => handleChoose(plan)}
                            disabled={processingId !== null}
                            className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                              !isLevel1
                                ? 'bg-[#d97706] hover:bg-[#b45309] text-white'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                            }`}
                          >
                            {processingId === plan.id ? (
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Traitement...
                              </span>
                            ) : (
                              <>
                                {currentSub ? 'Renouveler' : 'Souscrire à'} {planName} 
                                <span className="ml-1 opacity-90">({totalButtonPrice.toLocaleString()} F)</span>
                                <ArrowRight className="w-5 h-5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          )}

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 mt-8">
            <Lock className="w-3 h-3" /> Paiement sécurisé via PayDunya
          </p>
        </div>
      </Layout>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </Layout>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}