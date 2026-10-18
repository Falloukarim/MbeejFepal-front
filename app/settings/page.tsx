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
    defaultValues: {
      payout_phone: '',
      payout_method: 'wave-senegal',
    },
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-2">Gérez vos informations de compte et de retrait</p>
      </div>

      <div className="max-w-2xl bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Compte de réception (Payout)</h2>
            <p className="text-sm text-gray-500">Où souhaitez-vous recevoir vos gains ?</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro Wave
            </label>
            <input
              type="tel"
              {...register('payout_phone', { required: true })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
              placeholder="Ex: 771234567"
            />
            <p className="text-xs text-gray-500 mt-2">
              Format : 9 chiffres commençant par 7 (sans l'indicatif +221).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opérateur
            </label>
            <select
              {...register('payout_method')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition bg-white"
            >
              <option value="wave-senegal">Wave Sénégal</option>
              {/* Tu pourras ajouter Orange Money plus tard ici */}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? 'Sauvegarde...' : <><Save className="w-5 h-5" /> Enregistrer mes informations</>}
          </button>
        </form>
      </div>
    </Layout>
  );
}