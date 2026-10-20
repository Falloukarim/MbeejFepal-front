'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getRouters, deleteRouter, type Router } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RoutersPage() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<number | null>(null);

  useEffect(() => {
    loadRouters();
  }, []);

  const loadRouters = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Non authentifié');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';
      const response = await fetch(`${apiUrl}/routers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      const data = await response.json();

      if (Array.isArray(data)) {
        const now = new Date();
        const transformedRouters: Router[] = data.map(item => {
          const lastSeen = item.LastSeen ? new Date(item.LastSeen) : null;
          const isOnline = lastSeen && (now.getTime() - lastSeen.getTime()) < 10 * 60 * 1000;
          
          let connectionStatus: 'online' | 'offline' | 'never_connected' = 'never_connected';
          let statusDisplay = 'Jamais connecté';
          
          if (lastSeen) {
            if (isOnline) {
              connectionStatus = 'online';
              statusDisplay = '✅ En ligne';
            } else {
              connectionStatus = 'offline';
              statusDisplay = '⚠️ Hors ligne';
            }
          }

          return {
            id: item.ID,
            user_id: item.UserID,
            router_uuid: item.RouterUUID,
            zone_id: item.ZoneID,
            name: item.Name,
            config_token: item.ConfigToken,
            is_active: item.IsActive,
            last_seen: item.LastSeen,
            created_at: item.CreatedAt,
            connection_status: connectionStatus,
            status_display: statusDisplay
          };
        }).filter(router => router.id);

        setRouters(transformedRouters);
      } else {
        setRouters([]);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des routeurs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce routeur ?')) return;
    
    try {
      await deleteRouter(id);
      toast.success('Routeur supprimé avec succès');
      loadRouters();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const copyCommand = async (id: number, token: string) => {
    setCopyingId(id);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';
    const command = `/tool fetch url="${apiUrl}/routers/configure/${token}" mode=https dst-path=monwifi\n/import monwifi`;
    
    try {
      await navigator.clipboard.writeText(command);
      
      setTimeout(() => {
        setCopyingId(null);
        toast.success('✓ Commande copiée dans le presse-papiers !', {
          icon: '📋',
          style: { background: '#10b981', color: '#fff', padding: '16px', borderRadius: '12px' },
          duration: 2000,
        });
      }, 500);
      
    } catch {
      setCopyingId(null);
      toast.error('Erreur lors de la copie');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getStatusBadge = (router: Router) => {
    if (router.connection_status === 'online') {
      return { color: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-500 animate-pulse', text: 'En ligne' };
    } else if (router.connection_status === 'offline') {
      return { color: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500', text: 'Hors ligne' };
    } else {
      return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500', text: 'Jamais connecté' };
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="relative w-20 h-20">
            <svg className="w-16 h-16 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#d97706] animate-[pulse_2s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round"/>
              <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7"/>
              <path d="M8 16.5L12 12.5L16 16.5" strokeLinecap="round" strokeWidth="2"/>
            </svg>
            <div className="absolute inset-0 border-2 border-[#d97706] rounded-full animate-[ripple_1.5s_linear_infinite]"></div>
            <div className="absolute inset-0 border-2 border-[#d97706] rounded-full animate-[ripple_1.5s_linear_infinite_0.5s]"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* En-tête avec badge et bouton d'ajout */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#d97706] to-[#b45309] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg mb-3">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round"/>
                <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7"/>
              </svg>
              GESTION DES ROUTEURS
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Routeurs MikroTik</h1>
            <p className="text-gray-600 mt-2">Gérez vos points d'accès et leur configuration</p>
          </div>
          
          <Link
            href="/routers/new"
            className="group relative overflow-hidden bg-gradient-to-r from-[#d97706] to-[#b45309] text-white font-semibold py-3 px-6 rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            Nouveau routeur
          </Link>
        </div>

        {/* Tableau professionnel */}
        {routers.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl p-12 text-center border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <svg className="w-12 h-12 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round"/>
                  <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7"/>
                  <path d="M8 16.5L12 12.5L16 16.5" strokeLinecap="round" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Aucun routeur configuré</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Commencez par ajouter votre premier routeur MikroTik pour gérer vos points d'accès Wi-Fi.
              </p>
              <Link
                href="/routers/new"
                className="inline-flex items-center gap-2 bg-[#d97706] text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg hover:bg-[#b45309] transition-all duration-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                </svg>
                Ajouter un routeur
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl overflow-hidden border border-white/10 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* Tableau pour desktop */}
            <div className="hidden lg:block overflow-x-auto relative z-10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Routeur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Dernière connexion</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuration</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Forfaits</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Créé le</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {routers.map((router) => {
                    const status = getStatusBadge(router);
                    return (
                      <tr key={router.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <svg className="w-8 h-8 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round"/>
                              <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7"/>
                              <path d="M8 16.5L12 12.5L16 16.5" strokeLinecap="round" strokeWidth="2"/>
                            </svg>
                            <div>
                              <div className="font-medium text-white">{router.name || 'Routeur sans nom'}</div>
                              <div className="text-xs text-gray-500">ID: {router.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                            <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400">
                            {router.last_seen ? formatDate(router.last_seen) : 'Jamais'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {router.config_token ? (
                            <button
                              onClick={() => copyCommand(router.id!, router.config_token!)}
                              disabled={copyingId === router.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 text-sm font-medium ${
                                copyingId === router.id
                                  ? 'bg-green-500 text-white scale-105'
                                  : 'bg-white/5 text-gray-300 hover:bg-[#d97706] hover:text-white'
                              }`}
                            >
                              {copyingId === router.id ? '✓ Copié !' : 'Copier la commande'}
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500">Non configuré</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/routers/${router.id}/profiles`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 text-[#d97706] rounded-lg hover:bg-[#d97706] hover:text-white transition-all duration-300 text-sm font-medium"
                          >
                            Gérer
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {router.created_at ? formatDate(router.created_at) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/routers/${router.id}`}
                              className="p-2 text-gray-400 hover:text-[#d97706] hover:bg-white/10 rounded-lg transition-all"
                              title="Modifier"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                                <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDelete(router.id!)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Supprimer"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cartes pour mobile/tablette */}
            <div className="lg:hidden space-y-4 p-4 relative z-10">
              {routers.map((router) => {
                const status = getStatusBadge(router);
                return (
                  <div key={router.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg className="w-8 h-8 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round"/>
                            <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7"/>
                          </svg>
                          <div>
                            <h3 className="font-semibold text-white">{router.name || 'Routeur sans nom'}</h3>
                            <p className="text-xs text-gray-500">ID: {router.id}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Dernière connexion</span>
                        <span className="font-medium text-white">
                          {router.last_seen ? formatDate(router.last_seen) : 'Jamais'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Créé le</span>
                        <span className="font-medium text-white">
                          {router.created_at ? formatDate(router.created_at) : 'N/A'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {router.config_token ? (
                          <button
                            onClick={() => copyCommand(router.id!, router.config_token!)}
                            disabled={copyingId === router.id}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium ${
                              copyingId === router.id
                                ? 'bg-green-500 text-white scale-105 col-span-2'
                                : 'bg-white/10 text-gray-300 hover:bg-[#d97706] hover:text-white'
                            }`}
                          >
                            {copyingId === router.id ? 'Commande copiée !' : 'Copier commande'}
                          </button>
                        ) : (
                          <div className="col-span-2 py-2.5 bg-white/5 text-gray-500 rounded-xl text-sm text-center">
                            Non configuré
                          </div>
                        )}
                        
                        {(!router.config_token || copyingId !== router.id) && (
                          <Link
                            href={`/routers/${router.id}/profiles`}
                            className="flex items-center justify-center gap-2 py-2.5 bg-white/10 text-[#d97706] rounded-xl hover:bg-[#d97706] hover:text-white transition-all text-sm font-medium"
                          >
                            Forfaits
                          </Link>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link
                          href={`/routers/${router.id}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-white/10 text-gray-300 rounded-xl hover:border-[#d97706] hover:text-[#d97706] transition-all text-sm font-medium"
                        >
                          Modifier
                        </Link>
                        <button
                          onClick={() => handleDelete(router.id!)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-white/10 text-gray-300 rounded-xl hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1) translate(-50%, -50%); opacity: 1; }
          50% { transform: scale(1.1) translate(-45%, -45%); opacity: 0.9; }
        }
        @keyframes ripple {
          0% { width: 20px; height: 20px; opacity: 0.5; }
          100% { width: 80px; height: 80px; opacity: 0; }
        }
      `}</style>
    </Layout>
  );
}