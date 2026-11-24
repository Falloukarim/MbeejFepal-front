'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import {
  getRouter,
  getProfiles,
  generateManualTicket,
  listRouterTickets,
  type Router,
  type HotspotProfile,
  type ManualTicketResult,
  type TicketSummary,
} from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft,
  Ticket,
  Send,
  Copy,
  Check,
  Clock,
  Smartphone,
  RefreshCw,
  History,
  Minus,
  Plus,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  return h ? `${d} j ${h} h` : `${d} jour${d > 1 ? 's' : ''}`;
};

const formatDateShort = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

// ──────────────────────────────────────────────────────────
// Composant
// ──────────────────────────────────────────────────────────

export default function TicketsPage() {
  const params = useParams();
  const router = useRouter();
  const routerId = params.id ? parseInt(params.id as string) : null;

  const [routerData, setRouterData] = useState<Router | null>(null);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [customDays, setCustomDays] = useState(0);
  const [customHours, setCustomHours] = useState(0);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ManualTicketResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────
  // Chargement initial
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!routerId) return;

    const fetchData = async () => {
      try {
        const [routerRes, profilesRes, ticketsRes] = await Promise.all([
          getRouter(routerId),
          getProfiles(routerId),
          listRouterTickets(routerId).catch(() => []),
        ]);

        const adaptedRouter: Router = {
          id: (routerRes as any).id ?? (routerRes as any).ID,
          name: (routerRes as any).name ?? (routerRes as any).Name ?? '',
          config_token: (routerRes as any).config_token ?? (routerRes as any).ConfigToken ?? '',
          is_active: (routerRes as any).is_active ?? (routerRes as any).IsActive ?? false,
          last_seen: (routerRes as any).last_seen ?? (routerRes as any).LastSeen ?? null,
          created_at: (routerRes as any).created_at ?? (routerRes as any).CreatedAt ?? '',
        };

        const adaptedProfiles: HotspotProfile[] = (Array.isArray(profilesRes) ? profilesRes : [])
          .map((item: any): HotspotProfile => ({
            id: item.id ?? item.ID,
            router_id: item.router_id ?? item.RouterID,
            profile_name: item.profile_name ?? item.ProfileName,
            duration_minutes: item.duration_minutes ?? item.DurationMinutes,
            price: item.price ?? item.Price,
            currency: item.currency ?? item.Currency ?? 'XOF',
            bandwidth_limit: item.bandwidth_limit ?? item.BandwidthLimit ?? null,
            max_devices: item.max_devices ?? item.MaxDevices ?? 1,
            is_active: item.is_active ?? item.IsActive ?? false,
            created_at: item.created_at ?? item.CreatedAt ?? '',
            updated_at: item.updated_at ?? item.UpdatedAt ?? '',
          }))
          .filter((p) => p.id && p.is_active);

        setRouterData(adaptedRouter);
        setProfiles(adaptedProfiles);
        setTickets(Array.isArray(ticketsRes) ? ticketsRes : []);
        if (adaptedProfiles.length > 0) {
          setSelectedProfileId(adaptedProfiles[0].id);
        }
      } catch {
        toast.error('Erreur lors du chargement');
        router.push('/routers');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routerId, router]);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );

  // Pré-remplir jours/heures quand on change de forfait
  useEffect(() => {
    if (!selectedProfile) return;
    setCustomDays(Math.floor(selectedProfile.duration_minutes / 1440));
    setCustomHours(Math.floor((selectedProfile.duration_minutes % 1440) / 60));
  }, [selectedProfileId, selectedProfile]);

  const totalMinutes = customDays * 1440 + customHours * 60;
  const effectiveMinutes = totalMinutes > 0 ? totalMinutes : (selectedProfile?.duration_minutes ?? 0);

  // ──────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────
  const refreshTickets = useCallback(async () => {
    if (!routerId) return;
    try {
      const res = await listRouterTickets(routerId);
      setTickets(Array.isArray(res) ? res : []);
    } catch {
      // silencieux
    }
  }, [routerId]);

  const handleGenerate = async () => {
    if (!routerId || !selectedProfileId) {
      toast.error('Sélectionnez un forfait');
      return;
    }
    if (totalMinutes <= 0) {
      toast.error('Définissez une durée (jours ou heures)');
      return;
    }

    setGenerating(true);
    setResult(null);
    try {
      const res = await generateManualTicket(
        routerId,
        selectedProfileId,
        whatsappNumber.trim(),
        totalMinutes,
      );
      setResult(res);
      toast.success('Ticket généré !');
      // Rafraîchir l'historique
      await refreshTickets();
    } catch (error: any) {
      const data = error?.response?.data;
      const msg = typeof data === 'string' ? data : data?.message || data?.error || null;
      toast.error(msg || 'Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Code copié !');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const openWhatsApp = () => {
    if (!result?.whatsapp_url) {
      toast.error("Renseignez un numéro WhatsApp d'abord");
      return;
    }
    window.open(result.whatsapp_url, '_blank');
  };

  const adjustDays = (delta: number) => {
    setCustomDays((v) => Math.max(0, Math.min(365, v + delta)));
  };
  const adjustHours = (delta: number) => {
    setCustomHours((v) => Math.max(0, Math.min(23, v + delta)));
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Chargement..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-10">
        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <Link
            href={`/routers/${routerId}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-white/5 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
              Tickets
            </p>
            <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
              {routerData?.name || 'Routeur'}
            </h1>
          </div>
          <button
            onClick={refreshTickets}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </button>
        </header>

        {/* Grille : formulaire à gauche, historique à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] gap-5">
          {/* ══════════════ FORMULAIRE ══════════════ */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-[#111] p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Générer un ticket</h2>
                  <p className="text-xs text-gray-400">
                    Le code sera utilisable immédiatement sur le portail.
                  </p>
                </div>
              </div>

              {/* Forfait */}
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Forfait
              </label>
              {profiles.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-400">
                  Aucun forfait actif.{' '}
                  <Link href={`/profiles/new?router_id=${routerId}`} className="text-amber-400 hover:underline">
                    Créer un forfait
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        selectedProfileId === p.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          {p.profile_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDuration(p.duration_minutes)}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Smartphone className="w-3 h-3" /> {p.max_devices}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedProfileId === p.id
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-gray-600'
                        }`}
                      >
                        {selectedProfileId === p.id && (
                          <Check className="w-3 h-3 text-black" strokeWidth={3} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* WhatsApp */}
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Numéro WhatsApp <span className="text-gray-600 font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    +221
                  </span>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="77 123 45 67"
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-14 pr-4 py-3 text-white placeholder-gray-600 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !selectedProfileId || totalMinutes <= 0}
                className="mt-5 w-full h-14 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-600/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Ticket className="w-5 h-5" />
                    Générer le ticket
                  </>
                )}
              </button>
            </section>

            {/* Résultat */}
            {result && (
              <section className="rounded-2xl border-2 border-green-500/30 bg-green-500/5 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Ticket généré</h2>
                    <p className="text-xs text-gray-400">Prêt à être envoyé</p>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/10 p-4 text-center mb-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                    Code d'accès
                  </p>
                  <p className="text-3xl sm:text-4xl font-black tracking-[0.3em] text-amber-400 font-mono">
                    {result.short_code}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Forfait</p>
                    <p className="font-semibold text-white text-sm mt-0.5 truncate">
                      {result.profile_name}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Durée</p>
                    <p className="font-semibold text-white text-sm mt-0.5">
                      {formatDuration(result.duration_minutes)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => copyCode(result.short_code)}
                    className="h-12 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm transition active:scale-95 flex items-center justify-center gap-2 hover:bg-white/10"
                  >
                    {copiedCode === result.short_code ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" /> Copié
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copier
                      </>
                    )}
                  </button>
                  <button
                    onClick={openWhatsApp}
                    disabled={!result.whatsapp_url}
                    className="h-12 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-sm transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* ══════════════ HISTORIQUE ══════════════ */}
          <section className="rounded-2xl border border-white/10 bg-[#111] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-300 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Historique</h2>
                  <p className="text-xs text-gray-400">
                    {tickets.length} ticket{tickets.length > 1 ? 's' : ''} généré{tickets.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 mb-3">
                  <Ticket className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">Aucun ticket généré</p>
                <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                  Vos tickets apparaîtront ici dès que vous en créerez.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 -mr-1">
                {tickets.map((t) => {
                  const isActive = t.is_active;
                  return (
                    <div
                      key={t.id}
                      className={`rounded-xl border p-3 transition ${
                        isActive
                          ? 'border-amber-500/20 bg-amber-500/[0.03]'
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-lg font-bold tracking-wider text-amber-400">
                              {t.short_code}
                            </span>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 border border-green-500/30 px-2 py-0.5 text-[9px] font-bold uppercase text-green-400">
                                Actif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/15 border border-gray-500/30 px-2 py-0.5 text-[9px] font-bold uppercase text-gray-400">
                                Expiré
                              </span>
                            )}
                            {t.is_used && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[9px] font-bold uppercase text-blue-400">
                                Utilisé
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {t.profile_name} · {formatDuration(t.duration_minutes)} · {t.max_devices} appareil{t.max_devices > 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => copyCode(t.short_code)}
                          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition"
                          title="Copier le code"
                        >
                          {copiedCode === t.short_code ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                        <span>Créé : {formatDateShort(t.created_at)}</span>
                        <span>Expire : {formatDateShort(t.expires_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}