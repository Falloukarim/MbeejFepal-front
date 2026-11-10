'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import api, { getRouter, getProfiles, updateRouter, type Router, type HotspotProfile } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  Save, ShieldAlert, Copy, Check, Upload, ImageIcon, X, ArrowLeft, Wifi, Clock, Package,
  Palette, Terminal, Plus, Settings2, Smartphone, Monitor, RotateCcw, Gauge, Activity,
  Infinity as InfinityIcon, Loader2, // ✅ Ajout de Loader2 pour le spinner
} from 'lucide-react';
import { QuotaWidget } from '@/components/routers/QuotaWidget';

type RouterForm = {
  name: string;
  daily_quota_gb: number;
  portal_name: string;
  primary_color: string;
};

type TabKey = 'portal' | 'general' | 'plans' | 'install';
type Device = 'mobile' | 'desktop';

const DEFAULT_COLOR = '#d97706';
const COLOR_PRESETS = [
  '#d97706', '#ea580c', '#dc2626', '#db2777', '#9333ea', '#4f46e5',
  '#2563eb', '#0891b2', '#0d9488', '#16a34a', '#65a30d', '#111827',
];
const QUOTA_PRESETS = [0, 1, 2, 5, 10, 20];
const HEX_RE = /^#([0-9a-fA-F]{6})$/;

/* ---------- Helpers ---------- */

const readableOn = (hex: string) => {
  const h = HEX_RE.test(hex) ? hex : DEFAULT_COLOR;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111827' : '#ffffff';
};

const formatDuration = (min: number) => {
  if (!min && min !== 0) return '—';
  if (min < 60) return `${min} min`;
  if (min < 1440) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const d = Math.floor(min / 1440);
  return `${d} jour${d > 1 ? 's' : ''}`;
};

const relativeTime = (dateString?: string | null) => {
  if (!dateString) return 'Jamais';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Date inconnue';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `Il y a ${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/* ---------- UI atoms ---------- */

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500';

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black shadow-xl ${className}`}>
      <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function Stat({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-1.5 flex items-center gap-2 text-gray-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{children}</div>
    </div>
  );
}

/* ---------- Aperçu complet du portail ---------- */

function PortalPreview({
  name, color, logo, profiles, device,
}: { name: string; color: string; logo: string; profiles: HotspotProfile[]; device: Device }) {
  const c = HEX_RE.test(color) ? color : DEFAULT_COLOR;
  const onC = readableOn(c);
  const title = name || 'Mon WiFi';

  const realPlans = profiles.filter((p) => p.is_active).slice(0, 3);
  const plans = realPlans.length
    ? realPlans.map((p) => ({
        label: p.profile_name,
        duration: formatDuration(p.duration_minutes),
        price: `${p.price.toLocaleString('fr-FR')} ${p.currency}`,
      }))
    : [
        { label: 'Pass 1 heure', duration: '1 h', price: '200 XOF' },
        { label: 'Pass 1 jour', duration: '1 jour', price: '500 XOF' },
        { label: 'Pass 7 jours', duration: '7 jours', price: '2 500 XOF' },
      ];

  const LogoBubble = ({ size }: { size: string }) => (
    <div className={`${size} flex items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg`}>
      {logo ? <img src={logo} alt="" className="h-full w-full object-contain p-1.5" /> : <Wifi className="h-1/2 w-1/2" style={{ color: c }} />}
    </div>
  );

  const Form = () => (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-[11px] font-semibold text-gray-700">Code voucher</p>
        <div className="rounded-xl border-2 px-3 py-2.5 text-xs text-gray-400" style={{ borderColor: `${c}55` }}>
          Entrez votre code
        </div>
      </div>
      <div className="rounded-xl py-3 text-center text-sm font-bold shadow-md" style={{ backgroundColor: c, color: onC }}>
        Se connecter
      </div>
      <div className="flex items-center gap-2 py-1">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-[10px] uppercase tracking-wide text-gray-400">ou achetez un forfait</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="space-y-2">
        {plans.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border px-3 py-2.5"
            style={{ borderColor: i === 0 ? c : '#e5e7eb', backgroundColor: i === 0 ? `${c}14` : '#fff' }}
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-gray-800">{p.label}</p>
              <p className="text-[10px] text-gray-500">{p.duration}</p>
            </div>
            <span className="ml-2 shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: c, color: onC }}>
              {p.price}
            </span>
          </div>
        ))}
      </div>
      <p className="pt-1 text-center text-[10px] text-gray-400">Besoin d’aide ? Contactez l’accueil.</p>
    </div>
  );

  if (device === 'mobile') {
    return (
      <div className="mx-auto w-full max-w-[330px] rounded-[40px] border-[6px] border-gray-700 bg-gray-950 p-1.5 shadow-2xl">
        <div className="mx-auto mb-1.5 h-1.5 w-16 rounded-full bg-gray-700" />
        <div className="max-h-[680px] overflow-hidden rounded-[28px] bg-white">
          <div className="px-5 pb-6 pt-8 text-center" style={{ background: `linear-gradient(160deg, ${c}, ${c}cc)`, color: onC }}>
            <div className="mx-auto mb-3 h-20 w-20"><LogoBubble size="h-20 w-20" /></div>
            <p className="text-lg font-extrabold leading-tight">{title}</p>
            <p className="mt-1 text-xs opacity-80">Bienvenue ! Connectez-vous à Internet</p>
          </div>
          <div className="-mt-3 rounded-t-3xl bg-white p-4"><Form /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-800 shadow-2xl">
      <div className="flex items-center gap-2 bg-gray-800 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
        <span className="h-3 w-3 rounded-full bg-green-400/80" />
        <div className="ml-3 flex-1 rounded-md bg-gray-900 px-3 py-1 text-center text-[11px] text-gray-500">wifi.portail/login</div>
      </div>
      <div className="grid min-h-[420px] grid-cols-5 bg-white">
        <div className="col-span-2 flex flex-col items-center justify-center p-6 text-center" style={{ background: `linear-gradient(160deg, ${c}, ${c}bb)`, color: onC }}>
          <LogoBubble size="h-24 w-24" />
          <p className="mt-4 text-2xl font-extrabold leading-tight">{title}</p>
          <p className="mt-1 text-sm opacity-80">Bienvenue ! Connectez-vous à Internet</p>
        </div>
        <div className="col-span-3 flex items-center p-6"><div className="w-full"><Form /></div></div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function RouterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [routerData, setRouterData] = useState<Router | null>(null);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<TabKey>('portal');
  const [device, setDevice] = useState<Device>('mobile');

  // Logo (Cloudinary)
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [removingLogo, setRemovingLogo] = useState(false); // ✅ NOUVEAU STATE
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const routerId = params.id ? parseInt(params.id as string) : null;

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { isSubmitting, isDirty },
  } = useForm<RouterForm>();

  const watchedPortal = watch('portal_name');
  const watchedColor = watch('primary_color') || DEFAULT_COLOR;
  const watchedQuota = watch('daily_quota_gb');
  const validColor = HEX_RE.test(watchedColor) ? watchedColor : DEFAULT_COLOR;

  useEffect(() => {
    if (!routerId) return;

    const fetchData = async () => {
      try {
        const [routerRes, profilesRes] = await Promise.all([getRouter(routerId), getProfiles(routerId)]);

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
        const primaryColor = (routerRes as any).primary_color || (routerRes as any).PrimaryColor || DEFAULT_COLOR;
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

  const uploadLogoFile = async (file: File) => {
    if (!routerId) return;
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
      const sigRes = await api.post(`/api/routers/${routerId}/logo/signature`);
      const { signature, timestamp, public_id, api_key, cloud_name } = sigRes.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('public_id', public_id);

      const uploadRes: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => (xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error('Upload Cloudinary échoué')));
        xhr.onerror = () => reject(new Error('Erreur réseau Cloudinary'));
        xhr.send(formData);
      });

      await api.put(`/api/routers/${routerId}/logo`, {
        logo_url: uploadRes.secure_url,
        logo_public_id: uploadRes.public_id,
      });

      setLogoPreview(uploadRes.secure_url);
      setRouterData((prev) => (prev ? { ...prev, logo_url: uploadRes.secure_url } : null));
      toast.success('Logo mis à jour !');
    } catch (err: any) {
      toast.error(err.response?.data || err.message || 'Erreur upload logo');
    } finally {
      setUploadingLogo(false);
      setUploadProgress(0);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadLogoFile(file);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploadingLogo) return;
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadLogoFile(file);
  };

  // ✅ NOUVELLE FONCTION REMOVELOGO AVEC GESTION DE CHARGEMENT
  const removeLogo = async () => {
    if (!routerId) return;
    if (!confirm('Supprimer le logo du portail ?')) return;

    setRemovingLogo(true);
    try {
      await api.put(`/api/routers/${routerId}/logo`, {
        logo_url: '',
        logo_public_id: '',
      });
      setLogoPreview('');
      setRouterData((prev) => (prev ? { ...prev, logo_url: '' } : null));
      toast.success('Logo supprimé');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data || 'Erreur lors de la suppression du logo');
    } finally {
      setRemovingLogo(false);
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
      });
      toast.success('Routeur mis à jour avec succès !');
      setRouterData((prev) => (prev ? { ...prev, name: data.name } : null));
      reset(data);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const installCommand = routerData?.config_token
    ? `/tool fetch url="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090'}/routers/configure/${routerData.config_token}" mode=https dst-path=monwifi\n/import monwifi`
    : '';

  const copyCommand = () => {
    if (!installCommand) return;
    navigator.clipboard
      .writeText(installCommand)
      .then(() => {
        setCopied(true);
        toast.success('Commande copiée !');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Erreur lors de la copie'));
  };

  /* ---------- Chargement ---------- */
  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-2xl bg-white/5" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/5" />)}
          </div>
          <div className="h-[520px] rounded-3xl bg-white/5" />
        </div>
      </Layout>
    );
  }

  if (!routerData) return null;

  const activeProfiles = profiles.filter((p) => p.is_active).length;
  const isOnline = routerData.is_active;

  const tabs: { key: TabKey; label: string; icon: any; badge?: number }[] = [
    { key: 'portal', label: 'Portail', icon: Palette },
    { key: 'general', label: 'Général & quota', icon: Settings2 },
    { key: 'plans', label: 'Forfaits', icon: Package, badge: profiles.length },
    { key: 'install', label: 'Installation', icon: Terminal },
  ];

  return (
    <Layout>
      {/* ============ HEADER ============ */}
      <div className="relative mb-6 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-6 shadow-xl sm:flex-row sm:items-center">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" /> : <Wifi className="h-6 w-6 text-amber-500" />}
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">{routerData.name}</h1>
            </div>
            <p className="text-sm text-gray-400">Personnalisez le portail, réglez le quota et gérez les forfaits.</p>
          </div>
        </div>
        <Link href="/routers" className="relative z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-amber-400 transition-all hover:border-[#d97706] hover:bg-[#d97706] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      </div>

      {/* ============ BANDE DE STATS ============ */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Activity} label="Statut">{isOnline ? 'En ligne' : 'Hors ligne'}</Stat>
        <Stat icon={Clock} label="Dernière vue">{relativeTime(routerData.last_seen)}</Stat>
        <Stat icon={Package} label="Forfaits actifs">
          <span className="text-amber-500">{activeProfiles}</span>
          <span className="text-sm font-medium text-gray-500"> / {profiles.length}</span>
        </Stat>
        <Stat icon={Gauge} label="Quota journalier">
          {Number(watchedQuota) > 0 ? `${watchedQuota} Go` : <span className="inline-flex items-center gap-1"><InfinityIcon className="h-5 w-5" /> Illimité</span>}
        </Stat>
      </div>

      {/* ============ ONGLETS ============ */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-[#d97706] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.badge !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === t.key ? 'bg-white/20' : 'bg-white/10'}`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ============ FORMULAIRE ============ */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ---------- ONGLET PORTAIL ---------- */}
        <div className={tab === 'portal' ? 'grid grid-cols-1 items-start gap-6 lg:grid-cols-[400px_1fr]' : 'hidden'}>
          {/* Réglages */}
          <div className="order-2 space-y-5 lg:order-1">
            <Panel className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                <Palette className="h-5 w-5 text-amber-500" /> Couleur principale
              </h3>

              <div className="flex items-center gap-3">
                <label className="relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 border-white/20 shadow-lg" style={{ backgroundColor: validColor }}>
                  <input
                    type="color"
                    value={validColor}
                    onChange={(e) => setValue('primary_color', e.target.value, { shouldDirty: true })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
                <input
                  {...register('primary_color', { pattern: HEX_RE })}
                  type="text"
                  maxLength={7}
                  placeholder="#D97706"
                  className={`${inputCls} flex-1 font-mono uppercase`}
                />
                <button
                  type="button"
                  title="Couleur par défaut"
                  onClick={() => setValue('primary_color', DEFAULT_COLOR, { shouldDirty: true })}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-6 gap-2">
                {COLOR_PRESETS.map((c) => {
                  const selected = validColor.toLowerCase() === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Couleur ${c}`}
                      onClick={() => setValue('primary_color', c, { shouldDirty: true })}
                      className={`flex aspect-square items-center justify-center rounded-xl border-2 transition-transform hover:scale-110 ${selected ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    >
                      {selected && <Check className="h-4 w-4" style={{ color: readableOn(c) }} />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-gray-500">Le texte des boutons s’adapte automatiquement pour rester lisible.</p>
            </Panel>

            <Panel className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                <ImageIcon className="h-5 w-5 text-amber-500" /> Logo & nom
              </h3>

              <div
                onDragOver={(e) => { e.preventDefault(); if (!uploadingLogo) setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex items-center gap-4 rounded-2xl border-2 border-dashed p-3 transition-colors ${dragOver ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/[0.02]'}`}
              >
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" /> : <ImageIcon className="h-8 w-8 text-gray-600" />}
                  {uploadingLogo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-bold text-amber-400">{uploadProgress}%</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={uploadingLogo || removingLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                        uploadingLogo ? 'cursor-not-allowed bg-white/5 text-gray-500' : 'border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 active:scale-95'
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingLogo ? 'Upload...' : logoPreview ? 'Remplacer' : 'Choisir'}
                    </button>
                    
                    {/* ✅ BOUTON RETIRER MIS À JOUR */}
                    {logoPreview && !uploadingLogo && (
                      <button 
                        type="button" 
                        onClick={removeLogo} 
                        disabled={removingLogo}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {removingLogo ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Suppression...
                          </>
                        ) : (
                          <>
                            <X className="h-3.5 w-3.5" /> Retirer
                          </>
                        )}
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo || removingLogo} className="hidden" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Glissez une image ici • JPG, PNG, SVG • max 2 Mo</p>
                  {uploadingLogo && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Field label="Nom du portail">
                  <input {...register('portal_name')} type="text" placeholder="Ex : Mon WiFi" className={inputCls} />
                </Field>
              </div>
            </Panel>
          </div>

          {/* Aperçu complet */}
          <div className="order-1 lg:sticky lg:top-4 lg:order-2">
            <Panel className="p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">Aperçu en direct</h3>
                  <p className="text-xs text-gray-400">Ce que vos clients voient en se connectant</p>
                </div>
                <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                  {([['mobile', Smartphone, 'Mobile'], ['desktop', Monitor, 'Ordinateur']] as const).map(([key, Icon, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDevice(key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        device === key ? 'bg-[#d97706] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)] p-2 sm:p-4">
                <PortalPreview name={watchedPortal} color={validColor} logo={logoPreview} profiles={profiles} device={device} />
              </div>
            </Panel>
          </div>
        </div>

        {/* ---------- ONGLET GÉNÉRAL & QUOTA ---------- */}
        <div className={tab === 'general' ? 'grid grid-cols-1 gap-6 lg:grid-cols-3' : 'hidden'}>
          <div className="space-y-6 lg:col-span-2">
            <Panel className="p-6 sm:p-8">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-white"><Settings2 className="h-5 w-5 text-amber-500" /> Informations</h3>
              <Field label="Nom du routeur">
                <input {...register('name', { required: true })} type="text" className={inputCls} />
              </Field>
            </Panel>

            <Panel className="p-6 sm:p-8">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-white"><ShieldAlert className="h-5 w-5 text-amber-500" /> Limite de consommation journalière</h3>
              <div className="flex flex-wrap items-center gap-4">
                <input
                  {...register('daily_quota_gb', { valueAsNumber: true })}
                  type="number" step="0.1" min="0"
                  className="w-32 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-white outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500"
                />
                <span className="font-medium text-gray-400">Go / jour</span>
                {Number(watchedQuota) === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-400">
                    <InfinityIcon className="h-3.5 w-3.5" /> Illimité
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUOTA_PRESETS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setValue('daily_quota_gb', q, { shouldDirty: true })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      Number(watchedQuota) === q ? 'border-amber-500/40 bg-amber-500/20 text-amber-400' : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {q === 0 ? 'Illimité' : `${q} Go`}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                L’accès Internet de tous les clients sera coupé si le quota est dépassé. La limite est réinitialisée chaque jour à minuit. 0 = illimité.
              </p>
            </Panel>
          </div>

          <Panel className="h-fit p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Gauge className="h-5 w-5 text-amber-500" /> Consommation du jour</h3>
            <QuotaWidget routerId={routerData.id} />
          </Panel>
        </div>

        {/* ---------- ONGLET FORFAITS ---------- */}
        <div className={tab === 'plans' ? 'block' : 'hidden'}>
          <Panel>
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">
                Forfaits du routeur <span className="ml-1 text-sm font-normal text-gray-500">({profiles.length})</span>
              </h3>
              <Link href={`/profiles/new?router_id=${routerData.id}`} className="flex items-center gap-1.5 rounded-lg bg-[#d97706] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#b45309]">
                <Plus className="h-4 w-4" /> Ajouter
              </Link>
            </div>
            {profiles.length > 0 ? (
              <div className="divide-y divide-white/10">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/5">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${profile.is_active ? 'bg-green-400' : 'bg-gray-600'}`} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{profile.profile_name}</p>
                        <p className="text-sm text-gray-400">{formatDuration(profile.duration_minutes)} • {profile.price.toLocaleString('fr-FR')} {profile.currency}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:inline-block ${
                        profile.is_active ? 'border-green-500/30 bg-green-500/15 text-green-400' : 'border-gray-500/30 bg-gray-500/15 text-gray-400'
                      }`}>
                        {profile.is_active ? 'Actif' : 'Inactif'}
                      </span>
                      <Link href={`/profiles/${profile.id}`} className="text-sm font-medium text-amber-500 hover:text-amber-400">Modifier</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-14 text-center">
                <Package className="mx-auto mb-3 h-10 w-10 text-gray-700" />
                <p className="text-gray-400">Aucun forfait associé.</p>
                <Link href={`/profiles/new?router_id=${routerData.id}`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#d97706] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b45309]">
                  <Plus className="h-4 w-4" /> Créer le premier forfait
                </Link>
              </div>
            )}
          </Panel>
        </div>

        {/* ---------- ONGLET INSTALLATION ---------- */}
        <div className={tab === 'install' ? 'block' : 'hidden'}>
          <Panel className="p-6 sm:p-8">
            <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white"><Terminal className="h-5 w-5 text-amber-500" /> Installation MikroTik</h3>
            <p className="mb-5 text-sm text-gray-400">Collez cette commande dans le terminal du routeur pour le configurer automatiquement.</p>
            {routerData.config_token ? (
              <>
                <pre className="overflow-auto whitespace-pre-wrap break-all rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-green-400">{installCommand}</pre>
                <button
                  type="button"
                  onClick={copyCommand}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all sm:w-auto ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {copied ? <><Check className="h-5 w-5" /> Copié !</> : <><Copy className="h-5 w-5" /> Copier la commande</>}
                </button>
              </>
            ) : (
              <p className="rounded-xl bg-white/5 p-4 text-center text-sm text-gray-500">Aucun token de configuration disponible.</p>
            )}
          </Panel>
        </div>

        {/* ---------- BARRE D'ENREGISTREMENT ---------- */}
        <div className={`sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border p-3 shadow-2xl backdrop-blur transition-all ${
          isDirty ? 'border-amber-500/30 bg-gray-900/95' : 'border-white/10 bg-gray-900/70'
        }`}>
          <p className="pl-2 text-sm text-gray-400">
            {isDirty ? (
              <span className="flex items-center gap-2 text-amber-400"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" /> Modifications non enregistrées</span>
            ) : 'Tout est à jour'}
          </p>
          <div className="flex gap-2">
            {isDirty && (
              <button type="button" onClick={() => reset()} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/10">
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || uploadingLogo || removingLogo || !isDirty}
              className="flex items-center gap-2 rounded-xl bg-[#d97706] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#b45309] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}