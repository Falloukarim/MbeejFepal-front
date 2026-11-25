'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { getProfile, updateProfile, deleteProfile, getRouters, type Router } from '@/lib/api';
import toast from 'react-hot-toast';
import { Sparkles, Wifi, Trash2, ArrowLeft } from 'lucide-react';

type ProfileForm = {
  router_id: number;
  profile_name: string;
  duration_value: number;
  duration_unit: 'minutes' | 'hours' | 'days';
  price: number;
  currency: 'XOF' | 'EUR' | 'USD';
  download_speed: number;
  upload_speed: number;
  max_devices: number;
  is_active: boolean;
};

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id ? parseInt(params.id as string) : null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [routers, setRouters] = useState<Router[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const { register, handleSubmit, reset, watch } = useForm<ProfileForm>({
    defaultValues: {
      router_id: 0,
      profile_name: '',
      duration_value: 1,
      duration_unit: 'days',
      price: 500,
      currency: 'XOF',
      download_speed: 10,
      upload_speed: 10,
      max_devices: 1,
      is_active: true,
    },
  });

  const watchDownload = watch('download_speed');
  const watchUpload = watch('upload_speed');

  useEffect(() => {
    if (!profileId) return;

    const fetchData = async () => {
      try {
        const [profileData, routersData] = await Promise.all([
          getProfile(profileId),
          getRouters(),
        ]);
        
        setProfile(profileData);
        
        const transformedRouters = routersData.map((item: any) => ({
          id: item.ID || item.id,
          user_id: item.UserID || item.user_id,
          name: item.Name || item.name || 'Sans nom',
          config_token: item.ConfigToken || item.config_token,
          is_active: item.IsActive !== undefined ? item.IsActive : (item.is_active || false),
          last_seen: item.LastSeen || item.last_seen || null,
          created_at: item.CreatedAt || item.created_at || new Date().toISOString()
        })).filter(r => r.id !== undefined && r.id !== null);
        
        setRouters(transformedRouters);

        // --- CONVERSION DES DONNÉES EXISTANTES ---
        // 1. Conversion de la durée en (valeur + unité)
        let durationVal = profileData.duration_minutes || 60;
        let durationUnit: 'minutes' | 'hours' | 'days' = 'minutes';
        
        if (durationVal % 1440 === 0) {
          durationVal = durationVal / 1440;
          durationUnit = 'days';
        } else if (durationVal % 60 === 0) {
          durationVal = durationVal / 60;
          durationUnit = 'hours';
        }

        // 2. Conversion du Bandwidth (ex: "10M/20M" ou "10M")
        let down = 10;
        let up = 10;
        if (profileData.bandwidth_limit) {
          if (profileData.bandwidth_limit.includes('/')) {
            const parts = profileData.bandwidth_limit.split('/');
            up = parseInt(parts[0]) || 10;
            down = parseInt(parts[1]) || 10;
          } else {
            const val = parseInt(profileData.bandwidth_limit) || 10;
            up = val;
            down = val;
          }
        }

        reset({
          router_id: profileData.router_id,
          profile_name: profileData.profile_name,
          duration_value: durationVal,
          duration_unit: durationUnit,
          price: profileData.price,
          currency: profileData.currency as any,
          download_speed: down,
          upload_speed: up,
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

  const onSubmit = async (formData: ProfileForm) => {
    if (!profileId) return;

    // Conversion de la durée en minutes
    let durationInMinutes = formData.duration_value;
    if (formData.duration_unit === 'hours') durationInMinutes *= 60;
    if (formData.duration_unit === 'days') durationInMinutes *= 1440;

    setIsSaving(true);
    try {
      const rateLimitString = `${formData.upload_speed}M/${formData.download_speed}M`;

      const apiData = {
        router_id: formData.router_id,
        profile_name: formData.profile_name,
        duration_minutes: durationInMinutes,
        price: formData.price,
        currency: formData.currency,
        bandwidth_limit: rateLimitString,
        max_devices: formData.max_devices, // ✅ Envoyé au backend
        is_active: formData.is_active,
      };
      
      await updateProfile(profileId, apiData);
      toast.success('Forfait mis à jour !');
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
    setIsDeleting(true);
    try {
      await deleteProfile(profileId);
      toast.success('Forfait supprimé');
      router.back();
    } catch {
      toast.error('Erreur lors de la suppression');
      setIsDeleting(false);
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
      {/* ===== HEADER ===== */}
      <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
              <Sparkles className="w-3.5 h-3.5" /> Modification
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {profile?.profile_name || 'Modifier le forfait'}
            </h1>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>

      {/* ===== FORMULAIRE ===== */}
      <div className="max-w-2xl relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl p-8 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Routeur associé</label>
              <select {...register('router_id', { valueAsNumber: true })} className="w-full px-4 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-lg outline-none cursor-not-allowed [&>option]:bg-gray-900" disabled>
                {routers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Le routeur ne peut pas être modifié après création.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom du forfait</label>
              <input {...register('profile_name')} type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Durée du forfait</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input {...register('duration_value', { valueAsNumber: true })} type="number" min="1" className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div className="flex-1">
                  <select {...register('duration_unit')} className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none [&>option]:bg-gray-900">
                    <option value="minutes">Minutes</option>
                    <option value="hours">Heures</option>
                    <option value="days">Jours</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prix</label>
              <input {...register('price', { valueAsNumber: true })} type="number" className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre d'appareils inclus</label>
              <select {...register('max_devices', { valueAsNumber: true })} className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none [&>option]:bg-gray-900">
                <option value={1}>1 appareil (Standard)</option>
                <option value={2}>2 appareils</option>
                <option value={5}>5 appareils (Famille)</option>
                <option value={10}>10 appareils (Maison)</option>
                <option value={20}>20 appareils</option>
                <option value={50}>50 appareils (Entreprise)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Devise</label>
              <select {...register('currency')} className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none [&>option]:bg-gray-900">
                <option value="XOF">FCFA (XOF)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar (USD)</option>
              </select>
            </div>

            {/* GESTION DU DÉBIT */}
            <div className="pt-4 border-t border-white/10">
              <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-amber-500" /> Limite de débit (Vitesse)
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Téléchargement (Down)</label>
                  <div className="relative">
                    <input {...register('download_speed', { valueAsNumber: true })} type="number" min="1" className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none pr-10" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Mbps</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Envoi (Up)</label>
                  <div className="relative">
                    <input {...register('upload_speed', { valueAsNumber: true })} type="number" min="1" className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none pr-10" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Mbps</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Rate limit généré</p>
                  <p className="text-lg font-bold text-amber-500">{watchUpload || '0'}M / {watchDownload || '0'}M</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input {...register('is_active')} type="checkbox" className="w-5 h-5 text-amber-500 bg-white/5 border-white/10 rounded focus:ring-amber-500" />
              <label className="text-sm text-gray-300">Forfait actif</label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
              <button type="submit" disabled={isSaving} className="flex-1 bg-[#d97706] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#b45309] transition-all shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                {isSaving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
              </button>
              
              <button type="button" onClick={handleDelete} disabled={isDeleting} className="px-6 py-3 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors font-bold flex items-center justify-center gap-2">
                <Trash2 className="w-5 h-5" /> {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}