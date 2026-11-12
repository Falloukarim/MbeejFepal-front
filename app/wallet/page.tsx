'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getWallet, getTransactions, requestWithdrawal, type Wallet, type Transaction } from '@/lib/api';
import toast from 'react-hot-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { fr } from 'date-fns/locale';
import {
  ArrowDownToLine,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Wallet as WalletIcon,
  X,
  Lock,
  TrendingUp,
  TrendingDown,
  Check,
} from 'lucide-react';

const MIN_WITHDRAWAL = 25000;

type TxFilter = 'all' | 'in' | 'out';

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filter, setFilter] = useState<TxFilter>('all');
  const [successWithdraw, setSuccessWithdraw] = useState(false);
  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const displayWallet = wallet || { balance: 0, currency: 'XOF' };
  const canWithdraw = displayWallet.balance >= MIN_WITHDRAWAL;
  const progress = Math.min(100, Math.round((displayWallet.balance / MIN_WITHDRAWAL) * 100));
  const remaining = Math.max(0, MIN_WITHDRAWAL - displayWallet.balance);

  // Ouvre la feuille de confirmation (remplace le confirm() du navigateur)
  const requestWithdraw = () => {
    if (!wallet) return;
    if (wallet.balance < MIN_WITHDRAWAL) {
      toast.error('Le solde minimum pour un retrait est de 25 000 FCFA.');
      return;
    }
    setConfirmOpen(true);
  };

  const handleWithdraw = async () => {
    if (!wallet) return;
    setWithdrawing(true);
    try {
      await requestWithdrawal();
      setConfirmOpen(false);
      setSuccessWithdraw(true); // ✅ Affiche le modal
    } catch (error: any) {
      toast.error(error.response?.data || 'Erreur lors du retrait');
    } finally {
      setWithdrawing(false);
    }
  };

  const totals = useMemo(() => {
    let inTotal = 0;
    let outTotal = 0;
    transactions.forEach((t) => {
      if (t.type === 'CREDIT') inTotal += t.amount;
      else outTotal += t.amount;
    });
    return { inTotal, outTotal };
  }, [transactions]);

  // Filtre + regroupement par jour
  const groups = useMemo(() => {
    const filtered = transactions
      .filter((t) => (filter === 'all' ? true : filter === 'in' ? t.type === 'CREDIT' : t.type !== 'CREDIT'))
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const map = new Map<string, { label: string; items: Transaction[] }>();
    filtered.forEach((t) => {
      const d = new Date(t.created_at);
      const key = format(d, 'yyyy-MM-dd');
      if (!map.has(key)) {
        const label = isToday(d) ? "Aujourd'hui" : isYesterday(d) ? 'Hier' : format(d, 'EEEE dd MMMM yyyy', { locale: fr });
        map.set(key, { label, items: [] });
      }
      map.get(key)!.items.push(t);
    });
    return Array.from(map.values());
  }, [transactions, filter]);

if (loading) {
  return (
    <Layout>
      <LoadingSpinner message="Chargement du portefeuille..." />
    </Layout>
  );
}

  const filters: { key: TxFilter; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'in', label: 'Entrées' },
    { key: 'out', label: 'Sorties' },
  ];

  return (
    <Layout>
      <style>{`
        @keyframes wl-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wl-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wl-sheet { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .wl-rise { animation: wl-rise .4s cubic-bezier(.2,.8,.2,1) both; }
        .wl-fade { animation: wl-fade .2s ease both; }
        .wl-sheet { animation: wl-sheet .35s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-10">
        {/* En-tête */}
        <header className="mb-5">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-amber-500 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider mb-3">
            <WalletIcon className="w-3.5 h-3.5" /> PORTEFEUILLE
          </div>
          <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-white">Mon wallet</h1>
          <p className="text-sm text-gray-400 mt-1">Suivez vos gains et retirez-les vers Wave</p>
        </header>

        {/* Carte du solde */}
        <section className="wl-rise relative overflow-hidden rounded-[32px] p-6 border border-amber-500/30 bg-gradient-to-br from-amber-500/25 via-gray-900 to-black shadow-2xl">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex items-start justify-between">
            <p className="text-[11px] uppercase tracking-widest text-gray-300 font-bold">Solde disponible</p>
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 text-amber-400 flex items-center justify-center">
              <WalletIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="relative mt-2 flex items-end gap-2">
            <span className="text-5xl font-black tracking-tight text-white tabular-nums">{displayWallet.balance.toLocaleString()}</span>
            <span className="pb-1.5 text-lg font-semibold text-amber-300">{displayWallet.currency}</span>
          </div>

          {/* Progression vers le seuil de retrait */}
          <div className="relative mt-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-300 font-medium">
                {canWithdraw ? 'Retrait disponible' : `Encore ${remaining.toLocaleString()} FCFA pour pouvoir retirer`}
              </span>
              <span className="text-gray-400 tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${canWithdraw ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">Seuil minimum : {MIN_WITHDRAWAL.toLocaleString()} FCFA</p>
          </div>

          <button
            onClick={requestWithdraw}
            disabled={!canWithdraw || withdrawing}
            className={`relative mt-5 w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              canWithdraw
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-600/30'
                : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
            }`}
          >
            {canWithdraw ? <ArrowDownToLine className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
            {withdrawing ? 'Traitement...' : canWithdraw ? 'Retirer vers Wave' : `Min. ${MIN_WITHDRAWAL.toLocaleString()} FCFA`}
          </button>
        </section>

        {/* Entrées / Sorties */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="wl-rise rounded-[24px] bg-white/5 border border-white/10 p-4" style={{ animationDelay: '60ms' }}>
            <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">Entrées</p>
            <p className="text-lg font-extrabold text-white tabular-nums mt-0.5">
              {totals.inTotal.toLocaleString()} <span className="text-xs font-medium text-gray-400">{displayWallet.currency}</span>
            </p>
          </div>
          <div className="wl-rise rounded-[24px] bg-white/5 border border-white/10 p-4" style={{ animationDelay: '110ms' }}>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-2">
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">Sorties</p>
            <p className="text-lg font-extrabold text-white tabular-nums mt-0.5">
              {totals.outTotal.toLocaleString()} <span className="text-xs font-medium text-gray-400">{displayWallet.currency}</span>
            </p>
          </div>
        </div>

        {/* Historique */}
        <div className="mt-7 mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" /> Historique
          </h2>
          <span className="text-xs text-gray-500 font-semibold">{transactions.length} opération{transactions.length > 1 ? 's' : ''}</span>
        </div>

        {transactions.length > 0 && (
          <div role="tablist" className="grid grid-cols-3 bg-white/5 border border-white/10 rounded-2xl p-1 mb-4">
            {filters.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  filter === f.key ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="text-center py-14 rounded-[28px] bg-white/5 border border-white/10">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <History className="w-8 h-8" />
            </div>
            <p className="font-bold text-white">Aucune transaction pour le moment</p>
            <p className="text-sm text-gray-400 mt-1">Vos gains apparaîtront ici.</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 rounded-[28px] bg-white/5 border border-white/10">
            <p className="font-bold text-white">Aucune opération dans cette catégorie</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <section key={g.label}>
                <h3 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 capitalize">{g.label}</h3>
                <div className="rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 overflow-hidden divide-y divide-white/5 shadow-xl">
                  {g.items.map((transaction) => {
                    const credit = transaction.type === 'CREDIT';
                    return (
                      <div key={transaction.id} className="flex items-center gap-3.5 px-4 py-3.5">
                        <div
                          className={`w-11 h-11 shrink-0 rounded-2xl border flex items-center justify-center ${
                            credit
                              ? 'bg-green-500/10 border-green-500/20 text-green-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}
                        >
                          {credit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{transaction.description}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{format(new Date(transaction.created_at), 'HH:mm', { locale: fr })}</p>
                        </div>
                        <p className={`shrink-0 text-right font-extrabold tabular-nums ${credit ? 'text-green-400' : 'text-red-400'}`}>
                          {credit ? '+' : '-'}
                          {transaction.amount.toLocaleString()}
                          <span className="ml-1 text-[11px] font-semibold text-gray-500">{displayWallet.currency}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Feuille de confirmation du retrait */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm wl-fade"
          onClick={() => !withdrawing && setConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="wl-sheet w-full sm:max-w-md bg-gray-900 border border-white/10 rounded-t-[28px] sm:rounded-[28px] shadow-2xl px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Confirmer le retrait</h2>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={withdrawing}
                aria-label="Fermer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
              <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">Montant à retirer</p>
              <p className="mt-1 text-4xl font-black tracking-tight text-amber-400 tabular-nums">
                {displayWallet.balance.toLocaleString()}
                <span className="ml-2 text-base font-semibold text-gray-300">FCFA</span>
              </p>
              <p className="text-sm text-gray-400 mt-2">Virement vers votre compte Wave</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={withdrawing}
                className="h-14 rounded-2xl bg-white/5 border border-white/10 text-gray-200 font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-xl shadow-amber-600/25 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {withdrawing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
            {/* ✅ MODAL DE SUCCÈS */}
      {successWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-[28px] p-6 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Transfert en cours ....!</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              <br/>
              Réception sous  <strong className="text-white">10 minutes</strong>.
            </p>
            <button 
              onClick={() => { setSuccessWithdraw(false); window.location.reload(); }}
              className="w-full h-12 rounded-xl bg-white text-black font-bold active:scale-95 transition-all"
            >
              Retour au portefeuille
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}