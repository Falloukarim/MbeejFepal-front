'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  getRouters, 
  getProfiles, 
  getWallet, 
  getMySessions, 
  type Router, 
  type HotspotProfile, 
  type Wallet, 
  type Session 
} from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { 
  Router as RouterIcon, 
  Tag, 
  Wallet as WalletIcon, 
  Activity, 
  Clock, 
  ArrowRight,
  Wifi
} from 'lucide-react';

interface RouterWithStatus extends Router {
  connection_status?: 'online' | 'offline' | 'never_connected';
  status_display?: string;
}

export default function DashboardPage() {
  const [routers, setRouters] = useState<RouterWithStatus[]>([]);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Charger les routeurs
        const routersData = await getRouters();
        const adaptedRouters = (routersData as any[])
          .map((item) => {
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
              name: item.Name || item.name,
              config_token: item.ConfigToken || item.config_token || '',
              is_active: item.IsActive ?? item.is_active ?? true,
              last_seen: item.LastSeen || item.last_seen,
              created_at: item.CreatedAt || item.created_at,
              connection_status: connectionStatus,
              status_display: statusDisplay
            };
          })
          .filter(router => router.id);

        setRouters(adaptedRouters);

        // 2. Charger les profils (admin uniquement)
        if (isAdmin()) {
          try {
            const profilesData = await getProfiles();
            const adaptedProfiles: HotspotProfile[] = (profilesData as any[])
              .map((item: any): HotspotProfile => ({
                id: item.id ?? item.ID,
                router_id: item.router_id ?? item.RouterID,
                profile_name: item.profile_name ?? item.ProfileName ?? 'Sans nom',
                duration_minutes: item.duration_minutes ?? item.DurationMinutes ?? 0,
                price: item.price ?? item.Price ?? 0,
                currency: item.currency ?? item.Currency ?? 'XOF',
                bandwidth_limit: item.bandwidth_limit ?? item.BandwidthLimit,
                max_devices: item.max_devices ?? item.MaxDevices ?? 1,
                is_active: item.is_active ?? item.IsActive ?? false,
                created_at: item.created_at ?? item.CreatedAt,
                updated_at: item.updated_at ?? item.UpdatedAt,
              }))
              .filter((profile) => profile.id);
            setProfiles(adaptedProfiles);
          } catch (error) {
            console.error('❌ Erreur chargement profils admin:', error);
          }
        }
        
        // 3. Charger Wallet et Sessions
        const [walletData, sessionsData] = await Promise.all([
          getWallet().catch(() => null),
          getMySessions().catch(() => []),
        ]);
        
        if (walletData) {
          const rawWallet = walletData as any;
          setWallet({
            id: rawWallet.ID || rawWallet.id,
            user_id: rawWallet.UserID || rawWallet.user_id,
            balance: rawWallet.Balance ?? rawWallet.balance,
            currency: rawWallet.Currency || rawWallet.currency,
            created_at: rawWallet.CreatedAt || rawWallet.created_at,
            updated_at: rawWallet.UpdatedAt || rawWallet.updated_at
          });
        }
        
        if (sessionsData && sessionsData.length > 0) {
          const adaptedSessions = (sessionsData as any[])
            .map((item: any) => ({
              id: item.id || item.ID,
              zone_code: item.zone_code || item.ZoneCode,
              users_id: item.users_id || item.UsersID,
              router_id: item.router_id || item.RouterID,
              hotspot_id: item.hotspot_id || item.HotspotID,
              mac_address: item.mac_address || item.MacAddress,
              ip_address: item.ip_address || item.IpAddress,
              state: item.state || item.State || 'CREATED',
              created_at: item.created_at || item.CreatedAt,
              expires_at: item.expires_at || item.ExpiresAt
            }))
            .filter(session => {
              if (session.state !== 'ACTIVE') return false;
              return new Date(session.expires_at) > new Date();
            });
          setSessions(adaptedSessions);
        }
        
      } catch (error) {
        console.error('❌ Erreur chargement données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getRouterStatus = (router: RouterWithStatus) => {
    if (router.connection_status === 'online') return { text: 'En ligne', color: 'bg-green-500', textColor: 'text-green-400' };
    if (router.connection_status === 'offline') return { text: 'Hors ligne', color: 'bg-red-500', textColor: 'text-red-400' };
    return { text: 'Jamais connecté', color: 'bg-amber-500', textColor: 'text-amber-400' };
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
      <div className="relative z-10 max-w-6xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-8">
          <div className="inline-block bg-white/5 border border-white/10 text-amber-500 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
            <Activity className="w-3 h-3 inline mr-1" /> Tableau de bord
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/routers/new" className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-xl p-6 border border-white/10 hover:border-amber-500/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 mb-4">
                <RouterIcon className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Ajouter un routeur</h3>
              <p className="text-gray-400 text-sm">Configurez un nouveau point d'accès</p>
            </div>
          </Link>

          <Link href="/profiles/new" className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-xl p-6 border border-white/10 hover:border-amber-500/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 mb-4">
                <Tag className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Créer un forfait</h3>
              <p className="text-gray-400 text-sm">Définissez une nouvelle offre</p>
            </div>
          </Link>

          <Link href="/wallet" className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-xl p-6 border border-white/10 hover:border-amber-500/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 mb-4">
                <WalletIcon className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Mon portefeuille</h3>
              <p className="text-gray-400 text-sm">Consultez vos revenus</p>
            </div>
          </Link>
        </div>

        {/* Routeurs & Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Carte Routeurs */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl border border-white/10 flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <RouterIcon className="w-5 h-5 text-amber-500" /> Routeurs récents
                </h2>
                <Link href="/routers" className="text-amber-500 hover:text-amber-400 text-sm font-medium flex items-center gap-1 transition-colors">
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="divide-y divide-white/5 flex-1">
                {routers.slice(0, 5).map((router) => {
                  if (!router?.id) return null;
                  const status = getRouterStatus(router);
                  return (
                    <div key={router.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${router.connection_status === 'online' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                          <Wifi className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-amber-400 transition-colors">{router.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                            <span className={`inline-block w-2 h-2 rounded-full ${status.color}`}></span>
                            <span className={status.textColor}>{status.text}</span>
                          </p>
                        </div>
                      </div>
                      <Link href={`/routers/${router.id}`} className="text-gray-500 hover:text-amber-500 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  );
                })}
                {routers.length === 0 && (
                  <div className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                    <RouterIcon className="w-8 h-8 mb-2 opacity-50" />
                    <p>Aucun routeur configuré.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Carte Sessions */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl border border-white/10 flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" /> Sessions actives
                </h2>
                <Link href="/sessions" className="text-amber-500 hover:text-amber-400 text-sm font-medium flex items-center gap-1 transition-colors">
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="divide-y divide-white/5 flex-1">
                {sessions.filter(s => s.state === 'ACTIVE').slice(0, 5).map((session) => (
                  <div key={session.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-gray-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Appareil connecté</p>
                        <p className="text-xs text-gray-400 mt-0.5">MAC: {session.mac_address || 'Inconnue'}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  </div>
                ))}
                {sessions.filter(s => s.state === 'ACTIVE').length === 0 && (
                  <div className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                    <p>Aucune session active.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 text-center text-gray-600 text-xs">
          © 2026 MbeejFepal. Tous droits réservés.
        </div>
      </div>
    </Layout>
  );
}