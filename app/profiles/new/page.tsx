'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { createProfile, getRouters, type Router } from '@/lib/api';
import toast from 'react-hot-toast';

type ProfileForm = {
  router_id: number;
  profile_name: string;
  duration_value: number;
  duration_unit: 'minutes' | 'hours' | 'days';
  price: number;
  currency: 'XOF' | 'EUR' | 'USD';
  bandwidth_limit?: string | null;
  max_devices: number;
  is_active: boolean;
};

function NewProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [routers, setRouters] = useState<Router[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const [selectedRouter, setSelectedRouter] = useState<Router | null>(null);

  const { register, handleSubmit, setValue, formState: { errors: formErrors } } = useForm<ProfileForm>({
    defaultValues: {
      router_id: 0,
      profile_name: '',
      duration_value: 1,
      duration_unit: 'days',
      price: 500,
      currency: 'XOF',
      bandwidth_limit: '',
      max_devices: 1,
      is_active: true,
    },
  });

  useEffect(() => {
    const loadRouters = async () => {
      try {
        const data = await getRouters();
        const validRouters = data.map((item: any) => ({
          id: item.ID || item.id,
          user_id: item.UserID || item.user_id,
          name: item.Name || item.name || 'Sans nom',
          config_token: item.ConfigToken || item.config_token,
          is_active: item.IsActive !== undefined ? item.IsActive : (item.is_active || false),
          last_seen: item.LastSeen || item.last_seen || null,
          created_at: item.CreatedAt || item.created_at || new Date().toISOString()
        })).filter(r => r.id !== undefined && r.id !== null);
        
        setRouters(validRouters);
        
        const routerIdParam = searchParams.get('router_id');
        if (routerIdParam) {
          const id = parseInt(routerIdParam);
          setValue('router_id', id);
          const router = validRouters.find(r => r.id === id);
          setSelectedRouter(router || null);
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des routeurs');
      }
    };
    loadRouters();
  }, [searchParams, setValue]);

  const validateForm = (data: ProfileForm): boolean => {
    const newErrors: Partial<Record<keyof ProfileForm, string>> = {};
    if (!data.router_id || data.router_id === 0) newErrors.router_id = 'Veuillez sélectionner un routeur';
    if (!data.profile_name || data.profile_name.length < 3) newErrors.profile_name = 'Le nom doit contenir au moins 3 caractères';
    if (!data.duration_value || data.duration_value < 1) newErrors.duration_value = 'La durée doit être positive';
    if (!data.price || data.price < 1) newErrors.price = 'Le prix doit être positif';
    if (!data.max_devices || data.max_devices < 1) newErrors.max_devices = 'Doit être au moins 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (formData: ProfileForm) => {
    if (!validateForm(formData)) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    let durationInMinutes = formData.duration_value;
    if (formData.duration_unit === 'hours') durationInMinutes *= 60;
    if (formData.duration_unit === 'days') durationInMinutes *= 1440;

    setIsLoading(true);
    try {
      const apiData = {
        router_id: formData.router_id,
        profile_name: formData.profile_name,
        duration_minutes: durationInMinutes,
        price: formData.price,
        currency: formData.currency,
        bandwidth_limit: formData.bandwidth_limit || null,
        max_devices: formData.max_devices,
        is_active: formData.is_active,
      };
      
      await createProfile(apiData);
      toast.success('Forfait créé avec succès !');
      router.push(`/routers/${formData.router_id}/profiles`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nouveau forfait</h1>
        <p className="text-gray-600 mt-2">
          {selectedRouter ? `Créer un forfait pour : ${selectedRouter.name}` : 'Créez une nouvelle offre de connexion'}
        </p>
      </div>

      <div className="max-w-2xl relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl p-8 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!searchParams.get('router_id') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Routeur associé</label>
                <select
                  {...register('router_id', { valueAsNumber: true })}
                  className={`w-full px-4 py-3 bg-white/5 border text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition [&>option]:bg-gray-900 ${errors.router_id ? 'border-red-500' : 'border-white/10'}`}
                >
                  <option value={0}>Sélectionnez un routeur</option>
                  {routers.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                {errors.router_id && <p className="mt-1 text-sm text-red-400">{errors.router_id}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom du forfait</label>
              <input
                {...register('profile_name')}
                type="text"
                className={`w-full px-4 py-3 bg-white/5 border text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition ${errors.profile_name ? 'border-red-500' : 'border-white/10'}`}
                placeholder="Ex: Forfait Famille 30 jours"
              />
              {errors.profile_name && <p className="mt-1 text-sm text-red-400">{errors.profile_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Durée du forfait</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    {...register('duration_value', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className={`w-full px-4 py-3 bg-white/5 border text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition ${errors.duration_value ? 'border-red-500' : 'border-white/10'}`}
                  />
                </div>
                <div className="flex-1">
                  <select
                    {...register('duration_unit')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition [&>option]:bg-gray-900"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Heures</option>
                    <option value="days">Jours</option>
                  </select>
                </div>
              </div>
              {errors.duration_value && <p className="mt-1 text-sm text-red-400">{errors.duration_value}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prix</label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                step="1"
                min="1"
                className={`w-full px-4 py-3 bg-white/5 border text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition ${errors.price ? 'border-red-500' : 'border-white/10'}`}
              />
              {errors.price && <p className="mt-1 text-sm text-red-400">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre d'appareils inclus</label>
              <select
                {...register('max_devices', { valueAsNumber: true })}
                className={`w-full px-4 py-3 bg-white/5 border text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition [&>option]:bg-gray-900 ${errors.max_devices ? 'border-red-500' : 'border-white/10'}`}
              >
                <option value={1}>1 appareil (Standard)</option>
                <option value={2}>2 appareils</option>
                <option value={5}>5 appareils (Famille)</option>
                <option value={10}>10 appareils (Maison)</option>
                <option value={20}>20 appareils</option>
                <option value={50}>50 appareils (Entreprise)</option>
              </select>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#d97706] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#b45309] transition-all shadow-lg disabled:opacity-50"
            >
              {isLoading ? 'Création...' : 'Créer le forfait'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

function LoadingFallback() {
  return <Layout><div className="p-8 text-center">Chargement...</div></Layout>;
}

export default function NewProfilePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewProfileContent />
    </Suspense>
  );
}