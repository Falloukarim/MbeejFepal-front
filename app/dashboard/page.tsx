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
  Wifi,
  WifiOff,
  ChevronRight,
  Smartphone,
  Plus,
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
  const [admin, setAdmin] = useState(false);

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
          setAdmin(true);
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
    if (router.connection_status === 'online') return { text: 'En ligne', color: 'bg-green-500 animate-pulse', textColor: 'text-green-400', tile: 'bg-green-500/10 border-green-500/20 text-green-400' };
    if (router.connection_status === 'offline') return { text: 'Hors ligne', color: 'bg-red-500', textColor: 'text-red-400', tile: 'bg-red-500/10 border-red-500/20 text-red-400' };
    return { text: 'Jamais connecté', color: 'bg-amber-500', textColor: 'text-amber-400', tile: 'bg-white/5 border-white/10 text-gray-400' };
  };

  // "Expire dans 2 h 15", "Expire dans 12 min"
  const expiresIn = (iso: string | undefined) => {
    if (!iso) return '';
    const ms = new Date(iso).getTime() - Date.now();
    if (Number.isNaN(ms) || ms <= 0) return 'Expirée';
    const min = Math.floor(ms / 60000);
    if (min < 60) return `Expire dans ${Math.max(1, min)} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Expire dans ${h} h${min % 60 ? ` ${String(min % 60).padStart(2, '0')}` : ''}`;
    return `Expire dans ${Math.floor(h / 24)} j`;
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

  const onlineCount = routers.filter((r) => r.connection_status === 'online').length;
  const activeSessions = sessions.filter((s) => s.state === 'ACTIVE');
  const currency = wallet?.currency || 'XOF';

  const quickActions = [
    { href: '/routers/new', label: 'Routeur', hint: 'Ajouter', icon: RouterIcon },
    { href: '/profiles/new', label: 'Forfait', hint: 'Créer', icon: Tag },
    { href: '/wallet', label: 'Wallet', hint: 'Revenus', icon: WalletIcon },
  ];

  return (
    <Layout>
      <style>{`
        @keyframes db-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .db-rise { animation: db-rise .45s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-4 pb-10">
        {/* En-tête */}
        <header className="mb-5">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-amber-500 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider mb-3">
            <Activity className="w-3.5 h-3.5" /> TABLEAU DE BORD
          </div>
        </header>

        {/* Carte solde */}
        <Link
          href="/wallet"
          className="db-rise group relative block overflow-hidden rounded-[32px] p-6 border border-amber-500/30 bg-gradient-to-br from-amber-500/25 via-gray-900 to-black shadow-2xl transition-all active:scale-[0.99]"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <p className="text-[11px] uppercase tracking-widest text-gray-300 font-bold">Solde disponible</p>
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 text-amber-400 flex items-center justify-center">
              <WalletIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="relative mt-2 flex items-end gap-2">
            <span className="text-5xl font-black tracking-tight text-white tabular-nums">{(wallet?.balance ?? 0).toLocaleString()}</span>
            <span className="pb-1.5 text-lg font-semibold text-amber-300">{currency}</span>
          </div>
          <div className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-amber-400">
            Voir mon portefeuille <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Statistiques */}
        <div className={`grid gap-3 mt-3 ${admin ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <div className="db-rise rounded-[24px] bg-white/5 border border-white/10 p-4" style={{ animationDelay: '60ms' }}>
            <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mb-2">
              <Wifi className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-white tabular-nums leading-none">
              {onlineCount}<span className="text-sm font-bold text-gray-500"> / {routers.length}</span>
            </p>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mt-1.5">Routeurs en ligne</p>
          </div>
          <div className="db-rise rounded-[24px] bg-white/5 border border-white/10 p-4" style={{ animationDelay: '110ms' }}>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
              <Smartphone className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-white tabular-nums leading-none">{activeSessions.length}</p>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mt-1.5">Sessions actives</p>
          </div>
          {admin && (
            <div className="db-rise rounded-[24px] bg-white/5 border border-white/10 p-4" style={{ animationDelay: '160ms' }}>
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-300 flex items-center justify-center mb-2">
                <Tag className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-white tabular-nums leading-none">{profiles.length}</p>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mt-1.5">Forfaits</p>
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <h2 className="mt-7 mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">Actions rapides</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="db-rise group flex flex-col items-center text-center rounded-[24px] bg-gradient-to-br from-gray-900 to-black border border-white/10 p-4 transition-all active:scale-95 hover:border-amber-500/40"
                style={{ animationDelay: `${200 + i * 50}ms` }}
              >
                <div className="relative w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-2.5">
                  <Icon className="w-6 h-6" />
                  {i < 2 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center">
                      <Plus className="w-3 h-3" strokeWidth={3.5} />
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-white leading-tight">{a.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{a.hint}</p>
              </Link>
            );
          })}
        </div>

        {/* Routeurs récents */}
        <section className="mt-7">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <RouterIcon className="w-5 h-5 text-amber-500" /> Routeurs récents
            </h2>
            <Link href="/routers" className="text-amber-500 text-sm font-bold flex items-center gap-1 active:opacity-70">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {routers.length === 0 ? (
            <div className="text-center py-10 rounded-[28px] bg-white/5 border border-white/10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <RouterIcon className="w-7 h-7" />
              </div>
              <p className="font-bold text-white">Aucun routeur configuré</p>
              <Link href="/routers/new" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-amber-500">
                <Plus className="w-4 h-4" /> Ajouter un routeur
              </Link>
            </div>
          ) : (
            <div className="rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 overflow-hidden divide-y divide-white/5 shadow-xl">
              {routers.slice(0, 5).map((router) => {
                if (!router?.id) return null;
                const status = getRouterStatus(router);
                return (
                  <Link
                    key={router.id}
                    href={`/routers/${router.id}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 active:bg-white/5 hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-11 h-11 shrink-0 rounded-2xl border flex items-center justify-center ${status.tile}`}>
                      {router.connection_status === 'offline' ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{router.name}</p>
                      <p className="text-xs flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${status.color}`}></span>
                        <span className={status.textColor}>{status.text}</span>
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Sessions actives */}
        <section className="mt-7">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Sessions actives
            </h2>
            <Link href="/sessions" className="text-amber-500 text-sm font-bold flex items-center gap-1 active:opacity-70">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {activeSessions.length === 0 ? (
            <div className="text-center py-10 rounded-[28px] bg-white/5 border border-white/10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/5 text-gray-500 flex items-center justify-center">
                <Activity className="w-7 h-7" />
              </div>
              <p className="font-bold text-white">Aucune session active</p>
              <p className="text-sm text-gray-400 mt-1">Les appareils connectés apparaîtront ici.</p>
            </div>
          ) : (
            <div className="rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 overflow-hidden divide-y divide-white/5 shadow-xl">
              {activeSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="w-11 h-11 shrink-0 rounded-2xl bg-white/5 border border-white/10 text-gray-300 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">Appareil connecté</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      <span className="font-mono">{session.mac_address || 'MAC inconnue'}</span>
                      {session.expires_at && <span className="text-gray-500"> · {expiresIn(session.expires_at)}</span>}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-extrabold tracking-wider rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> ACTIVE
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-10 text-center text-gray-600 text-xs">
          © 2026 MbeejFepal. Tous droits réservés.
        </div>
      </div>
    </Layout>
  );
}