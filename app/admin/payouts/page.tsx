'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Wallet, CheckCircle2, Smartphone, Clock } from 'lucide-react';

interface PayoutRequest {
  id: number;
  user_id: string;
  amount: number;
  status: string;
  payout_phone: string;
  payout_method: string;
  created_at: string;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const res = await api.get('/admin/payouts');
      setPayouts(res.data || []);
    } catch {
      toast.error('Erreur chargement des retraits');
    } finally {
      setLoading(false);
    }
  };

  const validatePayout = async (id: number) => {
    if (!confirm('Confirmez-vous avoir envoyé l’argent sur Wave ?')) return;
    try {
      await api.put(`/admin/payouts/${id}/validate`);
      toast.success('Retrait marqué comme payé !');
      fetchPayouts();
    } catch {
      toast.error('Erreur lors de la validation');
    }
  };

  if (loading) return <Layout><p className="text-white text-center py-20">Chargement...</p></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-10">
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider mb-3">
            <Wallet className="w-3.5 h-3.5" /> ADMINISTRATION
          </div>
          <h1 className="text-3xl font-bold text-white">Demandes de retrait</h1>
          <p className="text-gray-400 mt-1">Liste des retraits en attente de virement manuel Wave.</p>
        </header>

        {payouts.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-white/5 border border-white/10">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-white font-bold text-lg">Aucun retrait en attente</p>
            <p className="text-gray-400 text-sm mt-1">Tout est à jour !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((p) => (
              <div key={p.id} className="relative overflow-hidden rounded-2xl bg-gray-900 border border-white/10 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">Montant</p>
                  <p className="text-2xl font-black text-white">{p.amount.toLocaleString()} <span className="text-sm font-medium text-gray-400">FCFA</span></p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Demandé le {format(new Date(p.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Envoyer via {p.payout_method}</p>
                    <p className="text-lg font-mono font-bold text-white tracking-wider">{p.payout_phone}</p>
                  </div>
                </div>

                <button
                  onClick={() => validatePayout(p.id)}
                  className="h-12 px-6 rounded-xl bg-green-500/10 text-green-400 font-bold border border-green-500/20 hover:bg-green-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Marquer comme payé
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}