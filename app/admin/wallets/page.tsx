'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getAllWallets } from '@/lib/api'; // Assure-toi que ça pointe bien vers l'API /admin/wallets
import toast from 'react-hot-toast';
import { Wallet as WalletIcon, User as UserIcon, Mail, CreditCard } from 'lucide-react';

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const data = await getAllWallets();
        console.log('📦 Wallets avec utilisateurs:', data);
        
        // ✅ On adapte les données en lisant directement user_name et email
        const adaptedWallets = Array.isArray(data) 
          ? data.map((item: any) => ({
              id: item.ID || item.id || 0,
              user_id: item.UserID || item.user_id || '',
              balance: item.Balance ?? item.balance ?? 0,
              currency: item.Currency || item.currency || 'XOF',
              // Récupération des champs du JOIN
              user_name: item.user_name || item.UserName || item.name || 'Utilisateur inconnu',
              email: item.email || item.Email || 'Pas d\'email',
            })).filter(wallet => wallet.id)
          : [];
        
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="inline-block bg-white/5 border border-white/10 text-amber-500 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
          <WalletIcon className="w-3 h-3 inline mr-1" /> PORTEFEUILLES
        </div>
        <h1 className="text-3xl font-bold text-white">Portefeuilles</h1>
        <p className="text-gray-300 mt-2">Gestion des portefeuilles utilisateurs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-[32px] shadow-xl p-6 hover:shadow-2xl hover:border-amber-500/30 transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-amber-500 shadow-lg">
                  <WalletIcon className="w-6 h-6" />
                </div>
                <span className="text-sm text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                  #{wallet.id}
                </span>
              </div>
              
              {/* ✅ Affichage des infos utilisateur grâce au JOIN SQL */}
              <div className="mb-4 space-y-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 text-white font-medium">
                  <UserIcon className="w-4 h-4 text-amber-500" />
                  <span className="truncate">{wallet.user_name}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{wallet.email}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 mt-2">
                <span className="text-gray-400 text-sm font-medium">Solde</span>
                <span className="text-2xl font-bold text-amber-500">
                  {wallet.balance.toLocaleString()} <span className="text-sm font-normal text-gray-500">{wallet.currency}</span>
                </span>
              </div>
            </div>
          </div>
        ))}

        {wallets.length === 0 && (
          <div className="col-span-full text-center py-16 bg-gradient-to-br from-gray-900 to-black rounded-[32px] border border-white/10">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <WalletIcon className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucun portefeuille</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Les portefeuilles apparaîtront ici lorsque des utilisateurs s'inscriront.
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