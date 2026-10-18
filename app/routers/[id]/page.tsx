'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getRouter, getProfiles, updateRouter, type Router, type HotspotProfile } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Save, ShieldAlert } from 'lucide-react';

type RouterForm = {
  name: string;
  daily_quota_gb: number;
};

export default function RouterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [routerData, setRouterData] = useState<Router | null>(null);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const routerId = params.id ? parseInt(params.id as string) : null;

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<RouterForm>();

  useEffect(() => {
    if (!routerId) return;
    
    const fetchData = async () => {
      try {
        const [routerRes, profilesRes] = await Promise.all([
          getRouter(routerId),
          getProfiles(routerId),
        ]);
        
        const adaptedRouter: Router = {
          id: (routerRes as any).ID || (routerRes as any).id,
          name: (routerRes as any).Name || (routerRes as any).name || '',
          config_token: (routerRes as any).ConfigToken || (routerRes as any).config_token || '',
          is_active: (routerRes as any).IsActive ?? (routerRes as any).is_active ?? false,
          last_seen: (routerRes as any).LastSeen || (routerRes as any).last_seen || null,
          created_at: (routerRes as any).CreatedAt || (routerRes as any).created_at || '',
        };
        
        if (!adaptedRouter.id) {
          toast.error('Routeur non trouvé');
          router.push('/routers');
          return;
        }
        
        setRouterData(adaptedRouter);
        setProfiles(Array.isArray(profilesRes) ? profilesRes : []);

        // ✅ Remplir le formulaire avec les données existantes
        reset({
          name: adaptedRouter.name,
          daily_quota_gb: (routerRes as any).DailyQuotaGB || (routerRes as any).daily_quota_gb || 0,
        });
        
      } catch (error) {
        toast.error('Erreur lors du chargement des données');
        router.push('/routers');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [routerId, router, reset]);

  const onSubmit = async (data: RouterForm) => {
    if (!routerId) return;
    try {
      await updateRouter(routerId, data);
      toast.success('Routeur mis à jour avec succès !');
      // Mettre à jour le state local pour le titre
      setRouterData((prev) => prev ? { ...prev, name: data.name } : null);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const copyCommand = () => {
    if (routerData?.config_token) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';
      const command = `/tool fetch url="${apiUrl}/routers/configure/${routerData.config_token}" mode=https dst-path=monwifi\n/import monwifi`;
      
      navigator.clipboard.writeText(command)
        .then(() => {
          setCopied(true);
          toast.success('✓ Commande copiée !', {
            style: { background: '#10b981', color: '#fff', borderRadius: '12px' },
            duration: 2000,
          });
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => toast.error('Erreur lors de la copie'));
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date inconnue';
      return date.toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Date inconnue'; }
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

  if (!routerData) return null;

  return (
    <Layout>
      {/* Effets de fond */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 50%, #fde68a 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 0% 0%, rgba(217,119,6,0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(217,119,6,0.08) 0%, transparent 50%)' }} />
      </div>

      <div className="relative z-10">
        {/* En-tête */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-block bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
              DÉTAILS ROUTEUR
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{routerData.name}</h1>
          </div>
          <Link href="/routers" className="group flex items-center gap-2 px-4 py-2 bg-white/80 border border-[rgba(217,119,6,0.2)] rounded-xl text-[#d97706] hover:bg-[#d97706] hover:text-white transition-all">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Carte principale : Formulaire d'édition */}
          <div className="lg:col-span-2 bg-white/95 border border-[rgba(217,119,6,0.2)] rounded-[32px] shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Modifier les paramètres
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du routeur</label>
                <input
                  {...register('name', { required: true })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d97706] outline-none transition"
                />
              </div>

              {/* ✅ NOUVEAU : Le champ Quota */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <label className="block text-sm font-bold text-gray-900">
                    Limite de consommation journalière
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    {...register('daily_quota_gb', { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-32 px-4 py-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-lg font-bold"
                  />
                  <span className="text-gray-600 font-medium">Gigaoctets (Go) / jour</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  L'accès Internet de tous les clients sera coupé si le quota est dépassé. 
                  La limite est réinitialisée chaque jour à minuit. <strong>0 = Illimité.</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#d97706] to-[#b45309] text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>

            {/* Infos de configuration (lecture seule) */}
            <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
               <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Statut</span>
                <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${routerData.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {routerData.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Dernière vue</span>
                <span className="text-gray-900 text-sm">{routerData.last_seen ? formatDate(routerData.last_seen) : 'Jamais'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 text-sm">Token de configuration</span>
                <span className="text-gray-900 font-mono text-xs bg-[rgba(217,119,6,0.05)] px-3 py-1 rounded-lg">
                  {routerData.config_token ? routerData.config_token.substring(0, 8) + '...' : 'Non disponible'}
                </span>
              </div>
            </div>

            <button
              onClick={copyCommand}
              disabled={!routerData.config_token || copied}
              className={`mt-6 w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  routerData.config_token
                    ? copied ? 'bg-green-600 text-white scale-105' : 'bg-gray-800 text-white hover:bg-black'
                    : 'bg-gray-200 text-gray-500'
                }`}
            >
              {copied ? '✓ Copié !' : 'Copier la commande d\'installation'}
            </button>
          </div>

          {/* Carte secondaire : Stats (inchangée) */}
          <div className="bg-white/95 border border-[rgba(217,119,6,0.2)] rounded-[32px] shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" strokeLinecap="round"/>
                <path d="M18 17V9" strokeLinecap="round"/>
                <path d="M12 17V5" strokeLinecap="round"/>
                <path d="M6 17v-3" strokeLinecap="round"/>
              </svg>
              Statistiques
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-[rgba(217,119,6,0.05)] rounded-xl border border-[rgba(217,119,6,0.1)]">
                <p className="text-sm text-gray-600 mb-1">Forfaits associés</p>
                <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
              </div>
              <div className="p-4 bg-[rgba(217,119,6,0.05)] rounded-xl border border-[rgba(217,119,6,0.1)]">
                <p className="text-sm text-gray-600 mb-1">Forfaits actifs</p>
                <p className="text-2xl font-bold text-green-600">{profiles.filter(p => p.is_active).length}</p>
              </div>
              <Link
                href={`/profiles/new?router_id=${routerData.id}`}
                className="mt-4 w-full py-3 px-4 bg-[rgba(217,119,6,0.1)] text-[#d97706] rounded-xl hover:bg-[#d97706] hover:text-white transition-all font-medium flex justify-center"
              >
                + Ajouter un forfait
              </Link>
            </div>
          </div>
        </div>

        {/* Liste des forfaits (inchangée) */}
        <div className="bg-white/95 border border-[rgba(217,119,6,0.2)] rounded-[32px] shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(217,119,6,0.2)] bg-gradient-to-r from-[#fff7e6] to-[#fffbeb]">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              Forfaits du routeur
            </h2>
          </div>
          {profiles.length > 0 ? (
            <div className="divide-y divide-[rgba(217,119,6,0.1)]">
              {profiles.map((profile) => (
                <div key={profile.id} className="px-6 py-4 flex items-center justify-between hover:bg-[rgba(217,119,6,0.05)]">
                  <div>
                    <p className="font-medium text-gray-900">{profile.profile_name}</p>
                    <p className="text-sm text-gray-500">{profile.duration_minutes} min • {profile.price.toLocaleString()} {profile.currency}</p>
                  </div>
                  <Link href={`/profiles/${profile.id}`} className="text-[#d97706] font-medium hover:underline">
                    Modifier
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              Aucun forfait associé.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}