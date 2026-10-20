'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans, chooseSubscription, upgradeToLevel2, SubscriptionPlan } from '@/lib/api';
import { useSubscription } from '../context/SubscriptionContext';
import { Check, Shield, Zap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout'; // ✅ Import du Layout

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
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

  const handleChoose = async (plan: SubscriptionPlan) => {
    setProcessingId(plan.id);

    if (status?.active && status.subscription?.plan.level === 'level1' && plan.level === 'level2') {
      try {
        await upgradeToLevel2();
        toast.success('Passage au Niveau 2 effectué !');
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
      toast.success('Redirection vers PayDunya...');
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
      return plan.base_price + (extra * plan.extra_router_price);
    }
    return plan.base_price;
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

  return (
    // ✅ Le wrapper global est non-cliquable (décor)
    <div className="pointer-events-none">
      <Layout>
        {/* ✅ La zone de contenu redevient cliquable */}
        <div className="pointer-events-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold text-white mb-4">Choisissez votre abonnement</h1>
              <p className="text-xl text-gray-400">
                {status?.active 
                  ? `Vous avez actuellement ${status.router_count} routeur(s).`
                  : "Sélectionnez l'offre qui correspond à la taille de votre réseau."}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {plans.map((plan) => {
                const isCurrentPlan = status?.active && status.subscription?.plan.id === plan.id;
                const actualPrice = calculatePrice(plan);
                const isLevel1User = status?.active && status.subscription?.plan.level === 'level1';
                const isUpgrade = isLevel1User && plan.level === 'level2';

                return (
                  <div key={plan.id} className={`relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl p-8 border ${plan.level === 'level2' ? 'border-amber-500' : 'border-white/10'}`}>
                    {/* Effet de halo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    {plan.level === 'level2' && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1 rounded-bl-lg font-semibold text-sm z-20">
                        Recommandé
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 rounded-br-lg font-semibold text-sm z-20">
                        Votre plan actuel
                      </div>
                    )}
                    
                    <div className="relative z-10 pt-4">
                      <div className="flex items-center gap-3 mb-4">
                        {plan.level === 'level1' ? <Shield className="w-8 h-8 text-gray-400" /> : <Zap className="w-8 h-8 text-amber-500" />}
                        <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                      </div>
                      
                      <div className="mb-6">
                        <span className="text-5xl font-extrabold text-amber-500">
                          {actualPrice.toLocaleString()}
                        </span>
                        <span className="text-xl text-gray-400"> FCFA / mois</span>
                      </div>

                      <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-gray-300">
                          <Check className="w-5 h-5 text-green-500" />
                          Jusqu'à <strong>{plan.included_routers} routeurs</strong> inclus
                        </li>
                        {plan.extra_router_price > 0 && (
                          <li className="flex items-center gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500" />
                            <strong>+{plan.extra_router_price.toLocaleString()} FCFA</strong> par routeur supplémentaire
                          </li>
                        )}
                        {isUpgrade && (
                          <li className="flex items-start gap-3 text-amber-200 bg-amber-500/10 p-3 rounded-lg mt-4 text-sm border border-amber-500/20">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            En passant au Niveau 2, vous débloquez immédiatement la création de routeurs. La différence sera facturée le mois prochain.
                          </li>
                        )}
                      </ul>

                      <button
                        onClick={() => handleChoose(plan)}
                        disabled={processingId !== null || isCurrentPlan}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                          isCurrentPlan 
                            ? 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5'
                            : plan.level === 'level2' 
                              ? 'bg-[#d97706] hover:bg-[#b45309]' 
                              : 'bg-white/10 hover:bg-white/20 border border-white/10'
                        } ${processingId !== null && processingId !== plan.id ? 'opacity-50' : ''}`}
                      >
                        {processingId === plan.id 
                          ? 'Traitement...' 
                          : isCurrentPlan 
                            ? 'Plan actuel'
                            : isUpgrade 
                              ? 'Mettre à niveau'
                              : 'Souscrire à ce plan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
}