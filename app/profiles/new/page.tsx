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
  duration_minutes: number;
  price: number;
  currency: 'XOF' | 'EUR' | 'USD';
  bandwidth_limit?: string | null;
  max_devices: number; // ✅ NOUVEAU
  is_active: boolean;
};

function NewProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [routers, setRouters] = useState<Router[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const [selectedRouter, setSelectedRouter] = useState<Router | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<ProfileForm>({
    defaultValues: {
      router_id: 0,
      profile_name: '',
      duration_minutes: 60,
      price: 500,
      currency: 'XOF',
      bandwidth_limit: '',
      max_devices: 1, // ✅ Par défaut 1 appareil
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
    if (!data.duration_minutes || data.duration_minutes < 1) newErrors.duration_minutes = 'La durée doit être positive';
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

    setIsLoading(true);
    try {
      const apiData = {
        router_id: formData.router_id,
        profile_name: formData.profile_name,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        currency: formData.currency,
        bandwidth_limit: formData.bandwidth_limit || null,
        max_devices: formData.max_devices, // ✅ NOUVEAU
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
      </div>

      <div className="max-w-2xl">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ... (Champs Routeur et Nom inchangés) ... */}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durée (minutes)</label>
                <input {...register('duration_minutes', { valueAsNumber: true })} type="number" min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                {errors.duration_minutes && <p className="mt-1 text-sm text-red-600">{errors.duration_minutes}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix</label>
                <input {...register('price', { valueAsNumber: true })} type="number" step="1" min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>
            </div>

            {/* ✅ NOUVEAU : Champ Nombre d'appareils */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre d'appareils inclus
              </label>
              <select
                {...register('max_devices', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-white"
              >
                <option value={1}>1 appareil (Standard)</option>
                <option value={2}>2 appareils (Couple)</option>
                <option value={5}>5 appareils (Famille)</option>
                <option value={10}>10 appareils (Maison / Petit bureau)</option>
                <option value={20}>20 appareils (Grande famille)</option>
                <option value={50}>50 appareils (Entreprise)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Le client pourra connecter ce nombre d'appareils avec un seul paiement.
              </p>
              {errors.max_devices && <p className="mt-1 text-sm text-red-600">{errors.max_devices}</p>}
            </div>

            {/* ... (Reste du formulaire inchangé) ... */}
            
            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-black to-gray-800 text-white font-semibold py-2 px-4 rounded-lg">
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