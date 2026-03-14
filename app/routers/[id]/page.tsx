'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getRouter, getProfiles, type Router, type HotspotProfile } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RouterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [routerData, setRouterData] = useState<Router | null>(null);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false); // 👈 État pour l'animation de copie

  const routerId = params.id ? parseInt(params.id as string) : null;

useEffect(() => {
  if (!routerId) return;
  
  const fetchData = async () => {
    try {
      console.log('🔍 Chargement du routeur ID:', routerId);
      
      const [routerRes, profilesRes] = await Promise.all([
        getRouter(routerId),
        getProfiles(routerId),
      ]);
      
      console.log('📦 Routeur brut reçu:', routerRes);
      console.log('📦 Profils reçus:', profilesRes);
      
      // Adapter le routeur (car les noms de champs peuvent être en CamelCase)
      const adaptedRouter: Router = {
        id: (routerRes as any).ID || (routerRes as any).id,
        name: (routerRes as any).Name || (routerRes as any).name || '',
        config_token: (routerRes as any).ConfigToken || (routerRes as any).config_token || '',
        is_active: (routerRes as any).IsActive ?? (routerRes as any).is_active ?? false,
        last_seen: (routerRes as any).LastSeen || (routerRes as any).last_seen || null,
        created_at: (routerRes as any).CreatedAt || (routerRes as any).created_at || '',
      };
      
      console.log('📦 Routeur adapté:', adaptedRouter);
      
      if (!adaptedRouter.id) {
        console.error('❌ Routeur invalide - pas d\'ID');
        toast.error('Routeur non trouvé');
        router.push('/routers');
        return;
      }
      
      setRouterData(adaptedRouter);
      setProfiles(Array.isArray(profilesRes) ? profilesRes : []);
      
    } catch (error) {
      console.error('❌ Erreur chargement détail routeur:', error);
      toast.error('Erreur lors du chargement des données');
      router.push('/routers');
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, [routerId, router]);
  const copyCommand = () => {
    if (routerData?.config_token) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';
      const command = `/tool fetch url="${apiUrl}/routers/configure/${routerData.config_token}" mode=https dst-path=monwifi\n/import monwifi`;
      
      navigator.clipboard.writeText(command)
        .then(() => {
          setCopied(true);
          toast.success('✓ Commande copiée dans le presse-papiers !', {
            icon: '📋',
            style: {
              background: '#10b981',
              color: '#fff',
              padding: '16px',
              borderRadius: '12px',
            },
            duration: 2000,
          });
          
          // Reset l'état après 2 secondes
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          toast.error('Erreur lors de la copie');
        });
    } else {
      toast.error('Token de configuration non disponible');
    }
  };

  // Fonction de formatage sécurisé des dates
 const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return 'Date inconnue';
  
  try {
    // Si c'est déjà une chaîne vide ou null
    if (dateString === '') return 'Date inconnue';
    
    const date = new Date(dateString);
    // Vérifie si la date est valide
    if (isNaN(date.getTime())) {
      return 'Date inconnue';
    }
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Date inconnue';
  }
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

  if (!routerData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Routeur non trouvé</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Effets de fond */}
      <div className="fixed inset-0 pointer-events-none z-0"
           style={{
             background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 50%, #fde68a 100%)'
           }}>
        <div className="absolute inset-0"
             style={{
               background: 'radial-gradient(circle at 0% 0%, rgba(217,119,6,0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(217,119,6,0.08) 0%, transparent 50%)'
             }} />
        <div className="absolute inset-0"
             style={{
               background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"none\"><path d=\"M0 0 L100 100 M100 0 L0 100\" stroke=\"%23d97706\" stroke-width=\"0.5\" opacity=\"0.05\"/></svg>')",
               backgroundSize: '50px 50px'
             }} />
      </div>

      <div className="relative z-10">
        {/* En-tête avec badge */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-block bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
              <i className="bi bi-star-fill mr-1"></i> DÉTAILS ROUTEUR
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{routerData.name}</h1>
            <p className="text-gray-600 mt-2">Détails et configuration du routeur</p>
          </div>
          <Link
            href="/routers"
            className="group flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-[rgba(217,119,6,0.2)] rounded-xl text-[#d97706] hover:bg-[#d97706] hover:text-white transition-all duration-300"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour à la liste
          </Link>
        </div>

        {/* Informations du routeur */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Carte principale */}
          <div className="lg:col-span-2 bg-white/95 backdrop-blur-[20px] border border-[rgba(217,119,6,0.2)] rounded-[32px] shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="2" />
                <path d="M12 6a6 6 0 0 1 6 6" strokeLinecap="round" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                <path d="M6 12a6 6 0 0 1 6-6" strokeLinecap="round" />
                <path d="M2 12a10 10 0 0 1 10-10" strokeLinecap="round" />
              </svg>
              Informations générales
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[rgba(217,119,6,0.1)]">
                <span className="text-gray-600">Statut</span>
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    routerData.is_active
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {routerData.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[rgba(217,119,6,0.1)]">
                <span className="text-gray-600">Dernière vue</span>
                <span className="text-gray-900">
                  {routerData.last_seen ? formatDate(routerData.last_seen) : 'Jamais'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[rgba(217,119,6,0.1)]">
                <span className="text-gray-600">Créé le</span>
                <span className="text-gray-900">
                  {formatDate(routerData.created_at)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[rgba(217,119,6,0.1)]">
                <span className="text-gray-600">Token de configuration</span>
                <span className="text-gray-900 font-mono text-sm bg-[rgba(217,119,6,0.05)] px-3 py-1 rounded-lg">
                  {routerData.config_token ? routerData.config_token.substring(0, 8) + '...' : 'Non disponible'}
                </span>
              </div>
            </div>

            {/* Bouton de copie de commande avec animation */}
            <button
              onClick={copyCommand}
              disabled={!routerData.config_token || copied}
              className={`
                mt-6 w-full py-3 px-4 rounded-xl font-semibold
                transition-all duration-300 flex items-center justify-center gap-2
                ${routerData.config_token
                  ? copied
                    ? 'bg-green-600 text-white scale-105'
                    : 'bg-gradient-to-r from-[#d97706] to-[#b45309] text-white hover:from-[#b45309] hover:to-[#92400e] hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Copier la commande d'installation</span>
                </>
              )}
            </button>
          </div>

          {/* Carte secondaire */}
          <div className="bg-white/95 backdrop-blur-[20px] border border-[rgba(217,119,6,0.2)] rounded-[32px] shadow-xl p-6">
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
                <p className="text-2xl font-bold text-green-600">
                  {profiles.filter(p => p.is_active).length}
                </p>
              </div>

              <Link
                href={`/profiles/new?router_id=${routerData.id}`}
                className="mt-4 w-full py-3 px-4 bg-[rgba(217,119,6,0.1)] text-[#d97706] rounded-xl hover:bg-[#d97706] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                </svg>
                Ajouter un forfait
              </Link>
            </div>
          </div>
        </div>

        {/* Liste des forfaits */}
        <div className="bg-white/95 backdrop-blur-[20px] border border-[rgba(217,119,6,0.2)] rounded-[32px] shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(217,119,6,0.2)] bg-gradient-to-r from-[#fff7e6] to-[#fffbeb]">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-2.17 2.17a4 4 0 0 1-5.66 0L4 6.99V4h2.99l8.59 8.59a4 4 0 0 1 0 5.66z"></path>
                <line x1="6" y1="12" x2="8" y2="14"></line>
              </svg>
              Forfaits du routeur
            </h2>
          </div>
          
          {profiles.length > 0 ? (
            <div className="divide-y divide-[rgba(217,119,6,0.1)]">
              {profiles.map((profile) => (
                <div key={profile.id} className="px-6 py-4 flex items-center justify-between hover:bg-[rgba(217,119,6,0.05)] transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{profile.profile_name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {profile.duration_minutes} min • {profile.price.toLocaleString()} {profile.currency}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        profile.is_active
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {profile.is_active ? 'Actif' : 'Inactif'}
                    </span>
                    <Link
                      href={`/profiles/${profile.id}`}
                      className="text-[#d97706] hover:text-[#b45309] font-medium transition-colors flex items-center gap-1 group"
                    >
                      Modifier
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#fff7e6] to-[#fffbeb] rounded-full flex items-center justify-center border border-[rgba(217,119,6,0.2)]">
                <svg className="w-12 h-12 text-[#d97706] opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.59 13.41l-2.17 2.17a4 4 0 0 1-5.66 0L4 6.99V4h2.99l8.59 8.59a4 4 0 0 1 0 5.66z"></path>
                </svg>
              </div>
              <p className="text-lg text-gray-500 mb-4">Aucun forfait associé à ce routeur</p>
              <Link
                href={`/profiles/new?router_id=${routerData.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#d97706] to-[#b45309] text-white rounded-xl hover:from-[#b45309] hover:to-[#92400e] transition-all duration-300 font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                </svg>
                Créer un forfait
              </Link>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <i className="bi bi-c-circle me-1"></i>
          2026 MbeejFepal. Tous droits réservés.
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }
        .animate-bounce {
          animation: bounce 0.5s ease-in-out;
        }
      `}</style>
    </Layout>
  );
}