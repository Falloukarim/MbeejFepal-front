'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getRouters, deleteRouter, type Router } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Wifi, 
  Plus, 
  Copy, 
  Check, 
  Edit, 
  Trash2, 
  ArrowRight,
  MoreVertical,
  Tag
} from 'lucide-react';

export default function RoutersPage() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<number | null>(null);

  useEffect(() => {
    loadRouters();
  }, []);

  const loadRouters = async () => {
    try {
      const data = await getRouters();
      
      const transformedRouters: Router[] = (data as any[]).map((item) => {
        const isOnline = item.WgConnected === true || item.wg_connected === true;
        
        let connectionStatus: 'online' | 'offline' | 'never_connected' = 'never_connected';
        let statusDisplay = 'Jamais connecté';
        
        if (isOnline) {
          connectionStatus = 'online';
          statusDisplay = 'En ligne';
        } else if (item.WgPublicKey || item.wg_public_key || item.LastSeen) {
          connectionStatus = 'offline';
          statusDisplay = 'Hors ligne';
        }

        return {
          id: item.ID || item.id,
          user_id: item.UserID || item.user_id,
          router_uuid: item.RouterUUID || item.router_uuid,
          zone_id: item.ZoneID || item.zone_id,
          name: item.Name || item.name,
          config_token: item.ConfigToken || item.config_token,
          is_active: item.IsActive ?? item.is_active,
          last_seen: item.LastSeen || item.last_seen,
          created_at: item.CreatedAt || item.created_at,
          connection_status: connectionStatus,
          status_display: statusDisplay
        };
      }).filter(router => router.id);

      setRouters(transformedRouters);
    } catch (error) {
      toast.error('Erreur lors du chargement des routeurs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce routeur ? Cette action est irréversible.')) return;
    
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
        toast.success('Commande copiée !', { icon: '📋' });
      }, 500);
    } catch {
      setCopyingId(null);
      toast.error('Erreur lors de la copie');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Jamais';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Date invalide'; }
  };

  const getStatusBadge = (router: Router) => {
    if (router.connection_status === 'online') {
      return { color: 'bg-green-500/10 text-green-400 border-green-500/20', dot: 'bg-green-500 animate-pulse' };
    } else if (router.connection_status === 'offline') {
      return { color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-500' };
    } else {
      return { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', dot: 'bg-amber-500' };
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

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* En-tête corrigé */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-amber-500 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm mb-3">
              <Wifi className="w-4 h-4" />
              GESTION DES ROUTEURS
            </div>
            <h1 className="text-3xl font-bold text-white">Routeurs MikroTik</h1>
            <p className="text-gray-300 mt-2">Gérez vos points d'accès et leur configuration</p>
          </div>
          
          <Link
            href="/routers/new"
            className="group relative overflow-hidden bg-[#d97706] text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-[#b45309] hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Nouveau routeur
          </Link>
        </div>

        {routers.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-xl p-12 text-center border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <Wifi className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Aucun routeur configuré</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Commencez par ajouter votre premier routeur MikroTik pour gérer vos points d'accès Wi-Fi.
              </p>
              <Link href="/routers/new" className="inline-flex items-center gap-2 bg-[#d97706] text-white font-semibold py-3 px-8 rounded-xl hover:bg-[#b45309] transition-all">
                <Plus className="w-5 h-5" />
                Ajouter un routeur
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* VUE DESKTOP (TABLEAU) */}
            <div className="hidden lg:block overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-5">Routeur</th>
                    <th className="px-6 py-5">Statut</th>
                    <th className="px-6 py-5">Dernière connexion</th>
                    <th className="px-6 py-5 text-center">Configuration</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {routers.map((router) => {
                    const status = getStatusBadge(router);
                    return (
                      <tr key={router.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${router.connection_status === 'online' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                              <Wifi className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-white">{router.name || 'Routeur sans nom'}</div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {router.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white/5 border-white/10">
                            <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                            <span className={`text-xs font-medium ${status.color.split(' ')[1]}`}>
                              {router.status_display}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatDate(router.last_seen)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {router.config_token ? (
                            <button
                              onClick={() => copyCommand(router.id!, router.config_token!)}
                              disabled={copyingId === router.id}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${
                                copyingId === router.id
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {copyingId === router.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              {copyingId === router.id ? 'Copié !' : 'Commande'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-600">Non configuré</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/routers/${router.id}/profiles`} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all" title="Gérer les forfaits">
                              <Tag className="w-4 h-4" />
                            </Link>
                            <Link href={`/routers/${router.id}`} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button onClick={() => handleDelete(router.id!)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* VUE MOBILE (CARTES) - Standard Application Mobile */}
            <div className="lg:hidden flex flex-col divide-y divide-white/5 relative z-10">
              {routers.map((router) => {
                const status = getStatusBadge(router);
                return (
                  <div key={router.id} className="p-5 hover:bg-white/5 transition-colors">
                    {/* Ligne 1 : Nom & Statut */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${router.connection_status === 'online' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                          <Wifi className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-base">{router.name || 'Sans nom'}</h3>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {router.id}</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-white/5 border-white/10">
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                        <span className={`text-[10px] uppercase tracking-wide font-bold ${status.color.split(' ')[1]}`}>
                          {router.connection_status === 'online' ? 'En ligne' : router.connection_status === 'offline' ? 'Hors ligne' : 'Jamais'}
                        </span>
                      </div>
                    </div>

                    {/* Ligne 2 : Info & Actions Rapides */}
                    <div className="space-y-3 bg-white/5 rounded-xl p-3 border border-white/5 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Dernière vue</span>
                        <span className="text-gray-200 font-medium">{formatDate(router.last_seen)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Configuration</span>
                        {router.config_token ? (
                          <button
                            onClick={() => copyCommand(router.id!, router.config_token!)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              copyingId === router.id ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {copyingId === router.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copyingId === router.id ? 'Copié' : 'Copier'}
                          </button>
                        ) : (
                          <span className="text-gray-500 text-xs italic">Non configuré</span>
                        )}
                      </div>
                    </div>

                    {/* Ligne 3 : Actions Principales */}
                    <div className="flex gap-2">
                      <Link 
                        href={`/routers/${router.id}/profiles`} 
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 text-sm font-medium transition-colors border border-white/5"
                      >
                        <Tag className="w-4 h-4" /> Forfaits
                      </Link>
                      <Link 
                        href={`/routers/${router.id}`} 
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 text-sm font-medium transition-colors border border-white/5"
                      >
                        <Edit className="w-4 h-4" /> Modifier
                      </Link>
                      <button 
                        onClick={() => handleDelete(router.id!)} 
                        className="w-12 flex items-center justify-center bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        )}
      </div>
    </Layout>
  );
}