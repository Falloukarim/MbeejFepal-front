'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getAllWallets, getTransactions, type Wallet, type Transaction } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function PlatformWalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer tous les wallets et filtrer celui de la plateforme
        const wallets = await getAllWallets();
        const platformWallet = wallets.find(w => w.user_id === PLATFORM_USER_ID);
        setWallet(platformWallet || null);
        
        // Récupérer toutes les transactions
        const allTransactions = await getTransactions();
        // Filtrer celles du wallet plateforme
        if (platformWallet) {
          const platformTxs = allTransactions.filter(t => t.wallet_id === platformWallet.id);
          setTransactions(platformTxs);
        }
      } catch (error) {
        toast.error('Erreur chargement wallet plateforme');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Layout>Chargement...</Layout>;

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-8">Wallet Plateforme</h1>
      
      {/* Carte du solde */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Solde de la plateforme</p>
              <p className="text-4xl font-bold">
                {wallet?.balance.toLocaleString()} {wallet?.currency}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Historique des commissions</h2>
        </div>
        <div className="divide-y">
          {transactions.map(tx => (
            <div key={tx.id} className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{tx.description}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(tx.created_at), 'dd MMMM yyyy HH:mm', { locale: fr })}
                </p>
              </div>
              <span className="text-green-600 font-bold">
                +{tx.amount.toLocaleString()} {wallet?.currency}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              Aucune commission pour le moment
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}