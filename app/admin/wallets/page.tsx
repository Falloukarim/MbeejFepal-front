'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getAllWallets, type Wallet } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const data = await getAllWallets();
        console.log('📦 Wallets bruts:', data);
        
        // Transformer les données du backend (avec majuscules)
        const adaptedWallets = Array.isArray(data) 
          ? data.map((item: any) => ({
              id: item.ID || item.id || 0,
              user_id: item.UserID || item.user_id || '',
              balance: item.Balance ?? item.balance ?? 0,
              currency: item.Currency || item.currency || 'XOF',
              created_at: item.CreatedAt || item.created_at,
              updated_at: item.UpdatedAt || item.updated_at,
            }))
            .filter(wallet => wallet.id) // Ne garder que ceux avec un ID
          : [];
        
        console.log('✅ Wallets adaptés:', adaptedWallets);
        setWallets(adaptedWallets);
      } catch (error) {
        console.error('❌ Erreur:', error);
        toast.error('Erreur lors du chargement des wallets');
      } finally {
        setLoading(false);
      }
    };
    fetchWallets();
  }, []);

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
            <i className="bi bi-star-fill mr-1"></i> PORTEFEUILLES
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Portefeuilles</h1>
          <p className="text-gray-600 mt-2">Gestion des portefeuilles utilisateurs</p>
        </div>

        {/* Grille des wallets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet, index) => (
            <div
              key={wallet.id}
              className="bg-white/95 backdrop-blur-[20px] border border-[rgba(217,119,6,0.2)] rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-[slideUp_0.5s_ease-out]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#d97706] to-[#92400e] rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                    <circle cx="12" cy="15" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-500 bg-[rgba(217,119,6,0.08)] px-3 py-1 rounded-full">
                  #{wallet.id}
                </span>
              </div>
              
              <div className="mb-4 p-3 bg-[rgba(217,119,6,0.05)] rounded-xl border border-[rgba(217,119,6,0.1)]">
                <p className="text-xs text-gray-500 mb-1">Utilisateur</p>
                <p className="text-sm font-mono text-gray-900 truncate">
                  {wallet.user_id}
                </p>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#fff7e6] to-[#fffbeb] rounded-xl border border-[rgba(217,119,6,0.2)]">
                <span className="text-gray-700 font-medium">Solde</span>
                <span className="text-2xl font-bold text-[#d97706]">
                  {wallet.balance.toLocaleString()} <span className="text-sm font-normal text-gray-500">{wallet.currency}</span>
                </span>
              </div>
            </div>
          ))}

          {wallets.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#fff7e6] to-[#fffbeb] rounded-full flex items-center justify-center border border-[rgba(217,119,6,0.2)]">
                <svg className="w-12 h-12 text-[#d97706] opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                  <circle cx="12" cy="15" r="1" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun portefeuille</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Les portefeuilles apparaîtront ici lorsque des utilisateurs s'inscriront
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