'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getSubscriptionPlans, 
  chooseSubscription, 
  upgradeToLevel2, // Ajout de l'import
  SubscriptionPlan 
} from '@/lib/api';
import { useSubscription } from '../context/SubscriptionContext';
import { Check, Shield, Zap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const router = useRouter();
  const { status, refreshStatus } = useSubscription();

  // Redirection si déjà en Level 2 (le plus haut niveau)
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

    // CAS SPÉCIAL : Upgrade de Level 1 vers Level 2
    if (status?.active && status.subscription?.plan.level === 'level1' && plan.level === 'level2') {
      try {
        await upgradeToLevel2();
        toast.success('Passage au Niveau 2 effectué ! Facturation au prochain cycle.');
        await refreshStatus(); // Met à jour le contexte
        router.push('/dashboard');
      } catch (error) {
        toast.error("Erreur lors de l'upgrade");
        setProcessingId(null);
      }
      return;
    }

    // CAS NORMAL : Souscription ou Renouvellement via PayDunya
    try {
      const res = await chooseSubscription(plan.id);
      toast.success('Redirection vers PayDunya...');
      window.location.href = res.paydunya_url;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la création de l'abonnement");
      setProcessingId(null);
    }
  };

  // Fonction pour calculer le prix réel selon le nombre de routeurs actuels
  const calculatePrice = (plan: SubscriptionPlan) => {
    const currentRouters = status?.router_count || 0;
    if (plan.extra_router_price > 0 && currentRouters > plan.included_routers) {
      const extra = currentRouters - plan.included_routers;
      return plan.base_price + (extra * plan.extra_router_price);
    }
    return plan.base_price;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement des offres...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Choisissez votre abonnement</h1>
          <p className="text-xl text-gray-600">
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
              <div key={plan.id} className={`bg-white rounded-3xl shadow-xl overflow-hidden border-2 ${plan.level === 'level2' ? 'border-amber-500 relative' : 'border-transparent'}`}>
                
                {plan.level === 'level2' && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1 rounded-bl-lg font-semibold text-sm">
                    Recommandé
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 rounded-br-lg font-semibold text-sm">
                    Votre plan actuel
                  </div>
                )}
                
                <div className="p-8 pt-10">
                  <div className="flex items-center gap-3 mb-4">
                    {plan.level === 'level1' ? <Shield className="w-8 h-8 text-gray-700" /> : <Zap className="w-8 h-8 text-amber-500" />}
                    <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">
                      {actualPrice.toLocaleString()}
                    </span>
                    <span className="text-xl text-gray-500"> FCFA / mois</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-gray-700">
                      <Check className="w-5 h-5 text-green-500" />
                      Jusqu'à <strong>{plan.included_routers} routeurs</strong> inclus
                    </li>
                    {plan.extra_router_price > 0 && (
                      <li className="flex items-center gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-green-500" />
                        <strong>+{plan.extra_router_price.toLocaleString()} FCFA</strong> par routeur supplémentaire
                      </li>
                    )}
                    {isUpgrade && (
                      <li className="flex items-start gap-3 text-amber-700 bg-amber-50 p-3 rounded-lg mt-4 text-sm">
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
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : plan.level === 'level2' 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' 
                          : 'bg-gray-800 hover:bg-black'
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
  );
}