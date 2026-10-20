'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { getProfile, updateProfile, deleteProfile, getRouters, type Router } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

type ProfileForm = {
  router_id: number;
  profile_name: string;
  duration_minutes: number;
  price: number;
  currency: 'XOF' | 'EUR' | 'USD';
  bandwidth_limit?: string | null;
  max_devices: number;
  is_active: boolean;
};

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [routers, setRouters] = useState<Router[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});

  const profileId = params.id ? parseInt(params.id as string) : null;

  const { register, handleSubmit, reset, formState: { errors: formErrors } } = useForm<ProfileForm>({
    defaultValues: {
      router_id: 0,
      profile_name: '',
      duration_minutes: 60,
      price: 500,
      currency: 'XOF',
      bandwidth_limit: '',
      max_devices: 1,
      is_active: true,
    },
  });

  useEffect(() => {
    if (!profileId) return;

    const fetchData = async () => {
      try {
        const [profileData, routersData] = await Promise.all([
          getProfile(profileId),
          getRouters(),
        ]);
        
        setProfile(profileData);
        
        const transformedRouters = routersData.map((item: any) => {
          const routerId = item.ID || item.id;
          return {
            id: routerId,
            user_id: item.UserID || item.user_id,
            name: item.Name || item.name || 'Sans nom',
            config_token: item.ConfigToken || item.config_token,
            is_active: item.IsActive !== undefined ? item.IsActive : (item.is_active || false),
            last_seen: item.LastSeen || item.last_seen || null,
            created_at: item.CreatedAt || item.created_at || new Date().toISOString()
          };
        }).filter(r => r.id !== undefined && r.id !== null);
        
        setRouters(transformedRouters);
        
        reset({
          router_id: profileData.router_id,
          profile_name: profileData.profile_name,
          duration_minutes: profileData.duration_minutes,
          price: profileData.price,
          currency: profileData.currency as 'XOF' | 'EUR' | 'USD',
          bandwidth_limit: profileData.bandwidth_limit || '',
          max_devices: profileData.max_devices || 1,
          is_active: profileData.is_active,
        });
      } catch (error) {
        toast.error('Erreur lors du chargement du forfait');
        router.push('/routers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [profileId, router, reset]);

  const validateForm = (data: ProfileForm): boolean => {
    const newErrors: Partial<Record<keyof ProfileForm, string>> = {};
    if (!data.router_id || data.router_id === 0) newErrors.router_id = 'Veuillez sélectionner un routeur';
    if (!data.profile_name || data.profile_name.length < 3) newErrors.profile_name = 'Le nom doit contenir au moins 3 caractères';
    if (!data.duration_minutes || data.duration_minutes < 1) newErrors.duration_minutes = 'La durée doit être positive';
    if (!data.price || data.price < 1) newErrors.price = 'Le prix doit être positif';
    if (!data.max_devices || data.max_devices < 1) newErrors.max_devices = 'Doit être au moins 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (formData: ProfileForm) => {
    if (!profileId) return;
    
    if (!validateForm(formData)) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setIsSaving(true);
    try {
      const apiData = {
        router_id: formData.router_id,
        profile_name: formData.profile_name,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        currency: formData.currency,
        bandwidth_limit: formData.bandwidth_limit || null,
        max_devices: formData.max_devices,
        is_active: formData.is_active,
      };
      
      await updateProfile(profileId, apiData);
      toast.success('Forfait mis à jour avec succès !');
      router.push(`/routers/${formData.router_id}/profiles`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!profileId) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce forfait ?')) return;
    try {
      await deleteProfile(profileId);
      toast.success('Forfait supprimé avec succès');
      router.back();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
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
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier le forfait</h1>
          <p className="text-gray-600 mt-2">{profile?.profile_name}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-amber-600 hover:text-amber-700 font-medium transition-colors flex items-center gap-2"
        >
          ← Retour
        </button>
      </div>

      <div className="max-w-2xl relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl p-8 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Routeur associé</label>
              <select
                {...register('router_id', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition [&>option]:bg-gray-900"
              >
                <option value="">Sélectionnez un routeur</option>
                {routers.map((router) => (
                  <option key={router.id} value={router.id}>
                    {router.name} {router.is_active ? '' : '(inactif)'}
                  </option>
                ))}
              </select>
              {errors.router_id && <p className="mt-1 text-sm text-red-400">{errors.router_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom du forfait</label>
              <input
                {...register('profile_name')}
                type="text"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition"
                placeholder="Ex: Forfait Premium"
              />
              {errors.profile_name && <p className="mt-1 text-sm text-red-400">{errors.profile_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Durée (minutes)</label>
                <input
                  {...register('duration_minutes', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition"
                />
                {errors.duration_minutes && <p className="mt-1 text-sm text-red-400">{errors.duration_minutes}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prix</label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="1"
                  min="1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition"
                />
                {errors.price && <p className="mt-1 text-sm text-red-400">{errors.price}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre d'appareils inclus</label>
              <select
                {...register('max_devices', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition [&>option]:bg-gray-900"
              >
                <option value={1}>1 appareil (Standard)</option>
                <option value={2}>2 appareils (Couple)</option>
                <option value={5}>5 appareils (Famille)</option>
                <option value={10}>10 appareils (Maison / Petit bureau)</option>
                <option value={20}>20 appareils (Grande famille)</option>
                <option value={50}>50 appareils (Entreprise)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Le client pourra connecter ce nombre d'appareils avec un seul paiement.</p>
              {errors.max_devices && <p className="mt-1 text-sm text-red-400">{errors.max_devices}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Devise</label>
              <select
                {...register('currency')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition [&>option]:bg-gray-900"
              >
                <option value="XOF">FCFA (XOF)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar (USD)</option>
              </select>
            </div>

            {/* ✅ LIMITE DE DÉBIT EN MENU DÉROULANT */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Limite de débit (Vitesse)</label>
              <select
                {...register('bandwidth_limit')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition [&>option]:bg-gray-900"
              >
                <option value="">Illimité (Partagé)</option>
                <option value="512k">512 Kbps (Basique)</option>
                <option value="1M">1 Mbps (Standard)</option>
                <option value="2M">2 Mbps (Confortable)</option>
                <option value="5M">5 Mbps (Rapide)</option>
                <option value="10M">10 Mbps (Premium / Gaming)</option>
                <option value="20M">20 Mbps (Ultra Fibre)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                La vitesse maximale allouée. Symétrique (ex: 2M = 2 Mbps en téléchargement et envoi).
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                {...register('is_active')}
                type="checkbox"
                className="w-5 h-5 text-amber-500 bg-white/5 border-white/10 rounded focus:ring-amber-500 focus:ring-offset-gray-900"
              />
              <label className="text-sm text-gray-300">Forfait actif</label>
            </div>

            <div className="flex gap-4 pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-[#d97706] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#b45309] transition-all shadow-lg disabled:opacity-50 flex justify-center"
              >
                {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
              
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors font-medium"
              >
                Supprimer
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}