'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getRouter, getProfiles, updateRouter, type Router, type HotspotProfile } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Save, ShieldAlert, Copy, Check, Upload, X } from 'lucide-react';

type RouterForm = {
  name: string;
  daily_quota_gb: number;
  portal_name: string;
  primary_color: string;
  logo_url: string;
};

export default function RouterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [routerData, setRouterData] = useState<Router | null>(null);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const routerId = params.id ? parseInt(params.id as string) : null;

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<RouterForm>();

  useEffect(() => {
    if (!routerId) return;

    const fetchData = async () => {
      try {
        const [routerRes, profilesRes] = await Promise.all([
          getRouter(routerId),
          getProfiles(routerId),
        ]);

        const adaptedRouter: Router = {
          id: (routerRes as any).ID || (routerRes as any).id,
          name: (routerRes as any).Name || (routerRes as any).name || '',
          config_token: (routerRes as any).ConfigToken || (routerRes as any).config_token || '',
          is_active: (routerRes as any).IsActive ?? (routerRes as any).is_active ?? false,
          last_seen: (routerRes as any).LastSeen || (routerRes as any).last_seen || null,
          created_at: (routerRes as any).CreatedAt || (routerRes as any).created_at || '',
        };

        if (!adaptedRouter.id) {
          toast.error('Routeur non trouvé');
          router.push('/routers');
          return;
        }

        setRouterData(adaptedRouter);
        setProfiles(Array.isArray(profilesRes) ? profilesRes : []);

        // ✅ Récupération des champs de personnalisation (snake_case ou PascalCase)
        const portalName =
          (routerRes as any).portal_name ||
          (routerRes as any).PortalName ||
          'MbeejFepal';
        const primaryColor =
          (routerRes as any).primary_color ||
          (routerRes as any).PrimaryColor ||
          '#d97706';
        const logoURL =
          (routerRes as any).logo_url ||
          (routerRes as any).LogoURL ||
          '';
        const dailyQuota =
          (routerRes as any).daily_quota_gb ??
          (routerRes as any).DailyQuotaGB ??
          0;

        reset({
          name: adaptedRouter.name,
          daily_quota_gb: dailyQuota,
          portal_name: portalName,
          primary_color: primaryColor,
          logo_url: logoURL,
        });

        setLogoPreview(logoURL);

      } catch (error) {
        toast.error('Erreur lors du chargement des données');
        router.push('/routers');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routerId, router, reset]);

  // ✅ Upload du logo en Base64 (max 200 Ko)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (JPG, PNG, SVG...)');
      return;
    }

    if (file.size > 200 * 1024) {
      toast.error('Image trop volumineuse (max 200 Ko). Compressez-la avant.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLogoPreview(base64);
      setValue('logo_url', base64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: RouterForm) => {
    if (!routerId) return;
    try {
      await updateRouter(routerId, data);
      toast.success('Routeur mis à jour avec succès !');
      setRouterData((prev) => prev ? { ...prev, name: data.name } : null);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const copyCommand = () => {
    if (routerData?.config_token) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';
      const command = `/tool fetch url="${apiUrl}/routers/configure/${routerData.config_token}" mode=https dst-path=monwifi\n/import monwifi`;

      navigator.clipboard.writeText(command)
        .then(() => {
          setCopied(true);
          toast.success('✓ Commande copiée !', {
            style: { background: '#10b981', color: '#fff', borderRadius: '12px' },
            duration: 2000,
          });
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => toast.error('Erreur lors de la copie'));
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date inconnue';
      return date.toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Date inconnue'; }
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

  if (!routerData) return null;

  return (
    <Layout>
      <div className="relative z-10 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-block bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
            DÉTAILS ROUTEUR
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{routerData.name}</h1>
        </div>
        <Link href="/routers" className="group flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-200 rounded-xl text-[#d97706] hover:bg-[#d97706] hover:text-white transition-all">
          ← Retour
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Carte principale : Formulaire d'édition */}
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-xl p-8 border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Modifier les paramètres
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nom du routeur */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom du routeur</label>
                <input
                  {...register('name', { required: true })}
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition"
                />
              </div>

              {/* Quota journalier */}
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <label className="block text-sm font-bold text-white">
                    Limite de consommation journalière
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    {...register('daily_quota_gb', { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-32 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition text-lg font-bold"
                  />
                  <span className="text-gray-400 font-medium">Gigaoctets (Go) / jour</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  L'accès Internet de tous les clients sera coupé si le quota est dépassé. La limite est réinitialisée chaque jour à minuit. <strong className="text-gray-300">0 = Illimité.</strong>
                </p>
              </div>

              {/* ✅ SECTION PERSONNALISATION */}
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">🎨</span> Personnalisation du portail
                </h3>

                <div className="space-y-4">
                  {/* Nom du Wi-Fi / portail */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nom de votre Wi-Fi</label>
                    <input
                      {...register('portal_name')}
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition"
                      placeholder="Ex: Cybercafé Chez Ali"
                    />
                  </div>

                  {/* Couleur principale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Couleur principale</label>
                    <div className="flex items-center gap-4">
                      <input
                        {...register('primary_color')}
                        type="color"
                        className="w-16 h-12 bg-white/5 border border-white/10 rounded-lg cursor-pointer p-1"
                      />
                      <span className="text-sm text-gray-400">Couleur des boutons et de l'en-tête</span>
                    </div>
                  </div>

                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Logo du portail</label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 flex-shrink-0">
                          <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0">
                          <Upload className="w-8 h-8 text-gray-500" />
                        </div>
                      )}

                      <label className="flex-1 cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl hover:bg-white/10 hover:border-amber-500/50 transition-all text-sm text-gray-300">
                          <Upload className="w-4 h-4" />
                          {logoPreview ? 'Changer le logo' : 'Choisir une image'}
                        </div>
                      </label>

                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => { setLogoPreview(''); setValue('logo_url', ''); }}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Supprimer le logo"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <input type="hidden" {...register('logo_url')} />
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG ou SVG. Max 200 Ko.</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#d97706] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#b45309] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>

            {/* Infos de configuration */}
            <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-gray-400 text-sm">Statut</span>
                <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${routerData.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                  {routerData.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-gray-400 text-sm">Dernière vue</span>
                <span className="text-gray-200 text-sm">{routerData.last_seen ? formatDate(routerData.last_seen) : 'Jamais'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
              </div>
            </div>

            <button
              onClick={copyCommand}
              disabled={!routerData.config_token || copied}
              className={`mt-6 w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                routerData.config_token
                  ? copied ? 'bg-green-500 text-white scale-105' : 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              {copied ? <><Check className="w-5 h-5" /> Copié !</> : <><Copy className="w-5 h-5" /> Copier la commande d'installation</>}
            </button>
          </div>
        </div>

        {/* Carte secondaire : Stats */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-xl p-6 border border-white/10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" strokeLinecap="round" />
                <path d="M18 17V9" strokeLinecap="round" />
                <path d="M12 17V5" strokeLinecap="round" />
                <path d="M6 17v-3" strokeLinecap="round" />
              </svg>
              Statistiques
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-sm text-gray-400 mb-1">Forfaits associés</p>
                <p className="text-2xl font-bold text-white">{profiles.length}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-sm text-gray-400 mb-1">Forfaits actifs</p>
                <p className="text-2xl font-bold text-amber-500">{profiles.filter(p => p.is_active).length}</p>
              </div>
              <Link
                href={`/profiles/new?router_id=${routerData.id}`}
                className="mt-4 w-full py-3 px-4 bg-[#d97706] text-white rounded-xl hover:bg-[#b45309] transition-all font-medium flex justify-center shadow-lg"
              >
                + Ajouter un forfait
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des forfaits */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-semibold text-white">
            Forfaits du routeur
          </h2>
        </div>

        {profiles.length > 0 ? (
          <div className="relative z-10 divide-y divide-white/10">
            {profiles.map((profile) => (
              <div key={profile.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div>
                  <p className="font-medium text-white">{profile.profile_name}</p>
                  <p className="text-sm text-gray-400">{profile.duration_minutes} min • {profile.price.toLocaleString()} {profile.currency}</p>
                </div>
                <Link href={`/profiles/${profile.id}`} className="text-amber-500 font-medium hover:text-amber-400 text-sm">
                  Modifier
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative z-10 px-6 py-8 text-center text-gray-500">
            Aucun forfait associé.
          </div>
        )}
      </div>
    </Layout>
  );
}