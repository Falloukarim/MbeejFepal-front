'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getFinancialOverview, type FinancialOverview } from '@/lib/api';
import toast from 'react-hot-toast';
import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, ShieldCheck, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminRevenuesPage() {
  const [data, setData] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinancialOverview()
      .then(res => setData(res))
      .catch(() => toast.error('Erreur chargement des données financières'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </Layout>
    );
  }

  // Préparation des données pour le graphique
  const chartData = [
    { name: 'Encaissé', montant: data.total_payin, fill: '#3b82f6' },
    { name: 'Dû aux WISP', montant: data.total_wisp_wallets, fill: '#f59e0b' },
    { name: 'Tes Commissions', montant: data.total_mbeej_revenue, fill: '#10b981' },
    { name: 'Déjà versé', montant: data.total_payouts_paid, fill: '#ef4444' },
  ];

  // Calcul de la trésorerie disponible (Ce qu'il te reste sur ton compte)
  const cashAvailable = data.total_payin - data.total_payouts_paid;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-10">
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> DASHBOARD FINANCIER
          </div>
          <h1 className="text-3xl font-bold text-white">Vue d'ensemble</h1>
          <p className="text-gray-400 mt-1">Suivi de tous les flux monétaires de la plateforme.</p>
        </header>

        {/* 1. CARTES DE RÉSUMÉ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Encaissé */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <ArrowUpRight className="w-5 h-5" />
              <p className="text-sm font-bold">Argent entré (Clients)</p>
            </div>
            <p className="text-3xl font-black text-white">{data.total_payin.toLocaleString()} <span className="text-sm text-gray-500">FCFA</span></p>
          </div>

          {/* Dû aux WISP */}
          <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Wallet className="w-5 h-5" />
              <p className="text-sm font-bold">Solde des Wallets (Dette)</p>
            </div>
            <p className="text-3xl font-black text-white">{data.total_wisp_wallets.toLocaleString()} <span className="text-sm text-gray-500">FCFA</span></p>
          </div>

          {/* Tes Revenus */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-gray-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <TrendingUp className="w-5 h-5" />
              <p className="text-sm font-bold">Tes Revenus (Commissions)</p>
            </div>
            <p className="text-3xl font-black text-emerald-400">{data.total_mbeej_revenue.toLocaleString()} <span className="text-sm text-emerald-500">FCFA</span></p>
          </div>
        </div>

        {/* 2. GRAPHIQUE DE RÉPARTITION */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" /> Répartition des flux (FCFA)
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickMargin={10} />
                <YAxis stroke="#666" fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`, 'Montant']}
                />
                <Bar dataKey="montant" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. DÉTAIL DE LA TRÉSORERIE */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-red-400" /> Sorties & Trésorerie
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-gray-400">Total déjà versé aux WISP (Retraits validés)</span>
              <span className="font-bold text-red-400">-{data.total_payouts_paid.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-gray-400">Fonds en attente de retrait (Wallets)</span>
              <span className="font-bold text-amber-400">{data.total_wisp_wallets.toLocaleString()} FCFA</span>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-white font-bold block">Trésorerie Nette (Cash en main)</span>
                <span className="text-xs text-gray-500">Argent que tu détiens physiquement sur ton compte</span>
              </div>
              <span className="text-2xl font-black text-blue-400">{cashAvailable.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}