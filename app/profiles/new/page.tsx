'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { createProfile, getRouters, type Router } from '@/lib/api';
import toast from 'react-hot-toast';

// Type explicite pour le formulaire
type ProfileForm = {
  router_id: number;
  profile_name: string;
  duration_minutes: number;
  price: number;
  currency: 'XOF' | 'EUR' | 'USD';
  bandwidth_limit?: string | null;
  is_active: boolean;
};

export default function NewProfilePage() {
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
    formState: { errors: formErrors },
  } = useForm<ProfileForm>({
    defaultValues: {
      router_id: 0,
      profile_name: '',
      duration_minutes: 60,
      price: 500,
      currency: 'XOF',
      bandwidth_limit: '',
      is_active: true,
    },
  });

  const routerId = watch('router_id');

  // Charger la liste des routeurs
  useEffect(() => {
    const loadRouters = async () => {
      try {
        const data = await getRouters();
        console.log('📡 Routeurs reçus:', data);
        
        // Transformer les données
        const transformedRouters = data.map((item: any) => ({
          id: item.ID || item.id,
          user_id: item.UserID || item.user_id,
          name: item.Name || item.name || 'Sans nom',
          config_token: item.ConfigToken || item.config_token,
          is_active: item.IsActive !== undefined ? item.IsActive : (item.is_active || false),
          last_seen: item.LastSeen || item.last_seen || null,
          created_at: item.CreatedAt || item.created_at || new Date().toISOString()
        }));
        
        const validRouters = transformedRouters.filter(r => r.id !== undefined && r.id !== null);
        setRouters(validRouters);
        
        // Pré-sélectionner le routeur depuis l'URL
        const routerIdParam = searchParams.get('router_id');
        if (routerIdParam) {
          const id = parseInt(routerIdParam);
          setValue('router_id', id);
          const router = validRouters.find(r => r.id === id);
          setSelectedRouter(router || null);
        }
      } catch (error) {
        console.error('❌ Erreur chargement routeurs:', error);
        toast.error('Erreur lors du chargement des routeurs');
      }
    };
    loadRouters();
  }, [searchParams, setValue]);

  // Validation manuelle
  const validateForm = (data: ProfileForm): boolean => {
    const newErrors: Partial<Record<keyof ProfileForm, string>> = {};
    
    if (!data.router_id || data.router_id === 0) {
      newErrors.router_id = 'Veuillez sélectionner un routeur';
    }
    
    if (!data.profile_name || data.profile_name.length < 3) {
      newErrors.profile_name = 'Le nom doit contenir au moins 3 caractères';
    }
    
    if (!data.duration_minutes || data.duration_minutes < 1) {
      newErrors.duration_minutes = 'La durée doit être positive';
    }
    
    if (!data.price || data.price < 1) {
      newErrors.price = 'Le prix doit être positif';
    }
    
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
          {selectedRouter 
            ? `Créer un forfait pour le routeur : ${selectedRouter.name}`
            : 'Créez une nouvelle offre de connexion'
          }
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Sélection du routeur - caché si déjà sélectionné via l'URL */}
            {searchParams.get('router_id') ? (
              // Mode lecture seule
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routeur associé
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                  {selectedRouter ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedRouter.name}</span>
                      {!selectedRouter.is_active && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Inactif</span>
                      )}
                    </div>
                  ) : (
                    <span>Chargement...</span>
                  )}
                </div>
                <input type="hidden" {...register('router_id', { valueAsNumber: true })} />
              </div>
            ) : (
              // Mode sélection normale
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routeur associé
                </label>
                <select
                  {...register('router_id', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-white"
                >
                  <option value="">Sélectionnez un routeur</option>
                  {routers.map((router) => (
                    <option key={router.id} value={router.id}>
                      {router.name} {router.is_active ? '' : '(inactif)'}
                    </option>
                  ))}
                </select>
                {errors.router_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.router_id}</p>
                )}
              </div>
            )}

            {/* Nom du forfait */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du forfait
              </label>
              <input
                {...register('profile_name')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                placeholder="Ex: Forfait Premium"
              />
              {errors.profile_name && (
                <p className="mt-1 text-sm text-red-600">{errors.profile_name}</p>
              )}
            </div>

            {/* Durée et prix (inchangé) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (minutes)
                </label>
                <input
                  {...register('duration_minutes', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                  placeholder="60"
                />
                {errors.duration_minutes && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration_minutes}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix
                </label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="1"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                  placeholder="500"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Devise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devise
              </label>
              <select
                {...register('currency')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-white"
              >
                <option value="XOF">FCFA (XOF)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar (USD)</option>
              </select>
            </div>

            {/* Limite de débit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite de débit (optionnel)
              </label>
              <input
                {...register('bandwidth_limit')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                placeholder="Ex: 10Mbps"
              />
            </div>

            {/* Option active */}
            <div className="flex items-center">
              <input
                {...register('is_active')}
                type="checkbox"
                className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Activer ce forfait immédiatement
              </label>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-black to-gray-800 text-white font-semibold py-2 px-4 rounded-lg hover:from-gray-800 hover:to-black transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Création...
                </div>
              ) : (
                'Créer le forfait'
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}