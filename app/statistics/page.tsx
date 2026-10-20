'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getOwnerStats, getStatsChart, getRouterStats, getProfileStats, type DashboardStatsResponse } from '@/lib/api';
import toast from 'react-hot-toast';
import { TrendingUp, Users, Clock, DollarSign, Trophy, Server, Tag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardStatsResponse | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [routerData, setRouterData] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [overviewRes, chartRes, routerRes, profileRes] = await Promise.all([
          getOwnerStats().catch(() => null),
          getStatsChart().catch(() => []),
          getRouterStats().catch(() => []),
          getProfileStats().catch(() => [])
        ]);

        if (overviewRes) setOverview(overviewRes);
        if (chartRes) setChartData(chartRes);
        if (routerRes) setRouterData(routerRes);
        if (profileRes) setProfileData(profileRes);
      } catch (error) {
        toast.error('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </Layout>
    );
  }

  const kpiCards = [
    { title: "Revenus (Auj.)", value: `${overview?.stats?.revenue_today?.toLocaleString() || 0} FCFA`, icon: <DollarSign className="w-6 h-6 text-amber-500" /> },
    { title: "Revenus (Mois)", value: `${overview?.stats?.revenue_month?.toLocaleString() || 0} FCFA`, icon: <TrendingUp className="w-6 h-6 text-amber-500" /> },
    { title: "Sessions Actives", value: overview?.stats?.active_sessions || 0, icon: <Clock className="w-6 h-6 text-amber-500" /> },
    { title: "Clients Uniques (Auj.)", value: overview?.stats?.unique_clients_today || 0, icon: <Users className="w-6 h-6 text-amber-500" /> },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques détaillées</h1>
        <p className="text-gray-600 mt-2">Analysez les performances de votre réseau en temps réel</p>
      </div>

      {/* 1. Cartes de résumé (KPI) - Style Wallet */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, i) => (
          <div key={i} className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">{card.title}</p>
                <p className="text-2xl font-extrabold text-amber-500">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Graphique d'évolution des revenus - Fond sombre */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl p-6 mb-8 border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-white">Évolution des revenus (7 derniers jours)</h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} tickFormatter={(val) => `${val} F`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} 
                  formatter={(value) => [`${value} FCFA`, 'Revenus']} 
                />
                <Bar dataKey="revenue" fill="#d97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3. Performance par Routeur - Style Sombre */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl p-6 border border-white/5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Server className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-bold text-white">Performance par Routeur</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-sm text-gray-400">
                    <th className="py-3 font-semibold">Routeur</th>
                    <th className="py-3 text-center font-semibold">Ventes</th>
                    <th className="py-3 text-right font-semibold">Revenus</th>
                  </tr>
                </thead>
                <tbody>
                  {routerData.map((r, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 font-medium text-white">{r.router_name}</td>
                      <td className="py-4 text-center text-gray-300">
                        <span className="bg-white/5 px-3 py-1 rounded-lg">{r.sales_count}</span>
                      </td>
                      <td className="py-4 text-right font-bold text-amber-500">{r.total_revenue.toLocaleString()} F</td>
                    </tr>
                  ))}
                  {routerData.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-gray-500">Aucun routeur actif.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. Performance par Forfait - Style Sombre */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl p-6 border border-white/5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Tag className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-bold text-white">Performance par Forfait</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-sm text-gray-400">
                    <th className="py-3 font-semibold">Forfait</th>
                    <th className="py-3 text-center font-semibold">Ventes</th>
                    <th className="py-3 text-right font-semibold">Revenus</th>
                  </tr>
                </thead>
                <tbody>
                  {profileData.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 font-medium text-white">{p.profile_name}</td>
                      <td className="py-4 text-center text-gray-300">
                        <span className="bg-white/5 px-3 py-1 rounded-lg">{p.sales_count}</span>
                      </td>
                      <td className="py-4 text-right font-bold text-amber-500">{p.total_revenue.toLocaleString()} F</td>
                    </tr>
                  ))}
                  {profileData.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-gray-500">Aucun forfait vendu.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}