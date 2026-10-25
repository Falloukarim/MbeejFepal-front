'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getProfiles, deleteProfile, getRouter, type HotspotProfile, type Router } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Filter = 'all' | 'active' | 'inactive';

const formatDuration = (minutes: number) => {
  if (!minutes || minutes <= 0) return '—';
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

const formatAmount = (price: number) => (price ?? 0).toLocaleString('fr-FR');

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-3 w-14 rounded bg-neutral-800" />
        <div className="h-3 w-3 rounded-full bg-neutral-800" />
      </div>
      <div className="mb-2 h-5 w-2/3 rounded bg-neutral-800" />
      <div className="mb-5 h-8 w-1/2 rounded bg-neutral-800" />
      <div className="mb-5 flex gap-2">
        <div className="h-6 w-16 rounded bg-neutral-800" />
        <div className="h-6 w-16 rounded bg-neutral-800" />
      </div>
      <div className="h-10 rounded-xl bg-neutral-800" />
    </div>
  );
}

export default function RouterProfilesPage() {
  const params = useParams();
  const router = useRouter();
  const routerId = params.id ? parseInt(params.id as string) : null;

  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [currentRouter, setCurrentRouter] = useState<Router | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [toDelete, setToDelete] = useState<HotspotProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!routerId) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerId]);

  const loadData = async () => {
    try {
      const [routerData, profilesData] = await Promise.all([
        getRouter(routerId!),
        getProfiles(routerId!),
      ]);

      const adaptedRouter: Router = {
        id: (routerData as any).ID ?? (routerData as any).id,
        name: (routerData as any).Name ?? (routerData as any).name ?? '',
        config_token: (routerData as any).ConfigToken ?? (routerData as any).config_token ?? '',
        is_active: (routerData as any).IsActive ?? (routerData as any).is_active ?? false,
        last_seen: (routerData as any).LastSeen ?? (routerData as any).last_seen ?? null,
        created_at: (routerData as any).CreatedAt ?? (routerData as any).created_at ?? '',
      };

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

      setCurrentRouter(adaptedRouter);
      setProfiles(transformedProfiles);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteProfile(toDelete.id);
      toast.success('Forfait supprimé');
      setToDelete(null);
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const active = profiles.filter((p) => p.is_active).length;
    return { total: profiles.length, active, inactive: profiles.length - active };
  }, [profiles]);

  const visible = useMemo(() => {
    if (filter === 'active') return profiles.filter((p) => p.is_active);
    if (filter === 'inactive') return profiles.filter((p) => !p.is_active);
    return profiles;
  }, [profiles, filter]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Tous', count: stats.total },
    { key: 'active', label: 'Actifs', count: stats.active },
    { key: 'inactive', label: 'Inactifs', count: stats.inactive },
  ];

  const routerDisplayName =
    currentRouter?.name?.trim() || (loading ? 'Chargement…' : 'Routeur');

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl pb-28">
        {/* ===== HEADER (sans carré, avec titre + nom du routeur) ===== */}
        <header className="sticky top-0 z-30 -mx-4 mb-6 flex items-end justify-between gap-3 border-b border-neutral-800/60 bg-[#0a0a0a]/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              aria-label="Retour"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-orange-500">
                Forfaits
              </p>
              <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
                {routerDisplayName}
              </h1>
            </div>
          </div>

          <Link
            href={`/profiles/new?router_id=${routerId}`}
            className="hidden shrink-0 items-center gap-2 rounded-xl bg-[#d97706] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition-all hover:bg-[#b45309] active:scale-95 sm:inline-flex"
          >
            <span className="text-lg leading-none">+</span>
            Nouveau forfait
          </Link>
        </header>

        {/* ===== STATISTIQUES (sobres, sans carré) ===== */}
        {!loading && profiles.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Total',    value: stats.total,    color: 'text-white' },
              { label: 'Actifs',   value: stats.active,   color: 'text-green-400' },
              { label: 'Inactifs', value: stats.inactive, color: 'text-neutral-400' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-neutral-800/80 bg-[#111] px-4 py-3"
              >
                <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== FILTRES (chips discrets) ===== */}
        {!loading && profiles.length > 0 && (
          <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                {f.label}
                <span
                  className={`ml-2 text-xs ${
                    filter === f.key ? 'text-orange-400/70' : 'text-neutral-600'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ===== LISTE ===== */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {loading && [0, 1, 2].map((i) => <SkeletonCard key={i} />)}

          {!loading &&
            visible.map((profile) => (
              <article
                key={profile.id}
                className={`group relative overflow-hidden rounded-2xl border bg-[#111] transition-colors ${
                  profile.is_active ? 'border-orange-500/20' : 'border-neutral-800/80'
                }`}
              >
                {profile.is_active && (
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
                )}

                <div className="p-5">
                  {/* Statut + id — SANS carré d'icône */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          profile.is_active ? 'bg-green-400 animate-pulse' : 'bg-neutral-500'
                        }`}
                      />
                      <span className={profile.is_active ? 'text-green-400' : 'text-neutral-400'}>
                        {profile.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-neutral-600">
                      #{profile.id}
                    </span>
                  </div>

                  {/* Nom + prix */}
                  <h3 className="truncate text-base font-semibold text-white">
                    {profile.profile_name}
                  </h3>
                  <div className="mt-1 mb-4 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-orange-400">
                      {formatAmount(profile.price)}
                    </span>
                    <span className="text-xs font-medium text-orange-400/60">
                      {profile.currency}
                    </span>
                  </div>

                  {/* Caractéristiques — sans icônes, juste texte séparé */}
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-neutral-300 ring-1 ring-white/5">
                      {formatDuration(profile.duration_minutes)}
                    </span>
                    {profile.bandwidth_limit && (
                      <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-neutral-300 ring-1 ring-white/5">
                        {profile.bandwidth_limit}
                      </span>
                    )}
                    <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-neutral-300 ring-1 ring-white/5">
                      {profile.max_devices} appareil{profile.max_devices > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 border-t border-neutral-800/60 pt-4">
                    <Link
                      href={`/profiles/${profile.id}`}
                      className="flex h-9 items-center justify-center rounded-lg text-xs font-semibold text-orange-400 ring-1 ring-orange-500/20 transition-colors hover:bg-orange-500/10 active:scale-95"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => setToDelete(profile)}
                      className="flex h-9 items-center justify-center rounded-lg text-xs font-semibold text-neutral-400 ring-1 ring-neutral-700/60 transition-colors hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))}

          {/* États vides */}
          {!loading && profiles.length === 0 && (
            <div className="col-span-full flex flex-col items-center rounded-2xl border border-neutral-800/80 bg-[#111] px-6 py-16 text-center">
              <div className="mb-4 text-3xl text-neutral-700">
                <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <path d="M7 7h.01" />
                </svg>
              </div>
              <h2 className="mb-1 text-base font-semibold text-white">Aucun forfait</h2>
              <p className="mb-6 max-w-xs text-sm text-neutral-500">
                Créez le premier forfait de ce routeur pour commencer à vendre l'accès WiFi.
              </p>
              <Link
                href={`/profiles/new?router_id=${routerId}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#d97706] px-5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 active:scale-95 transition-transform"
              >
                <span className="text-lg leading-none">+</span>
                Créer un forfait
              </Link>
            </div>
          )}

          {!loading && profiles.length > 0 && visible.length === 0 && (
            <div className="col-span-full rounded-2xl border border-neutral-800/80 bg-[#111] py-12 text-center text-sm text-neutral-500">
              Aucun forfait dans cette catégorie
            </div>
          )}
        </div>
      </div>

      {/* Bouton flottant (mobile) */}
      {!loading && profiles.length > 0 && (
        <Link
          href={`/profiles/new?router_id=${routerId}`}
          aria-label="Nouveau forfait"
          className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#d97706] text-3xl font-light text-white shadow-xl shadow-amber-600/40 transition-transform active:scale-90 sm:hidden"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          +
        </Link>
      )}

      {/* Bottom sheet de confirmation */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !deleting && setToDelete(null)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl border-t border-neutral-800 bg-[#141414] p-6 shadow-2xl sm:rounded-3xl sm:border"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-neutral-700 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </div>
            <h2 className="mb-1 text-center text-base font-semibold text-white">Supprimer ce forfait ?</h2>
            <p className="mb-6 text-center text-sm text-neutral-400">
              « {toDelete.profile_name} » sera définitivement supprimé. Cette action est irréversible.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="h-11 rounded-xl text-sm font-semibold text-neutral-300 ring-1 ring-neutral-700 transition-colors hover:bg-neutral-800 active:scale-95 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="h-11 rounded-xl bg-red-500 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-transform active:scale-95 disabled:opacity-60"
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}