'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getMySessions, getRouters, getProfiles, type Router, type HotspotProfile } from '@/lib/api';
import toast from 'react-hot-toast';

interface Session {
  id: number;
  zone_code: string | null;
  users_id: string;
  router_id: number;
  hotspot_id: number;
  mac_address: string;
  ip_address: string | null;
  state: string;
  created_at: string;
  expires_at: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [routers, setRouters] = useState<Record<number, string>>({});
  const [profiles, setProfiles] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Charger les sessions et les routeurs
        const [sessionsData, routersData] = await Promise.all([
          getMySessions(),
          getRouters().catch(() => []),
        ]);

        // 2. Créer la map des routeurs
        const routerMap: Record<number, string> = {};
        (routersData as any[]).forEach((r) => {
          const id = r.ID || r.id;
          if (id) routerMap[id] = r.Name || r.name || `Routeur #${id}`;
        });
        setRouters(routerMap);

        // 3. Adapter les sessions
        const adaptedSessions = (sessionsData as any[])
          .map((item: any) => ({
            id: item.ID || item.id,
            zone_code: item.ZoneCode || null,
            users_id: item.UsersID || item.UserID,
            router_id: item.RouterID,
            hotspot_id: item.HotspotID,
            mac_address: item.MacAddress,
            ip_address: item.IpAddress || null,
            state: item.State || 'CREATED',
            created_at: item.CreatedAt,
            expires_at: item.ExpiresAt,
          }))
          .filter((session) => session.id);
        
        setSessions(adaptedSessions || []);

        // 4. Charger les profils routeur par routeur (public)
        const uniqueRouterIds = [...new Set(adaptedSessions.map((s: any) => s.router_id))];
        const profileMap: Record<number, string> = {};
        
        await Promise.all(
          uniqueRouterIds.map(async (routerId) => {
            try {
              const profiles = await getProfiles(routerId);
              (profiles as any[]).forEach((p) => {
                const id = p.ID || p.id;
                if (id) profileMap[id] = p.ProfileName || p.profile_name || `Forfait #${id}`;
              });
            } catch (e) {
              // On ignore si un routeur n'a pas de profils
            }
          })
        );
        setProfiles(profileMap);

      } catch (error) {
        toast.error('Erreur lors du chargement des sessions');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Le [] signifie "exécuter une seule fois au montage"

  const formatDate = (dateString: string | null | undefined, format: 'full' | 'short' | 'time' = 'full') => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      switch (format) {
        case 'short':
          return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        case 'time':
          return date.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        default:
          return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    } catch {
      return 'Date invalide';
    }
  };

  // Convertir les minutes en "Xh Ym"
  const formatRemainingTime = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return 'Inconnu';
    try {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) return 'Inconnu';
      
      const now = new Date();
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      
      if (diffMin <= 0) return 'Expiré';
      if (diffMin < 60) return `${diffMin} min`;

      const hours = Math.floor(diffMin / 60);
      const minutes = diffMin % 60;

      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
    } catch {
      return 'Inconnu';
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'ACTIVE':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Active</span>;
      case 'CREATED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Créée</span>;
      case 'EXPIRED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">Expirée</span>;
      case 'TERMINATED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Terminée</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">{state}</span>;
    }
  };

  const formatUserId = (userId: string) => {
    if (!userId) return '-';
    return userId.substring(0, 6) + '...';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="relative w-20 h-20">
            <i className="bi bi-wifi text-5xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#d97706] animate-[pulse_2s_ease-in-out_infinite]"></i>
            <div className="absolute inset-0 border-2 border-[#d97706] rounded-full animate-[ripple_1.5s_linear_infinite]"></div>
            <div className="absolute inset-0 border-2 border-[#d97706] rounded-full animate-[ripple_1.5s_linear_infinite_0.5s]"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 50%, #fde68a 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 0% 0%, rgba(217,119,6,0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(217,119,6,0.08) 0%, transparent 50%)' }} />
      </div>

      <div className="relative z-10">
        <div className="mb-8 animate-[slideUp_0.5s_ease-out]">
          <div className="inline-block bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
            <i className="bi bi-star-fill mr-1"></i> SESSIONS
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Historique des sessions</h1>
          <p className="text-gray-600 mt-2">Consultez toutes vos connexions</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl overflow-hidden relative animate-[slideUp_0.6s_ease-out]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10 px-6 py-5 border-b border-white/10 bg-white/5">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <i className="bi bi-clock-history text-[#d97706]"></i>
              Liste des sessions
            </h2>
          </div>

          {sessions.length > 0 ? (
            <div className="relative z-10 divide-y divide-white/10">
              {sessions.map((session, index) => (
                <div 
                  key={session.id} 
                  className="px-6 py-5 hover:bg-white/5 transition-colors animate-[slideUp_0.5s_ease-out]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#d97706] rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0 shadow-lg">
                          <i className="bi bi-wifi"></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-medium text-white">Session #{session.id}</p>
                            {getStateBadge(session.state)}
                            <span className="text-xs text-gray-400">{formatDate(session.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                          <i className="bi bi-person text-[#d97706] text-xs"></i>
                          <span className="text-gray-400 text-xs">Client:</span>
                          <span className="text-white font-mono text-xs" title={session.users_id}>
                            {formatUserId(session.users_id)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                          <i className="bi bi-router text-[#d97706] text-xs"></i>
                          <span className="text-gray-400 text-xs">Routeur:</span>
                          <span className="text-white text-xs font-medium">
                            {routers[session.router_id] || `#${session.router_id}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                          <i className="bi bi-tag text-[#d97706] text-xs"></i>
                          <span className="text-gray-400 text-xs">Forfait:</span>
                          <span className="text-white text-xs font-medium">
                            {profiles[session.hotspot_id] || `#${session.hotspot_id}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                          <i className="bi bi-hash text-[#d97706] text-xs"></i>
                          <span className="text-gray-400 text-xs">MAC:</span>
                          <span className="text-white font-mono text-xs">{session.mac_address}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <i className="bi bi-calendar-plus"></i>
                          <span>Création: {formatDate(session.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <i className="bi bi-calendar-x"></i>
                          <span>Expiration: {formatDate(session.expires_at)}</span>
                        </div>
                      </div>
                    </div>

                    {session.state === 'ACTIVE' && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-[#d97706]/20 rounded-xl border border-[#d97706]/30 lg:self-center">
                        <i className="bi bi-hourglass-split text-[#d97706] animate-spin"></i>
                        <span className="text-sm text-[#d97706] font-bold whitespace-nowrap">
                          {formatRemainingTime(session.expires_at)} restantes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative z-10 px-6 py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <i className="bi bi-clock-history text-5xl text-[#d97706] opacity-50"></i>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Aucune session pour le moment</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Les sessions apparaîtront ici lorsque des clients se connecteront à vos hotspots
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-gray-500 text-xs">
          <i className="bi bi-c-circle me-1"></i>
          2026 MbeejFepal. Tous droits réservés.
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1) translate(-50%, -50%); opacity: 1; } 50% { transform: scale(1.1) translate(-45%, -45%); opacity: 0.9; } }
        @keyframes ripple { 0% { width: 20px; height: 20px; opacity: 0.5; } 100% { width: 80px; height: 80px; opacity: 0; } }
      `}</style>
    </Layout>
  );
}