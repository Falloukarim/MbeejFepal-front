'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getWallet, getTransactions, requestWithdrawal, type Wallet, type Transaction } from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowDownToLine, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let walletData = null;
        try {
          walletData = await getWallet();
        } catch (walletError) {
          console.log('ℹ️ Pas de wallet existant');
        }
        
        const adaptedWallet = {
          id: (walletData as any)?.ID || (walletData as any)?.id || 0,
          user_id: (walletData as any)?.UserID || (walletData as any)?.user_id || '',
          balance: (walletData as any)?.Balance ?? (walletData as any)?.balance ?? 0,
          currency: (walletData as any)?.Currency || (walletData as any)?.currency || 'XOF',
          created_at: (walletData as any)?.CreatedAt || (walletData as any)?.created_at,
          updated_at: (walletData as any)?.UpdatedAt || (walletData as any)?.updated_at,
        };
        
        setWallet(adaptedWallet);
        
        try {
          const transactionsData = await getTransactions();
          
          const adaptedTransactions = Array.isArray(transactionsData) 
            ? transactionsData.map((item: any) => {
                // On nettoie la description pour enlever les "session XXX"
                let desc = item.Description || item.description || '';
                desc = desc.replace(/session \d+/gi, '').replace(/\(Net après frais\)/gi, '').trim();
                if (!desc) desc = 'Crédit de paiement';

                return {
                  id: item.ID || item.id,
                  wallet_id: item.WalletID || item.wallet_id,
                  session_id: item.SessionID || item.session_id, // gardé pour le backend mais pas affiché
                  amount: item.Amount || item.amount || 0,
                  type: item.Type || item.type || 'CREDIT',
                  description: desc,
                  created_at: item.CreatedAt || item.created_at || new Date().toISOString(),
                };
              })
            : [];
          
          setTransactions(adaptedTransactions);
        } catch (transError) {
          setTransactions([]);
        }
      } catch (error) {
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleWithdraw = async () => {
    if (!wallet) return;

    if (wallet.balance < 25000) {
      toast.error('Le solde minimum pour un retrait est de 25 000 FCFA.');
      return;
    }

    if (!confirm(`Voulez-vous vraiment retirer ${wallet.balance.toLocaleString()} FCFA vers votre compte Wave ?`)) {
      return;
    }

    setWithdrawing(true);
    try {
      await requestWithdrawal();
      toast.success('Virement initié ! Vous recevrez l\'argent sur Wave.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(error.response?.data || 'Erreur lors du retrait');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d97706]"></div>
        </div>
      </Layout>
    );
  }

  const displayWallet = wallet || { balance: 0, currency: 'XOF' };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-[fadeIn_0.5s_ease-out]">
        
        {/* Carte du solde - Design épuré */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-gray-900 to-black rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Solde disponible</p>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-5xl font-extrabold text-amber-500">{displayWallet.balance.toLocaleString()}</h1>
                  <span className="text-xl text-gray-400 font-medium">{displayWallet.currency}</span>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={displayWallet.balance < 25000 || withdrawing}
                className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  displayWallet.balance >= 25000
                    ? 'bg-amber-500 hover:bg-amber-600 text-white transform hover:-translate-y-1'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ArrowDownToLine className="w-5 h-5" />
                {withdrawing 
                  ? 'Traitement...' 
                  : displayWallet.balance < 25000
                    ? 'Min. 25 000 FCFA'
                    : 'Retirer vers Wave'}
              </button>
            </div>
          </div>
        </div>

        {/* Historique des transactions */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900">Historique</h2>
          </div>

          {transactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                  
                  {/* Icône + Description */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      transaction.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 
                      transaction.type === 'DEBIT' ? 'bg-red-100 text-red-600' : 
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {transaction.type === 'CREDIT' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(transaction.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {/* Montant */}
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}{transaction.amount.toLocaleString()} <span className="text-sm">{displayWallet.currency}</span>
                    </p>
                  </div>
                  
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center text-gray-500">
              <p>Aucune transaction pour le moment.</p>
            </div>
          )}
        </div>
        
      </div>
    </Layout>
  );
}