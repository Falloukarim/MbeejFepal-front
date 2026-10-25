'use client';

import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getMySessions, getRouters, getProfiles } from '@/lib/api';
import toast from 'react-hot-toast';

interface Session {
  id: number;
  zone_code: string | null;
  users_id: string;
  router_id: number;
  hotspot_id: number;
  mac_address: string;
  ip_address: string | null;
  state: string;
  created_at: string;
  expires_at: string;
}

type Filter = 'all' | 'active' | 'past';

const STATE_STYLES: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE:     { label: 'Active',   color: 'text-green-400',  dot: 'bg-green-400'  },
  CREATED:    { label: 'Créée',    color: 'text-amber-400',  dot: 'bg-amber-400'  },
  EXPIRED:    { label: 'Expirée',  color: 'text-neutral-500', dot: 'bg-neutral-600' },
  TERMINATED: { label: 'Terminée', color: 'text-red-400',    dot: 'bg-red-400'    },
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
      <div className="mb-4 flex justify-between">
        <div className="h-3 w-20 rounded bg-neutral-800" />
        <div className="h-3 w-10 rounded bg-neutral-800" />
      </div>
      <div className="mb-2 h-5 w-2/3 rounded bg-neutral-800" />
      <div className="mb-5 h-3 w-1/3 rounded bg-neutral-800" />
      <div className="space-y-2">
        <div className="h-3 rounded bg-neutral-800" />
        <div className="h-3 rounded bg-neutral-800" />
        <div className="h-3 w-2/3 rounded bg-neutral-800" />
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className={`truncate text-right text-sm ${mono ? 'font-mono text-neutral-200' : 'text-neutral-200'}`}>
        {value}
      </span>
    </div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [routers, setRouters] = useState<Record<number, string>>({});
  const [profiles, setProfiles] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsData, routersData] = await Promise.all([
          getMySessions(),
          getRouters().catch(() => []),
        ]);

        const routerMap: Record<number, string> = {};
        (routersData as any[]).forEach((r) => {
          const id = r.ID || r.id;
          if (id) routerMap[id] = r.Name || r.name || `Routeur #${id}`;
        });
        setRouters(routerMap);

        const adaptedSessions: Session[] = (sessionsData as any[])
          .map((item: any) => ({
            id: item.ID || item.id,
            zone_code: item.ZoneCode || null,
            users_id: item.UsersID || item.UserID,
            router_id: item.RouterID,
            hotspot_id: item.HotspotID,
            mac_address: item.MacAddress,
            ip_address: item.IpAddress || null,
            state: item.State || 'CREATED',
            created_at: item.CreatedAt,
            expires_at: item.ExpiresAt,
          }))
          .filter((session) => session.id);

        setSessions(adaptedSessions || []);

        const uniqueRouterIds = [...new Set(adaptedSessions.map((s) => s.router_id))];
        const profileMap: Record<number, string> = {};

        await Promise.all(
          uniqueRouterIds.map(async (routerId) => {
            try {
              const list = await getProfiles(routerId);
              (list as any[]).forEach((p) => {
                const id = p.ID || p.id;
                if (id) profileMap[id] = p.ProfileName || p.profile_name || `Forfait #${id}`;
              });
            } catch {
              // Routeur sans profils : on ignore
            }
          })
        );
        setProfiles(profileMap);
      } catch (error) {
        toast.error('Erreur lors du chargement des sessions');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRemainingTime = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return 'Inconnu';
    const expiry = new Date(expiresAt).getTime();
    if (isNaN(expiry)) return 'Inconnu';
    const diffMin = Math.floor((expiry - now) / 60000);
    if (diffMin <= 0) return 'Expiré';
    if (diffMin < 60) return `${diffMin} min`;
    if (diffMin < 1440) {
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      return m === 0 ? `${h} h` : `${h} h ${m} min`;
    }
    const d = Math.floor(diffMin / 1440);
    const h = Math.floor((diffMin % 1440) / 60);
    return h === 0 ? `${d} j` : `${d} j ${h} h`;
  };

  const remainingPercent = (s: Session) => {
    const start = new Date(s.created_at).getTime();
    const end = new Date(s.expires_at).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 0;
    return Math.max(0, Math.min(100, ((end - now) / (end - start)) * 100));
  };

  const stats = useMemo(() => {
    const active = sessions.filter((s) => s.state === 'ACTIVE').length;
    return { total: sessions.length, active, past: sessions.length - active };
  }, [sessions]);

  const visible = useMemo(() => {
    if (filter === 'active') return sessions.filter((s) => s.state === 'ACTIVE');
    if (filter === 'past') return sessions.filter((s) => s.state !== 'ACTIVE');
    return sessions;
  }, [sessions, filter]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Toutes', count: stats.total },
    { key: 'active', label: 'Actives', count: stats.active },
    { key: 'past', label: 'Passées', count: stats.past },
  ];

  return (
    <Layout>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[#0a0a0a]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl pb-16">
        {/* ===== HEADER (sans carré) ===== */}
        <header className="sticky top-0 z-30 -mx-4 mb-6 border-b border-neutral-800/60 bg-[#0a0a0a]/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-orange-500">
                Historique
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Sessions
              </h1>
            </div>
            {!loading && (
              <p className="shrink-0 pb-1 text-xs text-neutral-500">
                {sessions.length} session{sessions.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </header>

        {/* ===== STATISTIQUES (sobres, sans couleur criarde) ===== */}
        {!loading && sessions.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Total',   value: stats.total,  color: 'text-white' },
              { label: 'Actives', value: stats.active, color: 'text-green-400' },
              { label: 'Passées', value: stats.past,   color: 'text-neutral-400' },
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
        {!loading && sessions.length > 0 && (
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {loading && [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}

          {!loading &&
            visible.map((session) => {
              const st = STATE_STYLES[session.state] ?? {
                label: session.state,
                color: 'text-neutral-400',
                dot: 'bg-neutral-500',
              };
              const isActive = session.state === 'ACTIVE';
              const percent = remainingPercent(session);

              return (
                <article
                  key={session.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-[#111] transition-colors ${
                    isActive ? 'border-orange-500/20' : 'border-neutral-800/80'
                  }`}
                >
                  {/* Fin liseré supérieur uniquement pour les sessions actives */}
                  {isActive && (
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
                  )}

                  <div className="p-5">
                    {/* Statut + identifiant */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${st.dot} ${
                            isActive ? 'animate-pulse' : ''
                          }`}
                        />
                        <span className={st.color}>{st.label}</span>
                      </span>
                      <span className="font-mono text-[10px] text-neutral-600">
                        #{session.id}
                      </span>
                    </div>

                    {/* Titre & sous-titre — SANS carré d'icône */}
                    <h3 className="truncate text-base font-semibold text-white">
                      {routers[session.router_id] || `Routeur #${session.router_id}`}
                    </h3>
                    <p className="mt-0.5 truncate text-sm text-neutral-400">
                      {profiles[session.hotspot_id] || `Forfait #${session.hotspot_id}`}
                    </p>

                    {/* Temps restant — sessions actives uniquement */}
                    {isActive && (
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Temps restant</span>
                          <span className="font-semibold tabular-nums text-orange-400">
                            {formatRemainingTime(session.expires_at)}
                          </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-neutral-800">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Détails — liste épurée */}
                    <div className="mt-4 divide-y divide-neutral-800/60 border-t border-neutral-800/60">
                      <DetailRow label="MAC" value={session.mac_address} mono />
                      {session.ip_address && (
                        <DetailRow label="IP" value={session.ip_address} mono />
                      )}
                      <DetailRow label="Début" value={formatDate(session.created_at)} />
                      <DetailRow label="Fin" value={formatDate(session.expires_at)} />
                    </div>
                  </div>
                </article>
              );
            })}

          {/* États vides */}
          {!loading && sessions.length === 0 && (
            <div className="col-span-full flex flex-col items-center rounded-2xl border border-neutral-800/80 bg-[#111] px-6 py-16 text-center">
              <div className="mb-4 text-3xl text-neutral-700">
                <i className="bi bi-clock-history"></i>
              </div>
              <h3 className="mb-1 text-base font-semibold text-white">Aucune session</h3>
              <p className="max-w-xs text-sm text-neutral-500">
                Les sessions apparaîtront ici dès qu'un client se connectera à vos hotspots.
              </p>
            </div>
          )}

          {!loading && sessions.length > 0 && visible.length === 0 && (
            <div className="col-span-full rounded-2xl border border-neutral-800/80 bg-[#111] py-12 text-center text-sm text-neutral-500">
              Aucune session dans cette catégorie
            </div>
          )}
        </div>

        <div className="mt-10 text-center text-[11px] text-neutral-600">
          © 2026 MbeejFepal
        </div>
      </div>
    </Layout>
  );
}