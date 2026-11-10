'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import api, { getRouter, getProfiles, updateRouter, type Router, type HotspotProfile } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Save, ShieldAlert, Copy, Check, Upload, ImageIcon, X } from 'lucide-react';
import { QuotaWidget } from '@/components/routers/QuotaWidget';

type RouterForm = {
  name: string;
  daily_quota_gb: number;
  portal_name: string;
  primary_color: string;
};

export default function RouterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [routerData, setRouterData] = useState<Router | null>(null);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // ✅ Logo (Cloudinary)
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const routerId = params.id ? parseInt(params.id as string) : null;

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<RouterForm>();

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

        const portalName = (routerRes as any).portal_name || (routerRes as any).PortalName || 'MbeejFepal';
        const primaryColor = (routerRes as any).primary_color || (routerRes as any).PrimaryColor || '#d97706';
        const logoURL = (routerRes as any).logo_url || (routerRes as any).LogoURL || '';
        const dailyQuota = (routerRes as any).daily_quota_gb ?? (routerRes as any).DailyQuotaGB ?? 0;

        reset({
          name: adaptedRouter.name,
          daily_quota_gb: dailyQuota,
          portal_name: portalName,
          primary_color: primaryColor,
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

  // ✅ NOUVEAU : Upload direct vers Cloudinary avec progression
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !routerId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (JPG, PNG, SVG...)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 2 Mo)');
      return;
    }

    setUploadingLogo(true);
    setUploadProgress(0);

    try {
      // 1. Demander une signature au backend
      const sigRes = await api.post(`/api/routers/${routerId}/logo/signature`);
      const { signature, timestamp, folder, public_id, api_key, cloud_name } = sigRes.data;

      // 2. Upload direct à Cloudinary via XMLHttpRequest (pour la progression)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('public_id', public_id);

      const uploadRes: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload Cloudinary échoué'));
          }
        };
        xhr.onerror = () => reject(new Error('Erreur réseau Cloudinary'));
        xhr.send(formData);
      });

      // 3. Sauvegarder l'URL + public_id en DB
      await api.put(`/api/routers/${routerId}/logo`, {
        logo_url: uploadRes.secure_url,
        logo_public_id: uploadRes.public_id,
      });

      setLogoPreview(uploadRes.secure_url);
      setRouterData((prev) => prev ? { ...prev, logo_url: uploadRes.secure_url } : null);
      toast.success('Logo mis à jour !');
    } catch (err: any) {
      toast.error(err.response?.data || err.message || 'Erreur upload logo');
    } finally {
      setUploadingLogo(false);
      setUploadProgress(0);
      // Reset input file
      e.target.value = '';
    }
  };

  const removeLogo = async () => {
    if (!routerId) return;
    if (!confirm('Supprimer le logo du portail ?')) return;

    try {
      // On envoie une URL vide + un public_id vide pour signaler la suppression
      // (le backend doit gérer ce cas : si logoURL vide, on efface)
      await api.put(`/api/routers/${routerId}/logo`, {
        logo_url: '',
        logo_public_id: '',
      });
      setLogoPreview('');
      setRouterData((prev) => prev ? { ...prev, logo_url: '' } : null);
      toast.success('Logo supprimé');
    } catch {
      toast.error('Erreur suppression logo');
    }
  };

  const onSubmit = async (data: RouterForm) => {
    if (!routerId) return;
    try {
      await updateRouter(routerId, {
        name: data.name,
        daily_quota_gb: data.daily_quota_gb,
        portal_name: data.portal_name,
        primary_color: data.primary_color,
        // ⚠️ PAS de logo_url : géré par /logo (Cloudinary)
      });
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
          toast.success('Commande copiée !');
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
      {/* HEADER */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-block bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
            DÉTAILS ROUTEUR
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{routerData.name}</h1>
          <p className="text-gray-400 text-sm mt-2">
            Gérez les paramètres, la personnalisation et les forfaits de ce routeur.
          </p>
        </div>
        <Link
          href="/routers"
          className="relative z-10 group flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-amber-400 hover:bg-[#d97706] hover:text-white hover:border-[#d97706] transition-all"
        >
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom du routeur</label>
                <input
                  {...register('name', { required: true })}
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition"
                />
              </div>

              {/* ✅ NOUVEAU : Upload logo Cloudinary */}
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-5 h-5 text-amber-500" />
                  <label className="block text-sm font-bold text-white">Logo du portail</label>
                </div>

                <div className="flex items-center gap-4">
                  {/* Aperçu */}
                  <div className="w-20 h-20 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    )}
                  </div>

                  {/* Boutons */}
                  <div className="flex-1 min-w-0">
                    <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all ${
                      uploadingLogo
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 active:scale-95'
                    }`}>
                      <Upload className="w-4 h-4" />
                      {uploadingLogo ? 'Upload...' : logoPreview ? 'Remplacer' : 'Choisir une image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                    {logoPreview && !uploadingLogo && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="ml-2 inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 active:scale-95 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Retirer
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-1.5">JPG, PNG, SVG — max 2 Mo</p>
                  </div>
                </div>

                {/* Barre de progression */}
                {uploadingLogo && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Upload... {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {/* Couleur principale */}
              <div className="pt-6 border-t border-white/10">
                <label className="block text-sm font-medium text-gray-300 mb-2">Couleur principale du portail</label>
                <div className="flex items-center gap-3">
                  <input
                    {...register('primary_color')}
                    type="color"
                    className="w-16 h-12 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
                  />
                  <input
                    {...register('primary_color')}
                    type="text"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition font-mono uppercase"
                  />
                </div>
              </div>

              {/* Nom du portail */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom du portail</label>
                <input
                  {...register('portal_name')}
                  type="text"
                  placeholder="Ex: Mon WiFi"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition"
                />
              </div>

              {/* Quota */}
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

              <button
                type="submit"
                disabled={isSubmitting || uploadingLogo}
                className="w-full bg-[#d97706] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#b45309] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>

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

        {/* Carte secondaire : Stats + Quota */}
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
              <QuotaWidget routerId={routerData.id} />

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