'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getAllPayments, type Payment } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await getAllPayments();
        console.log('📦 Paiements bruts:', data);
        
        // Transformer les données du backend (avec majuscules)
        const adaptedPayments = Array.isArray(data) 
          ? data.map((item: any) => ({
              id: item.ID || item.id || 0,
              amount: item.Amount ?? item.amount ?? 0,
              status: item.Status || item.status || 'PENDING',
              provider_tx_id: item.ProviderTxID || item.provider_tx_id || null,
              created_at: item.CreatedAt || item.created_at || new Date().toISOString(),
              confirmed_at: item.ConfirmedAt || item.confirmed_at || null,
            }))
            .filter(payment => payment.id) // Ne garder que ceux avec un ID
          : [];
        
        console.log('✅ Paiements adaptés:', adaptedPayments);
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
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">Complété</span>;
      case 'PENDING':
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">En attente</span>;
      case 'FAILED':
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">Échoué</span>;
      case 'REFUNDED':
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">Remboursé</span>;
      default:
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-200">{status}</span>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="relative w-20 h-20">
            <svg className="w-16 h-16 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#d97706] animate-[pulse_2s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round"/>
              <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7"/>
              <path d="M8 16.5L12 12.5L16 16.5" strokeLinecap="round" strokeWidth="2"/>
            </svg>
            <div className="absolute inset-0 border-2 border-[#d97706] rounded-full animate-[ripple_1.5s_linear_infinite]"></div>
            <div className="absolute inset-0 border-2 border-[#d97706] rounded-full animate-[ripple_1.5s_linear_infinite_0.5s]"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Effets de fond */}
      <div className="fixed inset-0 pointer-events-none z-0"
           style={{
             background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 50%, #fde68a 100%)'
           }}>
        <div className="absolute inset-0"
             style={{
               background: 'radial-gradient(circle at 0% 0%, rgba(217,119,6,0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(217,119,6,0.08) 0%, transparent 50%)'
             }} />
        <div className="absolute inset-0"
             style={{
               background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"none\"><path d=\"M0 0 L100 100 M100 0 L0 100\" stroke=\"%23d97706\" stroke-width=\"0.5\" opacity=\"0.05\"/></svg>')",
               backgroundSize: '50px 50px'
             }} />
      </div>

      <div className="relative z-10">
        {/* En-tête avec badge */}
        <div className="mb-8 animate-[slideUp_0.5s_ease-out]">
          <div className="inline-block bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
            <i className="bi bi-star-fill mr-1"></i> PAIEMENTS
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-600 mt-2">Historique des transactions</p>
        </div>

        <div className="bg-white/95 backdrop-blur-[20px] border border-[rgba(217,119,6,0.2)] rounded-[32px] shadow-xl overflow-hidden animate-[slideUp_0.6s_ease-out]">
          <div className="px-6 py-4 border-b border-[rgba(217,119,6,0.2)] bg-gradient-to-r from-[#fff7e6] to-[#fffbeb]">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
                <circle cx="12" cy="15" r="1" fill="currentColor"/>
              </svg>
              Liste des paiements
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgba(217,119,6,0.1)]">
              <thead className="bg-gradient-to-r from-[#fff7e6] to-[#fffbeb]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Créé le</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Confirmé le</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[rgba(217,119,6,0.1)]">
                {payments.map((payment, index) => (
                  <tr key={payment.id} className="hover:bg-[rgba(217,119,6,0.05)] transition-colors animate-[slideUp_0.5s_ease-out]" style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-medium text-gray-900">#{payment.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-[#d97706]">
                        {payment.amount.toLocaleString()} FCFA
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-500 bg-[rgba(217,119,6,0.05)] px-2 py-1 rounded-lg">
                        {payment.provider_tx_id || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.confirmed_at ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M8 12L11 15L16 9" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {format(new Date(payment.confirmed_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#fff7e6] to-[#fffbeb] rounded-full flex items-center justify-center border border-[rgba(217,119,6,0.2)]">
                <svg className="w-12 h-12 text-[#d97706] opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                  <circle cx="12" cy="15" r="1" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun paiement</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Les paiements apparaîtront ici lorsque des transactions seront effectuées
              </p>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <i className="bi bi-c-circle me-1"></i>
          2026 MbeejFepal. Tous droits réservés.
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { 
            transform: scale(1) translate(-50%, -50%);
            opacity: 1;
          }
          50% { 
            transform: scale(1.1) translate(-45%, -45%);
            opacity: 0.9;
          }
        }

        @keyframes ripple {
          0% {
            width: 20px;
            height: 20px;
            opacity: 0.5;
          }
          100% {
            width: 80px;
            height: 80px;
            opacity: 0;
          }
        }
      `}</style>
    </Layout>
  );
}