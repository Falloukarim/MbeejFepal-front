'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getAllPayments, type Payment } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await getAllPayments();
        
        const adaptedPayments = Array.isArray(data) 
          ? data.map((item: any) => ({
              id: item.ID || item.id || 0,
              amount: item.Amount ?? item.amount ?? 0,
              status: item.Status || item.status || 'PENDING',
              provider_tx_id: item.ProviderTxID || item.provider_tx_id || null,
              created_at: item.CreatedAt || item.created_at || new Date().toISOString(),
              confirmed_at: item.ConfirmedAt || item.confirmed_at || null,
            }))
            .filter(payment => payment.id)
          : [];
        
        setPayments(adaptedPayments);
      } catch (error) {
        console.error('❌ Erreur:', error);
        toast.error('Erreur lors du chargement des paiements');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Complété</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><Clock className="w-3.5 h-3.5" /> En attente</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20"><XCircle className="w-3.5 h-3.5" /> Échoué</span>;
      case 'REFUNDED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20"><CreditCard className="w-3.5 h-3.5" /> Remboursé</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</span>;
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
        <div className="inline-block bg-white/5 border border-white/10 text-amber-500 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
          <CreditCard className="w-3 h-3 inline mr-1" /> PAIEMENTS
        </div>
        <h1 className="text-3xl font-bold text-white">Paiements</h1>
        <p className="text-gray-300 mt-2">Historique des transactions de la plateforme</p>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl border border-white/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            Liste des paiements
          </h2>
          <span className="bg-white/5 border border-white/10 text-white text-xs font-bold px-3 py-1 rounded-full">
            {payments.length} transaction(s)
          </span>
        </div>

        <div className="relative z-10 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Référence</th>
                <th className="px-6 py-4">Créé le</th>
                <th className="px-6 py-4">Confirmé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-medium text-gray-300">#{payment.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-amber-500">
                      {payment.amount.toLocaleString()} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                      {payment.provider_tx_id || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500/70" />
                      {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {payment.confirmed_at ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {format(new Date(payment.confirmed_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments.length === 0 && (
          <div className="relative z-10 px-6 py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <CreditCard className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucun paiement</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Les paiements apparaîtront ici lorsque des transactions seront effectuées sur la plateforme.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-gray-600 text-xs">
        © 2026 MbeejFepal. Tous droits réservés.
      </div>
    </Layout>
  );
}