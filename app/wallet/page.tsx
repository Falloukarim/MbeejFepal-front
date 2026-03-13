'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getWallet, getTransactions, type Wallet, type Transaction } from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Chargement du portefeuille...');
        
        // Récupérer d'abord le wallet
        let walletData = null;
        try {
          walletData = await getWallet();
          console.log('📦 Wallet brut:', walletData);
        } catch (walletError) {
          console.log('ℹ️ Pas de wallet existant, utilisation du wallet par défaut');
        }
        
        // Adapter le wallet
        const adaptedWallet = {
          id: (walletData as any)?.ID || (walletData as any)?.id || 0,
          user_id: (walletData as any)?.UserID || (walletData as any)?.user_id || '',
          balance: (walletData as any)?.Balance ?? (walletData as any)?.balance ?? 0,
          currency: (walletData as any)?.Currency || (walletData as any)?.currency || 'XOF',
          created_at: (walletData as any)?.CreatedAt || (walletData as any)?.created_at,
          updated_at: (walletData as any)?.UpdatedAt || (walletData as any)?.updated_at,
        };
        
        setWallet(adaptedWallet);
        
        // Récupérer les transactions
        try {
          const transactionsData = await getTransactions();
          console.log('📦 Transactions brutes:', transactionsData);
          
          const adaptedTransactions = Array.isArray(transactionsData) 
            ? transactionsData.map((item: any) => ({
                id: item.ID || item.id,
                wallet_id: item.WalletID || item.wallet_id,
                session_id: item.SessionID || item.session_id,
                amount: item.Amount || item.amount || 0,
                type: item.Type || item.type || 'DEBIT',
                description: item.Description || item.description || '',
                created_at: item.CreatedAt || item.created_at || new Date().toISOString(),
              }))
            : [];
          
          setTransactions(adaptedTransactions);
        } catch (transError) {
          console.log('ℹ️ Pas de transactions pour le moment');
          setTransactions([]); // Tableau vide par défaut
        }
        
      } catch (error) {
        console.error('❌ Erreur inattendue:', error);
        toast.error('Erreur lors du chargement du portefeuille');
        setWallet({
          id: 0,
          user_id: '',
          balance: 0,
          currency: 'XOF',
        });
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
        );
      case 'DEBIT':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" strokeLinecap="round"/>
          </svg>
        );
      case 'COMMISSION':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 10L12 15L17 10" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        );
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return 'text-green-600';
      case 'DEBIT':
        return 'text-red-600';
      case 'COMMISSION':
        return 'text-[#d97706]';
      default:
        return 'text-gray-600';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'CREDIT' ? '+' : type === 'DEBIT' ? '-' : '';
    return `${sign}${amount.toLocaleString()} ${wallet?.currency || 'XOF'}`;
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

  const displayWallet = wallet || { balance: 0, currency: 'XOF' };

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
            <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
              <circle cx="12" cy="15" r="1" fill="currentColor"/>
            </svg>
            PORTEFEUILLE
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Mon portefeuille</h1>
          <p className="text-gray-600 mt-2">Consultez vos revenus et transactions</p>
        </div>

        {/* Carte du solde */}
        <div className="max-w-2xl mx-auto mb-8 animate-[slideUp_0.6s_ease-out]">
          <div className="bg-gradient-to-r from-black via-gray-900 to-gray-800 rounded-[32px] shadow-xl p-8 text-white relative overflow-hidden border border-[rgba(217,119,6,0.3)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(217,119,6,0.2)_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(217,119,6,0.05)_0px,rgba(217,119,6,0.05)_1px,transparent_1px,transparent_20px)]"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#d97706] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="2" />
                      <path d="M12 6a6 6 0 0 1 6 6" strokeLinecap="round" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                    Solde disponible
                  </p>
                  <p className="text-4xl font-bold">
                    <span className="text-[#d97706]">{displayWallet.balance.toLocaleString()}</span>
                    <span className="text-xl ml-2 text-gray-300">{displayWallet.currency}</span>
                  </p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-r from-[#d97706] to-[#92400e] rounded-2xl flex items-center justify-center shadow-xl animate-[float_3s_ease-in-out_infinite]">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                    <circle cx="12" cy="15" r="1" fill="currentColor"/>
                  </svg>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button className="flex-1 bg-white/10 hover:bg-white/20 rounded-xl py-3 px-4 transition-all duration-300 text-sm font-medium border border-[rgba(217,119,6,0.3)] hover:border-[#d97706] group">
                  <svg className="w-4 h-4 inline-block mr-2 group-hover:translate-y-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                  </svg>
                  Retirer
                </button>
                <button className="flex-1 bg-gradient-to-r from-[#d97706] to-[#92400e] hover:from-[#92400e] hover:to-[#d97706] rounded-xl py-3 px-4 transition-all duration-300 text-sm font-medium shadow-lg group">
                  <svg className="w-4 h-4 inline-block mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 8L21 12L17 16" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 16L3 12L7 8" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
                  </svg>
                  Historique
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Historique des transactions */}
        <div className="bg-white/95 backdrop-blur-[20px] border border-[rgba(217,119,6,0.2)] rounded-[32px] shadow-xl overflow-hidden animate-[slideUp_0.7s_ease-out]">
          <div className="px-6 py-4 border-b border-[rgba(217,119,6,0.2)] bg-gradient-to-r from-[#fff7e6] to-[#fffbeb]">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 8L21 12L17 16" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 16L3 12L7 8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
              </svg>
              Historique des transactions
            </h2>
          </div>

          {transactions.length > 0 ? (
            <div className="divide-y divide-[rgba(217,119,6,0.1)]">
              {transactions.map((transaction, index) => (
                <div 
                  key={transaction.id} 
                  className="p-4 hover:bg-[rgba(217,119,6,0.05)] transition-colors animate-[slideUp_0.5s_ease-out]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Version mobile */}
                  <div className="sm:hidden">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${transaction.type === 'CREDIT' ? 'bg-green-50 text-green-600' : 
                          transaction.type === 'DEBIT' ? 'bg-red-50 text-red-600' : 
                          'bg-[#fff7e6] text-[#d97706]'}`}>
                        {getTransactionIcon(transaction.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                          <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                            {formatAmount(transaction.amount, transaction.type)}
                          </p>
                        </div>
                        
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <svg className="w-3.5 h-3.5 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>

                        {transaction.session_id && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <svg className="w-3.5 h-3.5 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Session #{transaction.session_id}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Version desktop */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                        ${transaction.type === 'CREDIT' ? 'bg-green-50 text-green-600' : 
                          transaction.type === 'DEBIT' ? 'bg-red-50 text-red-600' : 
                          'bg-[#fff7e6] text-[#d97706]'}`}>
                        {getTransactionIcon(transaction.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4">
                          <p className="font-medium text-gray-900 truncate max-w-xs">{transaction.description}</p>
                          {transaction.session_id && (
                            <span className="px-2 py-1 bg-[rgba(217,119,6,0.08)] text-[#d97706] text-xs rounded-lg border border-[rgba(217,119,6,0.2)]">
                              Session #{transaction.session_id}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <svg className="w-4 h-4 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            {format(new Date(transaction.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#fff7e6] to-[#fffbeb] rounded-full flex items-center justify-center border border-[rgba(217,119,6,0.2)]">
                <svg className="w-12 h-12 text-[#d97706] opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                  <circle cx="12" cy="15" r="1" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune transaction</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Les transactions apparaîtront ici lorsque vous recevrez des paiements
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

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </Layout>
  );
}