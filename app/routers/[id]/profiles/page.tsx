'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getProfiles, deleteProfile, getRouter, type HotspotProfile, type Router } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RouterProfilesPage() {
  const params = useParams();
  const router = useRouter();
  const routerId = params.id ? parseInt(params.id as string) : null;
  
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [currentRouter, setCurrentRouter] = useState<Router | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!routerId) return;
    loadData();
  }, [routerId]);

  const loadData = async () => {
    try {
      const [routerData, profilesData] = await Promise.all([
        getRouter(routerId!),
        getProfiles(routerId!)
      ]);
      
      const transformedProfiles: HotspotProfile[] = Array.isArray(profilesData)
        ? profilesData.map((item: any): HotspotProfile => ({
            id: item.ID ?? item.id,
            router_id: item.RouterID ?? item.router_id,
            profile_name: item.ProfileName ?? item.profile_name,
            duration_minutes: item.DurationMinutes ?? item.duration_minutes,
            price: item.Price ?? item.price,
            currency: item.Currency ?? item.currency ?? 'XOF',
            bandwidth_limit: item.BandwidthLimit ?? item.bandwidth_limit,
            max_devices: item.MaxDevices ?? item.max_devices ?? 1,
            is_active: item.IsActive ?? item.is_active ?? false,
            created_at: item.CreatedAt ?? item.created_at,
            updated_at: item.UpdatedAt ?? item.updated_at,
          }))
        : [];
      
      setCurrentRouter(routerData);
      setProfiles(transformedProfiles);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce forfait ?')) return;
    try {
      await deleteProfile(id);
      toast.success('Forfait supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString()} ${currency}`;
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Forfaits du routeur</h1>
          <p className="text-gray-600 mt-1">{currentRouter?.name}</p>
        </div>
        <Link
          href={`/profiles/new?router_id=${routerId}`}
          className="bg-[#d97706] text-white font-semibold py-2 px-4 rounded-xl hover:bg-[#b45309] transition-all shadow-lg flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Nouveau forfait
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl border border-white/10 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    profile.is_active
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {profile.is_active ? 'Actif' : 'Inactif'}
                </span>
                <span className="text-2xl">🏷️</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                {profile.profile_name}
              </h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Durée</span>
                  <span className="font-medium text-gray-200">
                    {profile.duration_minutes} minutes
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Prix</span>
                  <span className="text-2xl font-extrabold text-amber-500">
                    {formatPrice(profile.price, profile.currency)}
                  </span>
                </div>
                {profile.bandwidth_limit && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Débit max</span>
                    <span className="text-gray-200">{profile.bandwidth_limit}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <Link
                  href={`/profiles/${profile.id}`}
                  className="text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
                >
                  Modifier
                </Link>
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {profiles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4 opacity-50">🏷️</div>
            <p className="text-lg text-gray-500 mb-4">Aucun forfait pour ce routeur</p>
            <Link
              href={`/profiles/new?router_id=${routerId}`}
              className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium"
            >
              <span>+</span>
              Créer votre premier forfait
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}