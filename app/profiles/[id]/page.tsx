'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { getProfile, updateProfile, deleteProfile, getRouters, type Router } from '@/lib/api';
import Link from 'next/link';
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

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [routers, setRouters] = useState<Router[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});

  const profileId = params.id ? parseInt(params.id as string) : null;

  const {
    register,
    handleSubmit,
    reset,
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

  useEffect(() => {
    if (!profileId) return;

    const fetchData = async () => {
      try {
        const [profileData, routersData] = await Promise.all([
          getProfile(profileId),
          getRouters(),
        ]);
        
        setProfile(profileData);
        
        // Transformer les routeurs (backend avec majuscules)
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
        
        // Remplir le formulaire avec les données existantes
        reset({
          router_id: profileData.router_id,
          profile_name: profileData.profile_name,
          duration_minutes: profileData.duration_minutes,
          price: profileData.price,
          currency: profileData.currency as 'XOF' | 'EUR' | 'USD',
          bandwidth_limit: profileData.bandwidth_limit || '',
          is_active: profileData.is_active,
        });
      } catch (error) {
        console.error('❌ Erreur:', error);
        toast.error('Erreur lors du chargement du forfait');
        router.push('/routers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [profileId, router, reset]);

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
        is_active: formData.is_active,
      };
      
      await updateProfile(profileId, apiData);
      toast.success('Forfait mis à jour avec succès !');
      
      // Rediriger vers les forfaits du routeur concerné
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
      
      // Rediriger vers la page précédente (probablement la liste des routeurs)
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

      <div className="max-w-2xl">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Sélection du routeur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Routeur associé
              </label>
              <select
                {...register('router_id', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-white"
              >
                <option value="">Sélectionnez un routeur</option>
                {routers.map((router) => {
                  // Générer une clé unique
                  const key = router?.id ? `router-${router.id}` : `router-${Math.random()}`;
                  
                  return (
                    <option key={key} value={router.id}>
                      {router.name} {router.is_active ? '' : '(inactif)'}
                    </option>
                  );
                })}
              </select>
              {errors.router_id && (
                <p className="mt-1 text-sm text-red-600">{errors.router_id}</p>
              )}
            </div>

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

            {/* Durée et prix */}
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
                Forfait actif
              </label>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-black to-gray-800 text-white font-semibold py-2 px-4 rounded-lg hover:from-gray-800 hover:to-black transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sauvegarde...
                  </div>
                ) : (
                  'Enregistrer les modifications'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
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