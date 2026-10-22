'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { getMe, updatePayoutInfo, type User } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Smartphone } from 'lucide-react';

type SettingsForm = {
  payout_phone: string;
  payout_method: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm<SettingsForm>({
    defaultValues: { payout_phone: '', payout_method: 'wave-senegal' },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe();
        setUser(data);
        reset({
          payout_phone: data.payout_phone || '',
          payout_method: data.payout_method || 'wave-senegal',
        });
      } catch (error) {
        toast.error('Erreur lors du chargement du profil');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [reset]);

  const onSubmit = async (data: SettingsForm) => {
    setIsSaving(true);
    try {
      await updatePayoutInfo(data);
      toast.success('Informations de retrait sauvegardées !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
      {/* ✅ CORRECTION ICI : text-white et text-gray-300 */}
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-300 mt-2">Gérez vos informations de compte et de retrait</p>
      </div>

      <div className="max-w-2xl relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl p-8 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <Smartphone className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Compte de réception (Payout)</h2>
              <p className="text-sm text-gray-400">Où souhaitez-vous recevoir vos gains ?</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Numéro Wave
              </label>
              <input
                type="tel"
                {...register('payout_phone', { required: true })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition"
                placeholder="Ex: 771234567"
              />
              <p className="text-xs text-gray-500 mt-2">
                Format : 9 chiffres commençant par 7 (sans l'indicatif +221).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Opérateur
              </label>
              <select
                {...register('payout_method')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition [&>option]:bg-gray-900"
              >
                <option value="wave-senegal">Wave Sénégal</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#d97706] text-white font-bold py-3 rounded-xl hover:bg-[#b45309] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? 'Sauvegarde...' : <><Save className="w-5 h-5" /> Enregistrer mes informations</>}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}