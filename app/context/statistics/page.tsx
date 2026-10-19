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
    { title: "Revenus (Auj.)", value: `${overview?.stats?.revenue_today?.toLocaleString() || 0} FCFA`, icon: <DollarSign className="w-6 h-6 text-green-600" />, bg: "bg-green-100" },
    { title: "Revenus (Mois)", value: `${overview?.stats?.revenue_month?.toLocaleString() || 0} FCFA`, icon: <TrendingUp className="w-6 h-6 text-blue-600" />, bg: "bg-blue-100" },
    { title: "Sessions Actives", value: overview?.stats?.active_sessions || 0, icon: <Clock className="w-6 h-6 text-amber-600" />, bg: "bg-amber-100" },
    { title: "Clients Uniques (Auj.)", value: overview?.stats?.unique_clients_today || 0, icon: <Users className="w-6 h-6 text-purple-600" />, bg: "bg-purple-100" },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques détaillées</h1>
        <p className="text-gray-600 mt-2">Analysez les performances de votre réseau en temps réel</p>
      </div>

      {/* 1. Cartes de résumé (KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Graphique d'évolution des revenus */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-[#d97706]" />
          <h2 className="text-xl font-bold text-gray-900">Évolution des revenus (7 derniers jours)</h2>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${val} F`} />
              <Tooltip cursor={{ fill: '#fef3c7' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${value} FCFA`, 'Revenus']} />
              <Bar dataKey="revenue" fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3. Performance par Routeur */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">Performance par Routeur</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">
                  <th className="py-3 font-semibold">Routeur</th>
                  <th className="py-3 text-center font-semibold">Ventes</th>
                  <th className="py-3 text-right font-semibold">Revenus</th>
                </tr>
              </thead>
              <tbody>
                {routerData.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-medium text-gray-800">{r.router_name}</td>
                    <td className="py-4 text-center text-gray-600 bg-gray-50 rounded">{r.sales_count}</td>
                    <td className="py-4 text-right font-bold text-green-600">{r.total_revenue.toLocaleString()} F</td>
                  </tr>
                ))}
                {routerData.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-gray-500">Aucun routeur actif.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Performance par Forfait */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-900">Performance par Forfait</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">
                  <th className="py-3 font-semibold">Forfait</th>
                  <th className="py-3 text-center font-semibold">Ventes</th>
                  <th className="py-3 text-right font-semibold">Revenus</th>
                </tr>
              </thead>
              <tbody>
                {profileData.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-medium text-gray-800">{p.profile_name}</td>
                    <td className="py-4 text-center text-gray-600 bg-gray-50 rounded">{p.sales_count}</td>
                    <td className="py-4 text-right font-bold text-purple-600">{p.total_revenue.toLocaleString()} F</td>
                  </tr>
                ))}
                {profileData.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-gray-500">Aucun forfait vendu.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}