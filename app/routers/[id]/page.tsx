'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getRouter, getProfiles, type Router, type HotspotProfile } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RouterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [routerData, setRouterData] = useState<Router | null>(null);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const routerId = params.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    if (!routerId) return;
    
    const fetchData = async () => {
      try {
        const [routerRes, profilesRes] = await Promise.all([
          getRouter(routerId),
          getProfiles(routerId),
        ]);
        setRouterData(routerRes);
        setProfiles(profilesRes);
      } catch (error) {
        toast.error('Erreur lors du chargement des données');
        router.push('/routers');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [routerId, router]);

  const copyCommand = () => {
    if (routerData) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';
      const command = `/tool fetch url="${apiUrl}/routers/configure/${routerData.config_token}" mode=https dst-path=monwifi\n/import monwifi`;
      navigator.clipboard.writeText(command);
      toast.success('Commande copiée dans le presse-papiers !');
    }
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

  if (!routerData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Routeur non trouvé</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* En-tête */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{routerData.name}</h1>
          <p className="text-gray-600 mt-2">Détails et configuration du routeur</p>
        </div>
        <Link
          href="/routers"
          className="text-amber-600 hover:text-amber-700 font-medium transition-colors flex items-center gap-2"
        >
          ← Retour à la liste
        </Link>
      </div>

      {/* Informations du routeur */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Carte principale */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations générales</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Statut</span>
              <span
                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  routerData.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {routerData.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Dernière vue</span>
              <span className="text-gray-900">
                {routerData.last_seen ? new Date(routerData.last_seen).toLocaleString() : 'Jamais'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Créé le</span>
              <span className="text-gray-900">
                {new Date(routerData.created_at).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Token de configuration</span>
              <span className="text-gray-900 font-mono text-sm">
                {routerData.config_token.substring(0, 8)}...
              </span>
            </div>
          </div>

          {/* Bouton de copie de commande */}
          <button
            onClick={copyCommand}
            className="mt-6 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>📋</span>
            Copier la commande d'installation
          </button>
        </div>

        {/* Carte secondaire */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistiques</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Forfaits associés</p>
              <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Forfaits actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {profiles.filter(p => p.is_active).length}
              </p>
            </div>

            <Link
              href={`/profiles/new?router_id=${routerData.id}`}
              className="mt-4 inline-block w-full text-center text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              + Ajouter un forfait
            </Link>
          </div>
        </div>
      </div>

      {/* Liste des forfaits */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-semibold text-gray-900">Forfaits du routeur</h2>
        </div>
        
        {profiles.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {profiles.map((profile) => (
              <div key={profile.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{profile.profile_name}</p>
                  <p className="text-sm text-gray-500">
                    {profile.duration_minutes} min • {profile.price.toLocaleString()} {profile.currency}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      profile.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {profile.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  <Link
                    href={`/profiles/${profile.id}`}
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="mb-4">Aucun forfait associé à ce routeur</p>
            <Link
              href={`/profiles/new?router_id=${routerData.id}`}
              className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
            >
              <span>+</span>
              Créer un forfait
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}