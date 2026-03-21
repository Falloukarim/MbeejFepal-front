'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import api from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import OfflineRoutersCard from '@/components/OfflineRoutersCard';

// Import des types depuis api.ts
import type { Router } from '@/lib/api';

interface DashboardStats {
  routers: { total: number; online: number; active?: number }; // ← Ajouter online
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

// Extension de l'interface Router pour les propriétés spécifiques au monitoring
interface RouterStatus extends Router {
  connection_status: 'online' | 'offline' | 'never_connected';
  status_display: string;
  active_sessions: number;
  total_sessions: number;
  today_revenue: number;
    admin_active: boolean; // Ajouté pour OfflineRoutersCard

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
    const interval = setInterval(fetchAllData, 30000); // Rafraîchir toutes les 30 secondes
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
      // Transformation typée sans as any
     const typedRouters: RouterStatus[] = (routersRes.data || []).map((item: any) => ({
  id: item.id,
  name: item.name,
  config_token: item.config_token || '',
  is_active: item.is_active ?? true,
  admin_active: item.is_active ?? true, // Ajouté
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
      console.error('Erreur chargement monitoring:', error);
      toast.error('Erreur lors du rafraîchissement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Fonction pour obtenir le style du statut du routeur
  const getRouterStatusStyle = (router: RouterStatus) => {
    switch (router.connection_status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRouterStatusText = (router: RouterStatus) => {
    switch (router.connection_status) {
      case 'online':
        return 'En ligne';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Jamais connecté';
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
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Monitoring</h1>
        <p className="text-gray-600 mt-2">
          Dernière mise à jour : {format(lastUpdate, 'dd MMMM yyyy à HH:mm:ss', { locale: fr })}
          <button
            onClick={fetchAllData}
            className="ml-4 text-amber-600 hover:text-amber-700 text-sm"
          >
            ↻ Rafraîchir
          </button>
        </p>
      </div>

      {/* Cartes de statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Routeurs */}
         {/* Routeurs */}
<div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 shadow-lg border border-amber-200">
  <div className="flex items-center justify-between mb-2">
    <span className="text-3xl">📡</span>
    <span className="text-xs text-amber-700 bg-amber-200 px-2 py-1 rounded-full">
      Routeurs
    </span>
  </div>
  <p className="text-2xl font-bold text-gray-900">
    {stats.routers.online} / {stats.routers.total}
  </p>
  <p className="text-sm text-gray-600 mt-1">en ligne / total</p> {/* ← Changé */}
  <div className="mt-3 h-1.5 bg-amber-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-amber-600 rounded-full"
      style={{ width: `${(stats.routers.online / stats.routers.total) * 100}%` }}
    />
  </div>
</div>

          {/* Utilisateurs */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">👤</span>
              <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                Utilisateurs
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.users.total)}</p>
            <p className="text-sm text-gray-600 mt-1">inscrits</p>
          </div>

          {/* Sessions actives */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">🕒</span>
              <span className="text-xs text-green-700 bg-green-200 px-2 py-1 rounded-full">
                Sessions
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.sessions.active)}</p>
            <p className="text-sm text-gray-600 mt-1">en cours</p>
          </div>

          {/* Revenus aujourd'hui */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">💰</span>
              <span className="text-xs text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
                Aujourd'hui
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue.today)}</p>
            <p className="text-sm text-gray-600 mt-1">/ {formatCurrency(stats.revenue.month)} ce mois</p>
          </div>

          {/* Paiements échoués */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">⚠️</span>
              <span className="text-xs text-red-700 bg-red-200 px-2 py-1 rounded-full">
                Échecs
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.payments.failed_today}</p>
            <p className="text-sm text-gray-600 mt-1">aujourd'hui</p>
          </div>

          {/* Total wallets */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 shadow-lg border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">💳</span>
              <span className="text-xs text-indigo-700 bg-indigo-200 px-2 py-1 rounded-full">
                Wallets
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.wallets.total_balance)}</p>
            <p className="text-sm text-gray-600 mt-1">solde total</p>
          </div>
        </div>
      )}

      {/* Sessions actives */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🕒</span>
            Sessions en cours ({activeSessions.length})
          </h2>
        </div>

        {activeSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Routeur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forfait</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MAC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créée le</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temps restant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">#{session.id}</td>
                    <td className="px-6 py-4">{session.router_name} (#{session.router_id})</td>
                    <td className="px-6 py-4">{session.profile || '-'}</td>
                    <td className="px-6 py-4 font-mono text-sm">{session.mac}</td>
                    <td className="px-6 py-4">{format(new Date(session.created_at), 'dd/MM HH:mm')}</td>
                    <td className="px-6 py-4">{format(new Date(session.expires_at), 'dd/MM HH:mm')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.remaining < 5 ? 'bg-red-100 text-red-800' :
                        session.remaining < 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
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
          <div className="px-6 py-12 text-center text-gray-500">
            <p>Aucune session active</p>
          </div>
        )}
      </div>

      {/* État des routeurs */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">📡</span>
            État des routeurs
          </h2>
        </div>

        {/* Composant des routeurs inactifs - Plus de as any ! */}
        <div className="px-6 py-4">
          <OfflineRoutersCard routers={routers} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Routeur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière vue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions actives</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions totales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenus aujourd'hui</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {routers.map((router) => (
                <tr key={router.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{router.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getRouterStatusStyle(router)}`}>
                      {getRouterStatusText(router)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {router.last_seen ? format(new Date(router.last_seen), 'dd/MM HH:mm') : 'Jamais'}
                  </td>
                  <td className="px-6 py-4 font-semibold">{router.active_sessions}</td>
                  <td className="px-6 py-4">{router.total_sessions}</td>
                  <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(router.today_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Derniers paiements */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">💸</span>
            Derniers paiements
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">#{payment.id}</td>
                  <td className="px-6 py-4">{payment.user_email}</td>
                  <td className="px-6 py-4 font-semibold">{formatCurrency(payment.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{payment.provider || '-'}</td>
                  <td className="px-6 py-4">{format(new Date(payment.created_at), 'dd/MM HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}