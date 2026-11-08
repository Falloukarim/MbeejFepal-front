'use client';

import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getRouters, deleteRouter, type Router } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Wifi, WifiOff, Plus, Copy, Check, Edit, Trash2, Tag, Search, Clock, Terminal, Activity,
} from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useSubscription } from '@/app/context/SubscriptionContext'; // ✅ NOUVEAU

type Filter = 'all' | 'online' | 'offline' | 'never_connected';

export default function RoutersPage() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<number | null>(null);

  const [routerToDelete, setRouterToDelete] = useState<Router | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // ✅ NOUVEAU : vérifier si l'utilisateur peut écrire
  const { status: subscriptionStatus } = useSubscription();
  const canWrite = subscriptionStatus?.active ?? false;

  // ✅ Helper : bloque l'action si abonnement inactif
  const guardWrite = (e: React.MouseEvent, action = 'effectuer cette action') => {
    if (!canWrite) {
      e.preventDefault();
      toast.error(`Renouvelez votre abonnement pour ${action}.`);
      return false;
    }
    return true;
  };

  useEffect(() => { loadRouters(); }, []);

  const loadRouters = async () => {
    try {
      const data = await getRouters();
      const transformedRouters: Router[] = (data as any[]).map((item) => {
        const isOnline = item.WgConnected === true || item.wg_connected === true;
        let connectionStatus: 'online' | 'offline' | 'never_connected' = 'never_connected';
        let statusDisplay = 'Jamais connecté';
        if (isOnline) { connectionStatus = 'online'; statusDisplay = 'En ligne'; }
        else if (item.WgPublicKey || item.wg_public_key || item.LastSeen) {
          connectionStatus = 'offline'; statusDisplay = 'Hors ligne';
        }
        return {
          id: item.ID || item.id,
          user_id: item.UserID || item.user_id,
          router_uuid: item.RouterUUID || item.router_uuid,
          zone_id: item.ZoneID || item.zone_id,
          name: item.Name || item.name,
          config_token: item.ConfigToken || item.config_token,
          is_active: item.IsActive ?? item.is_active,
          last_seen: item.LastSeen || item.last_seen,
          created_at: item.CreatedAt || item.created_at,
          connection_status: connectionStatus,
          status_display: statusDisplay,
        };
      }).filter((r) => r.id);
      setRouters(transformedRouters);
    } catch {
      toast.error('Erreur lors du chargement des routeurs');
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (router: Router) => {
    if (!canWrite) {
      toast.error('Renouvelez votre abonnement pour supprimer un routeur.');
      return;
    }
    setRouterToDelete(router);
  };

  const confirmDelete = async () => {
    if (!routerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRouter(routerToDelete.id!);
      toast.success('Routeur supprimé avec succès');
      loadRouters();
      setRouterToDelete(null);
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setIsDeleting(false); }
  };

  const copyCommand = async (id: number, token: string) => {
    setCopyingId(id);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';
    const command = `/tool fetch url="${apiUrl}/routers/configure/${token}" mode=https dst-path=monwifi\n/import monwifi`;
    try {
      await navigator.clipboard.writeText(command);
      setTimeout(() => { setCopyingId(null); toast.success('Commande copiée !'); }, 500);
    } catch { setCopyingId(null); toast.error('Erreur lors de la copie'); }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'Jamais';
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return 'Date invalide'; }
  };

  const timeAgo = (d: string | null | undefined) => {
    if (!d) return 'Jamais';
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) return 'Date invalide';
    const diff = Math.max(0, Date.now() - t);
    const min = Math.floor(diff / 60000);
    if (min < 1) return "À l'instant";
    if (min < 60) return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h} h`;
    const dd = Math.floor(h / 24);
    if (dd < 30) return `Il y a ${dd} j`;
    return formatDate(d);
  };

  const statusStyle = (router: Router) => {
    if (router.connection_status === 'online') return {
      label: 'En ligne', pill: 'bg-green-500/10 text-green-400 border-green-500/25',
      dot: 'bg-green-500 animate-pulse', tile: 'bg-green-500/10 border-green-500/25 text-green-400',
      bar: 'from-green-500/60 to-transparent',
    };
    if (router.connection_status === 'offline') return {
      label: 'Hors ligne', pill: 'bg-red-500/10 text-red-400 border-red-500/25',
      dot: 'bg-red-500', tile: 'bg-red-500/10 border-red-500/25 text-red-400',
      bar: 'from-red-500/50 to-transparent',
    };
    return {
      label: 'Jamais connecté', pill: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      dot: 'bg-amber-500', tile: 'bg-white/5 border-white/10 text-gray-400',
      bar: 'from-amber-500/50 to-transparent',
    };
  };

  const counts = useMemo(() => {
    const online = routers.filter((r) => r.connection_status === 'online').length;
    const offline = routers.filter((r) => r.connection_status === 'offline').length;
    const never = routers.filter((r) => r.connection_status === 'never_connected').length;
    return { all: routers.length, online, offline, never_connected: never };
  }, [routers]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routers.filter((r) => {
      if (filter !== 'all' && r.connection_status !== filter) return false;
      if (q && !(r.name || '').toLowerCase().includes(q) && !String(r.id).includes(q)) return false;
      return true;
    });
  }, [routers, search, filter]);

  if (loading) {
    return (<Layout><LoadingSpinner message="Chargement des routeurs..." /></Layout>);
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Tous', count: counts.all },
    { key: 'online', label: 'En ligne', count: counts.online },
    { key: 'offline', label: 'Hors ligne', count: counts.offline },
    { key: 'never_connected', label: 'Jamais connectés', count: counts.never_connected },
  ];

  const onlinePct = counts.all > 0 ? Math.round((counts.online / counts.all) * 100) : 0;

  return (
    <Layout>
      <style>{`
        @keyframes rt-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .rt-rise { animation: rt-rise .4s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 pt-4 pb-10">
        <header className="mb-5">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-amber-500 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider mb-3">
            <Wifi className="w-3.5 h-3.5" /> GESTION DES ROUTEURS
          </div>
          <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-white">Routeurs MikroTik</h1>
          <p className="text-sm text-gray-400 mt-1">Gérez vos points d'accès et leur configuration</p>
        </header>

        {routers.length === 0 ? (
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 p-8 text-center shadow-xl">
            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                <Wifi className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Aucun routeur configuré</h3>
              <p className="text-gray-400 mb-7 max-w-sm mx-auto">
                Commencez par ajouter votre premier routeur MikroTik pour gérer vos points d'accès Wi-Fi.
              </p>
              <Link
                href={canWrite ? '/routers/new' : '#'}
                onClick={(e) => guardWrite(e, 'créer un routeur')}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl font-bold shadow-xl transition-all active:scale-[0.97] ${
                  canWrite
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-600/25'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }`}
                title={!canWrite ? 'Renouvelez votre abonnement' : ''}
              >
                <Plus className="w-5 h-5" /> Ajouter un routeur
              </Link>
            </div>
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-[28px] p-5 mb-4 border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-gray-900 to-black shadow-xl">
              <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">État du réseau</p>
                  <p className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black tracking-tight text-white tabular-nums">{counts.online}</span>
                    <span className="text-lg font-bold text-gray-400 tabular-nums">/ {counts.all}</span>
                    <span className="text-sm text-gray-400 font-medium">en ligne</span>
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center">
                  <Activity className="w-7 h-7" />
                </div>
              </div>
              <div className="relative mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700" style={{ width: `${onlinePct}%` }} />
              </div>
              <div className="relative mt-2 flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />{counts.online} en ligne</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />{counts.offline} hors ligne</span>
                {counts.never_connected > 0 && (
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />{counts.never_connected} en attente</span>
                )}
              </div>
            </section>

            {/* ✅ Bouton principal : désactivé si abonnement inactif */}
            <Link
              href={canWrite ? '/routers/new' : '#'}
              onClick={(e) => guardWrite(e, 'créer un routeur')}
              className={`w-full h-14 mb-4 flex items-center justify-center gap-2 rounded-2xl text-base font-bold shadow-xl transition-all active:scale-[0.98] ${
                canWrite
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-600/25'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }`}
              title={!canWrite ? 'Renouvelez votre abonnement' : ''}
            >
              <Plus className="w-5 h-5" /> Nouveau routeur
            </Link>

            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un routeur"
                className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="mb-5 -mx-4 px-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition-all active:scale-95 ${
                    filter === f.key ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-300 border-white/10'
                  }`}
                >
                  {f.label}
                  <span className={`min-w-5 px-1.5 rounded-full text-[11px] leading-5 ${filter === f.key ? 'bg-black/15' : 'bg-white/10 text-gray-400'}`}>{f.count}</span>
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="text-center py-12 rounded-[28px] bg-white/5 border border-white/10">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/5 text-gray-500 flex items-center justify-center">
                  <WifiOff className="w-7 h-7" />
                </div>
                <p className="font-bold text-white">Aucun résultat</p>
                <p className="text-sm text-gray-400 mt-1">Modifiez votre recherche ou le filtre.</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-3">
                {visible.map((router, i) => {
                  const st = statusStyle(router);
                  const copied = copyingId === router.id;
                  return (
                    <article
                      key={router.id}
                      className="rt-rise relative overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 p-4 shadow-xl"
                      style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                    >
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${st.bar}`} />

                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 shrink-0 rounded-2xl border flex items-center justify-center ${st.tile}`}>
                          {router.connection_status === 'offline' ? <WifiOff className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-white text-base truncate">{router.name || 'Routeur sans nom'}</h3>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">ID : {router.id}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold tracking-wider ${st.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="rounded-2xl bg-white/5 border border-white/5 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Dernière vue</p>
                          <p className="text-sm font-bold text-white mt-1 truncate" title={formatDate(router.last_seen)}>{timeAgo(router.last_seen)}</p>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-white/5 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1"><Terminal className="w-3 h-3" /> Configuration</p>
                          {router.config_token ? (
                            <button
                              onClick={() => copyCommand(router.id!, router.config_token!)}
                              disabled={copied}
                              className={`mt-1 inline-flex items-center gap-1.5 text-sm font-bold transition-all active:scale-95 ${copied ? 'text-green-400' : 'text-amber-400'}`}
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              {copied ? 'Copié !' : 'Copier la commande'}
                            </button>
                          ) : (
                            <p className="text-sm text-gray-500 italic mt-1">Non configuré</p>
                          )}
                        </div>
                      </div>

                      {/* Actions : bloquées si abonnement inactif */}
                      <div className="flex gap-2 mt-3">
                        <Link
                          href={canWrite ? `/routers/${router.id}/profiles` : '#'}
                          onClick={(e) => guardWrite(e, 'accéder aux forfaits')}
                          className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all ${
                            canWrite
                              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 active:scale-95'
                              : 'bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed'
                          }`}
                          title={!canWrite ? 'Renouvelez votre abonnement' : ''}
                        >
                          <Tag className="w-4 h-4" /> Forfaits
                        </Link>
                        <Link
                          href={canWrite ? `/routers/${router.id}` : '#'}
                          onClick={(e) => guardWrite(e, 'modifier un routeur')}
                          className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all ${
                            canWrite
                              ? 'bg-white/5 border border-white/10 text-gray-200 active:scale-95'
                              : 'bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed'
                          }`}
                          title={!canWrite ? 'Renouvelez votre abonnement' : ''}
                        >
                          <Edit className="w-4 h-4" /> Modifier
                        </Link>
                        <button
                          onClick={() => requestDelete(router)}
                          aria-label={`Supprimer ${router.name || 'ce routeur'}`}
                          className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                            canWrite
                              ? 'bg-red-500/10 border border-red-500/15 text-red-400 active:scale-95'
                              : 'bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed'
                          }`}
                          title={!canWrite ? 'Renouvelez votre abonnement' : ''}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={routerToDelete !== null}
        title="Supprimer ce routeur ?"
        message={`Êtes-vous sûr de vouloir supprimer le routeur "${routerToDelete?.name}" ? Cette action est irréversible et déconnectera tous les clients.`}
        confirmText="Oui, supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setRouterToDelete(null)}
        isLoading={isDeleting}
      />
    </Layout>
  );
}