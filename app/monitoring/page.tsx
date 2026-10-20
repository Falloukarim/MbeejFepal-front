'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import api from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import OfflineRoutersCard from '@/components/OfflineRoutersCard';
import type { Router } from '@/lib/api';

interface DashboardStats {
  routers: { total: number; online: number; active?: number };
  users: { total: number };
  sessions: { active: number };
  revenue: { today: number; month: number };
  payments: { failed_today: number };
  wallets: { total_balance: number };
  timestamp: string;
}

interface ActiveSession {
  id: number;
  router_id: number;
  router_name: string;
  profile: string;
  mac: string;
  created_at: string;
  expires_at: string;
  remaining: number;
}

interface RouterStatus extends Router {
  connection_status: 'online' | 'offline' | 'never_connected';
  status_display: string;
  active_sessions: number;
  total_sessions: number;
  today_revenue: number;
  admin_active: boolean;
}

interface RecentPayment {
  id: number;
  amount: number;
  status: string;
  provider: string;
  created_at: string;
  confirmed_at: string | null;
  user_email: string;
}

export default function MonitoringPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [routers, setRouters] = useState<RouterStatus[]>([]);
  const [payments, setPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsRes, sessionsRes, routersRes, paymentsRes] = await Promise.all([
        api.get('/monitoring/stats'),
        api.get('/monitoring/active-sessions'),
        api.get('/monitoring/routers'),
        api.get('/monitoring/recent-payments'),
      ]);

      setStats(statsRes.data);
      const now = new Date();
      const validSessions = (sessionsRes.data || []).filter((session: ActiveSession) => {
        const expiresAt = new Date(session.expires_at);
        return expiresAt > now && session.remaining > 0;
      });
      
      setActiveSessions(validSessions);      
      const typedRouters: RouterStatus[] = (routersRes.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        config_token: item.config_token || '',
        is_active: item.is_active ?? true,
        admin_active: item.is_active ?? true,
        last_seen: item.last_seen || null,
        created_at: item.created_at || new Date().toISOString(),
        connection_status: item.connection_status || 'never_connected',
        status_display: item.status_display || 
          (item.connection_status === 'online' ? 'En ligne' : 
          item.connection_status === 'offline' ? 'Hors ligne' : 'Jamais connecté'),
        active_sessions: item.active_sessions || 0,
        total_sessions: item.total_sessions || 0,
        today_revenue: item.today_revenue || 0
      }));
      
      setRouters(typedRouters);
      setPayments(paymentsRes.data || []);
      setLastUpdate(new Date());
    } catch (error) {
      toast.error('Erreur lors du rafraîchissement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'PENDING': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'FAILED': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRouterStatusStyle = (router: RouterStatus) => {
    switch (router.connection_status) {
      case 'online': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'offline': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getRouterStatusText = (router: RouterStatus) => {
    switch (router.connection_status) {
      case 'online': return 'En ligne';
      case 'offline': return 'Hors ligne';
      default: return 'Jamais connecté';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Monitoring Global</h1>
        <p className="text-gray-600 mt-2">
          Dernière mise à jour : {format(lastUpdate, 'dd MMMM yyyy à HH:mm:ss', { locale: fr })}
          <button onClick={fetchAllData} className="ml-4 text-amber-600 hover:text-amber-700 text-sm">
            ↻ Rafraîchir
          </button>
        </p>
      </div>

      {/* Cartes Stats (Style Wallet) */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 shadow-xl border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📡</span>
                <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">Routeurs</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stats.routers.online} <span className="text-gray-500 text-xl">/ {stats.routers.total}</span></p>
              <p className="text-sm text-gray-400 mt-1">en ligne</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 shadow-xl border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">👤</span>
                <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">Utilisateurs</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{formatNumber(stats.users.total)}</p>
              <p className="text-sm text-gray-400 mt-1">inscrits</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 shadow-xl border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🕒</span>
                <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">Sessions</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{formatNumber(stats.sessions.active)}</p>
              <p className="text-sm text-gray-400 mt-1">en cours</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 shadow-xl border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">💰</span>
                <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">Revenus</span>
              </div>
              <p className="text-2xl font-extrabold text-amber-500">{formatCurrency(stats.revenue.today)}</p>
              <p className="text-sm text-gray-400 mt-1">ce mois: {formatCurrency(stats.revenue.month)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tableaux en mode sombre */}
      <div className="space-y-8">
        {/* Sessions actives */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl border border-white/10">
          <div className="relative z-10 px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">🕒</span> Sessions en cours ({activeSessions.length})
            </h2>
          </div>
          {activeSessions.length > 0 ? (
            <div className="relative z-10 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Routeur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">MAC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Expire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Restant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">#{session.id}</td>
                      <td className="px-6 py-4 text-gray-300">{session.router_name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-300">{session.mac}</td>
                      <td className="px-6 py-4 text-gray-300">{format(new Date(session.expires_at), 'dd/MM HH:mm')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          session.remaining < 5 ? 'bg-red-500/20 text-red-400' :
                          session.remaining < 15 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {Math.round(session.remaining)} min
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="relative z-10 px-6 py-12 text-center text-gray-500">Aucune session active</div>
          )}
        </div>

        {/* Paiements récents */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl border border-white/10">
          <div className="relative z-10 px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">💸</span> Derniers paiements
            </h2>
          </div>
          <div className="relative z-10 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">#{payment.id}</td>
                    <td className="px-6 py-4 text-gray-300">{payment.user_email}</td>
                    <td className="px-6 py-4 font-bold text-amber-500">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{format(new Date(payment.created_at), 'dd/MM HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}