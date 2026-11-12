'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Layout from '@/components/layout/Layout';
import api from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  Network, Settings, UserPlus, X, Copy, Check, Power, PowerOff, Trash2, Tag, Wifi,
  MessageCircle, Phone, Calendar, Clock, Users, Globe, Layers, Plus, Info, Router as RouterIcon,
  Activity, ArrowDown, ArrowUp, Search, UserCheck, UserX, PauseCircle, Gauge, SlidersHorizontal,
} from 'lucide-react';
import { VlanDiagram, CompactCtx } from '@/components/network/NetworkDiagrams';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ───────── Interfaces ─────────
interface Router { id: number; name: string; }
interface Profile { id: number; name: string; rate_limit: string; price: number; duration_days: number; }
interface User { id: number; name: string; phone: string; username: string; password: string; status: string; expires_at: string; profile_name: string; rate_limit: string; }
interface WAN { name: string; interface: string; gateway: string; weight: number; }
interface WanStat { name: string; interface: string; rx: number; tx: number; is_up: boolean; }
interface VLANInterface { name: string; vlan_id: number; role: string; ip_address: string; }

type TabKey = 'users' | 'profiles' | 'settings' | 'vlan' | 'wan';
type GroupKey = 'clients' | 'network';
type StatusKey = 'active' | 'suspended' | 'expired';
type WanView = 'monitor' | 'config';

const inputCls = 'w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all';
const primaryBtn = 'w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl shadow-xl shadow-amber-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100';

// ───────── Navigation (2 niveaux) ─────────
const GROUPS: { key: GroupKey; label: string; icon: ReactNode; tabs: TabKey[] }[] = [
  { key: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" />, tabs: ['users', 'profiles'] },
  { key: 'network', label: 'Réseau', icon: <Network className="w-4 h-4" />, tabs: ['settings', 'vlan', 'wan'] },
];
const TAB_META: Record<TabKey, { label: string; icon: ReactNode; group: GroupKey }> = {
  users: { label: 'Abonnés', icon: <Users className="w-4 h-4" />, group: 'clients' },
  profiles: { label: 'Forfaits', icon: <Tag className="w-4 h-4" />, group: 'clients' },
  settings: { label: 'PPPoE', icon: <Settings className="w-4 h-4" />, group: 'network' },
  vlan: { label: 'VLANs', icon: <Layers className="w-4 h-4" />, group: 'network' },
  wan: { label: 'Multi-WAN', icon: <Globe className="w-4 h-4" />, group: 'network' },
};

// ───────── Composants UI ─────────
function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm pppoe-fade" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="pppoe-sheet w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-gray-900 border border-white/10 rounded-t-[28px] sm:rounded-[28px] shadow-2xl px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white active:scale-95 transition-all"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormCard({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="pppoe-rise relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-[28px] p-5 sm:p-8 shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="relative flex items-center gap-3 mb-5">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">{icon}</div>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 mb-5 text-sm text-amber-200">
      <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
      <p>{children}</p>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-gray-400 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <legend className="px-2 text-[11px] font-extrabold uppercase tracking-widest text-amber-500">{title}</legend>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </fieldset>
  );
}

function StatCard({ icon, label, value, tone = 'default', active, onClick }: {
  icon: ReactNode; label: string; value: ReactNode; tone?: 'default' | 'green' | 'amber' | 'red'; active?: boolean; onClick?: () => void;
}) {
  const tones = {
    default: 'text-white bg-white/5 border-white/10',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  } as const;
  const Wrapper: any = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`text-left rounded-2xl border p-3.5 transition-all ${tones[tone]} ${onClick ? 'active:scale-95 cursor-pointer' : ''} ${active ? 'ring-2 ring-amber-500' : ''}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80">{icon}{label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums leading-none">{value}</div>
    </Wrapper>
  );
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="text-center py-14 rounded-[28px] bg-white/5 border border-white/10">
      <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">{icon}</div>
      <p className="font-bold text-white">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{text}</p>
    </div>
  );
}

function ProfilePicker({ profiles, value, onChange }: { profiles: Profile[]; value: number | ''; onChange: (id: number) => void }) {
  if (profiles.length === 0) return <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">Aucun forfait disponible.</div>;
  return (
    <div role="radiogroup" aria-label="Forfait" className="space-y-2.5 max-h-72 overflow-y-auto pr-1 -mr-1">
      {profiles.map((p) => {
        const active = value === p.id;
        return (
          <button key={p.id} type="button" role="radio" aria-checked={active} onClick={() => onChange(p.id)} className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${active ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/25' : 'border-white/10 bg-gray-800/70 hover:bg-gray-800 hover:border-white/20'}`}>
            <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${active ? 'bg-amber-500 text-black' : 'bg-white/5 text-amber-500'}`}><Wifi className="w-5 h-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white leading-snug truncate">{p.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.rate_limit} · {p.duration_days} jours</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-extrabold text-amber-400 tabular-nums leading-tight">{p.price.toLocaleString()}</p>
              <p className="text-[10px] font-semibold text-gray-500">FCFA</p>
            </div>
            <span className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-amber-500 bg-amber-500' : 'border-white/20'}`}>
              {active && <Check className="w-3 h-3 text-black" strokeWidth={4} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      {message && <p className="text-sm text-neutral-500">{message}</p>}
    </div>
  );
}

// ───────── Helpers ─────────
const statusOf = (u: User): { key: StatusKey; label: string; cls: string } => {
  const expired = u.expires_at ? new Date(u.expires_at).getTime() < Date.now() : false;
  if (u.status === 'suspended') return { key: 'suspended', label: 'Suspendu', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  if (expired || u.status === 'expired') return { key: 'expired', label: 'Expiré', cls: 'bg-red-500/15 text-red-400 border-red-500/30' };
  return { key: 'active', label: 'Actif', cls: 'bg-green-500/15 text-green-400 border-green-500/30' };
};

const daysLeft = (iso: string) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
};

export default function PPPoEPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [wanView, setWanView] = useState<WanView>('monitor');
  const [routers, setRouters] = useState<Router[]>([]);
  const [selectedRouter, setSelectedRouter] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recherche + filtre abonnés
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusKey>('all');

  // Formulaire forfait
  const [profName, setProfName] = useState('');
  const [profDownload, setProfDownload] = useState('10');
  const [profUpload, setProfUpload] = useState('10');
  const [profPrice, setProfPrice] = useState('');
  const [profDuration, setProfDuration] = useState('30');

  // Formulaire abonné
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<number | ''>('');

  // Config PPPoE
  const [cfgPort, setCfgPort] = useState('ether5');
  const [cfgService, setCfgService] = useState('MBEEJ_PPPOE');
  const [cfgPool, setCfgPool] = useState('pool_pppoe');
  const [cfgRange, setCfgRange] = useState('10.50.0.2-10.50.255.254');
  const [cfgGateway, setCfgGateway] = useState('10.50.0.1/16');
  const [cfgDns, setCfgDns] = useState('1.1.1.1,8.8.8.8');
  const [cfgInterface, setCfgInterface] = useState('bridge_pppoe');

  // Config VLAN
  const [vlanTrunkPort, setVlanTrunkPort] = useState('ether5');
  const [vlansList, setVlansList] = useState<VLANInterface[]>([
    { name: 'vlan-pppoe', vlan_id: 20, role: 'pppoe', ip_address: '10.50.0.1/16' },
    { name: 'vlan-hotspot', vlan_id: 30, role: 'hotspot', ip_address: '192.168.88.1/24' },
  ]);

  // Config Load Balancing
  const [wans, setWans] = useState<WAN[]>([{ name: 'Starlink 1', interface: 'ether1', gateway: '', weight: 1 }]);

  // Monitoring WAN
  const [wanStats, setWanStats] = useState<WanStat[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<{ time: string; download: number; upload: number }[]>([]);
  const prevStatsRef = useRef<Record<string, { rx: number; tx: number; time: number }>>({});

  const activeGroup = TAB_META[activeTab].group;

  // ───────── Chargement ─────────
  useEffect(() => {
    api.get('/routers').then(res => {
      const adapted = res.data.map((r: any) => ({ id: r.ID || r.id, name: r.Name || r.name }));
      setRouters(adapted);
      if (adapted.length > 0) setSelectedRouter(adapted[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRouter) return;
    // On repart de zéro pour la surveillance WAN quand on change de routeur
    setTrafficHistory([]);
    setWanStats([]);
    prevStatsRef.current = {};
    fetchData();
  }, [selectedRouter]);

  // Polling WAN (uniquement quand la surveillance est visible)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (activeTab === 'wan' && wanView === 'monitor' && selectedRouter) {
      const fetchWanStats = async () => {
        try {
          const res = await api.get(`/api/pppoe/wan-stats/${selectedRouter}`);
          const stats: WanStat[] = res.data || [];
          setWanStats(stats);

          const now = Date.now();
          let totalDownloadMbps = 0;
          let totalUploadMbps = 0;
          const newPrev = { ...prevStatsRef.current };

          stats.forEach(stat => {
            const prev = prevStatsRef.current[stat.interface];
            if (prev) {
              const dt = (now - prev.time) / 1000;
              if (dt > 0 && stat.rx >= prev.rx && stat.tx >= prev.tx) {
                totalDownloadMbps += ((stat.rx - prev.rx) * 8) / 1000000 / dt;
                totalUploadMbps += ((stat.tx - prev.tx) * 8) / 1000000 / dt;
              }
            }
            newPrev[stat.interface] = { rx: stat.rx, tx: stat.tx, time: now };
          });

          prevStatsRef.current = newPrev;
          setTrafficHistory(prev => [...prev.slice(-19), {
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            download: Number(totalDownloadMbps.toFixed(2)),
            upload: Number(totalUploadMbps.toFixed(2)),
          }]);
        } catch (e) { console.error(e); }
      };
      fetchWanStats();
      interval = setInterval(fetchWanStats, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeTab, wanView, selectedRouter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, uRes] = await Promise.all([
        api.get(`/api/pppoe/profiles?router_id=${selectedRouter}`),
        api.get(`/api/pppoe/users?router_id=${selectedRouter}`),
      ]);
      setProfiles(Array.isArray(pRes.data) ? pRes.data : []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
    } catch (e) { toast.error('Erreur chargement données'); } finally { setLoading(false); }
  };

  // ───────── Actions ─────────
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post('/api/pppoe/profiles', { router_id: selectedRouter, name: profName, rate_limit: `${profUpload}M/${profDownload}M`, price: Number(profPrice), duration_days: Number(profDuration) });
      toast.success('Forfait créé'); setIsProfileModalOpen(false);
      setProfName(''); setProfPrice(''); setProfUpload('10'); setProfDownload('10'); setProfDuration('30');
      fetchData();
    } catch (e: any) { toast.error(e.response?.data || 'Erreur'); } finally { setIsSubmitting(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post('/api/pppoe/users', { router_id: selectedRouter, profile_id: Number(selectedProfile), name: clientName, phone: clientPhone });
      toast.success('Abonné créé !'); setIsUserModalOpen(false);
      setClientName(''); setClientPhone(''); setSelectedProfile('');
      fetchData();
    } catch (e: any) { toast.error(e.response?.data || 'Erreur'); } finally { setIsSubmitting(false); }
  };

  const handleSetupInfrastructure = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post(`/api/pppoe/setup/${selectedRouter}`, {
        port: cfgPort, service_name: cfgService, pool_name: cfgPool, client_range: cfgRange, gateway_ip: cfgGateway, dns: cfgDns, interface: cfgInterface,
      });
      toast.success('Infrastructure PPPoE configurée !');
    } catch (e: any) { toast.error(e.response?.data || 'Erreur'); } finally { setIsSubmitting(false); }
  };

  const addVlan = () => setVlansList(prev => [...prev, { name: `vlan-${prev.length + 1}`, vlan_id: 40 + prev.length, role: 'custom', ip_address: '192.168.1.1/24' }]);
  const removeVlan = (index: number) => setVlansList(prev => prev.filter((_, i) => i !== index));
  const updateVlan = (index: number, patch: Partial<VLANInterface>) => setVlansList(prev => prev.map((v, i) => i === index ? { ...v, ...patch } : v));

  const handleSetupVLAN = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post(`/api/pppoe/setup-vlan/${selectedRouter}`, {
        trunk_port: vlanTrunkPort, bridge_name: 'bridge-lan', is_enabled: true, interfaces: vlansList,
      });
      toast.success('Configuration VLAN appliquée !');
    } catch (e: any) { toast.error(e.response?.data || 'Erreur VLAN'); } finally { setIsSubmitting(false); }
  };

  const handleSetupLoadBalancing = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post(`/api/pppoe/setup-loadbalancing/${selectedRouter}`, {
        wans, lan_interfaces: ['bridge-lan', 'vlan-pppoe', 'vlan-hotspot'],
      });
      toast.success('Load Balancing activé !');
    } catch (e: any) { toast.error(e.response?.data || 'Erreur Load Balancing'); } finally { setIsSubmitting(false); }
  };

  const updateWan = (index: number, patch: Partial<WAN>) => setWans(prev => prev.map((w, i) => i === index ? { ...w, ...patch } : w));
  const addWan = () => setWans(prev => [...prev, { name: `WAN ${prev.length + 1}`, interface: `ether${prev.length + 1}`, gateway: '', weight: 1 }]);
  const removeWan = (index: number) => setWans(prev => prev.filter((_, i) => i !== index));

  const toggleStatus = async (u: User) => {
    try {
      await api.put(`/api/pppoe/users/${u.id}/${u.status === 'active' ? 'suspend' : 'activate'}`);
      toast.success(u.status === 'active' ? 'Abonné suspendu' : 'Abonné réactivé');
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  const deleteUser = async (u: User) => {
    if (!confirm(`Supprimer définitivement l'abonné "${u.name}" ?`)) return;
    try {
      await api.delete(`/api/pppoe/users/${u.id}`);
      toast.success('Abonné supprimé');
      fetchData();
    } catch { toast.error('Erreur suppression'); }
  };

  const copyCreds = (u: User) => {
    navigator.clipboard.writeText(`Utilisateur : ${u.username}\nMot de passe : ${u.password}`);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Identifiants copiés !');
  };

  const getWhatsAppLink = (phone: string, username: string, password: string) => {
    if (!phone) return '#';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.length === 9) cleanPhone = '221' + cleanPhone;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Bonjour,\n\nVoici vos identifiants de connexion Internet :\n👤 Utilisateur : ${username}\n🔑 Mot de passe : ${password}\n\nMerci de votre confiance !`
    )}`;
  };

  // ───────── Données dérivées ─────────
  const counts = useMemo(() => {
    const c = { active: 0, suspended: 0, expired: 0 };
    users.forEach(u => { c[statusOf(u).key]++; });
    return c;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      if (statusFilter !== 'all' && statusOf(u).key !== statusFilter) return false;
      if (!q) return true;
      return [u.name, u.phone, u.username, u.profile_name].some(v => (v || '').toLowerCase().includes(q));
    });
  }, [users, search, statusFilter]);

  const subscribersByProfile = useMemo(() => {
    const m: Record<string, number> = {};
    users.forEach(u => { m[u.profile_name] = (m[u.profile_name] || 0) + 1; });
    return m;
  }, [users]);

  const lastPoint = trafficHistory[trafficHistory.length - 1];
  const wansUp = wanStats.filter(s => s.is_up).length;

  return (
    <Layout>
      <style>{`
        @keyframes pppoe-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pppoe-sheet { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pppoe-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .pppoe-fade { animation: pppoe-fade .2s ease both; }
        .pppoe-sheet { animation: pppoe-sheet .35s cubic-bezier(.2,.8,.2,1) both; }
        .pppoe-rise { animation: pppoe-rise .4s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 pt-4 pb-10">
        {/* ═════ En-tête ═════ */}
        <header className="mb-5">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-amber-500 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider mb-3">
            <Network className="w-3.5 h-3.5" /> PPPoE & RÉSEAU
          </div>
          <h1 className="text-[30px] sm:text-4xl leading-tight font-extrabold tracking-tight text-white">Gestion réseau avancée</h1>
        </header>

        {/* ═════ Barre de contrôle : routeur + navigation ═════ */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-3 sm:p-4 shadow-xl space-y-3">
          {/* Routeur */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 shrink-0">
              <RouterIcon className="w-3.5 h-3.5" /> Routeur
            </span>
            <div className="flex-1 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {routers.map((r) => (
                <button key={r.id} onClick={() => setSelectedRouter(r.id)} className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-bold border transition-all active:scale-95 ${selectedRouter === r.id ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-gray-300 border-white/10'}`}>
                  <RouterIcon className="w-4 h-4 sm:hidden" /> {r.name}
                </button>
              ))}
              {routers.length === 0 && !loading && <p className="text-sm text-gray-500 py-2">Aucun routeur. Créez-en un d'abord.</p>}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* Niveau 1 : groupes */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
            {GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => setActiveTab(g.tabs[0])}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-extrabold transition-all ${activeGroup === g.key ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>

          {/* Niveau 2 : onglets du groupe */}
          <div role="tablist" className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {GROUPS.find(g => g.key === activeGroup)!.tabs.map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={activeTab === k}
                onClick={() => setActiveTab(k)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all active:scale-95 ${activeTab === k ? 'bg-white/10 text-white border-amber-500/60' : 'bg-transparent text-gray-400 border-white/10 hover:text-white'}`}
              >
                {TAB_META[k].icon} {TAB_META[k].label}
                {k === 'users' && <span className="text-[10px] bg-white/10 rounded-full px-1.5 py-0.5">{users.length}</span>}
                {k === 'profiles' && <span className="text-[10px] bg-white/10 rounded-full px-1.5 py-0.5">{profiles.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ═════ ABONNÉS ═════ */}
        {activeTab === 'users' && (
          <>
            {/* Statistiques / filtres rapides */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              <StatCard icon={<Users className="w-3.5 h-3.5" />} label="Total" value={users.length} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
              <StatCard icon={<UserCheck className="w-3.5 h-3.5" />} label="Actifs" value={counts.active} tone="green" active={statusFilter === 'active'} onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')} />
              <StatCard icon={<PauseCircle className="w-3.5 h-3.5" />} label="Suspendus" value={counts.suspended} tone="amber" active={statusFilter === 'suspended'} onClick={() => setStatusFilter(statusFilter === 'suspended' ? 'all' : 'suspended')} />
              <StatCard icon={<UserX className="w-3.5 h-3.5" />} label="Expirés" value={counts.expired} tone="red" active={statusFilter === 'expired'} onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')} />
            </div>

            {/* Recherche + action */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un nom, un numéro, un identifiant…"
                  className={`${inputCls} pl-11 !py-3`}
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="Effacer" className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-gray-300">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button onClick={() => setIsUserModalOpen(true)} className="h-12 px-6 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-amber-600/25 transition-all active:scale-[0.98] shrink-0">
                <UserPlus className="w-5 h-5" /> Nouvel abonné
              </button>
            </div>

            {loading ? (
              <LoadingSpinner message="Chargement des abonnés..." />
            ) : users.length === 0 ? (
              <EmptyState icon={<Users className="w-8 h-8" />} title="Aucun abonné" text="Ajoutez votre premier client PPPoE." />
            ) : filteredUsers.length === 0 ? (
              <EmptyState icon={<Search className="w-8 h-8" />} title="Aucun résultat" text="Modifiez votre recherche ou le filtre sélectionné." />
            ) : (
              <>
                <p className="mb-3 text-xs text-gray-500">{filteredUsers.length} abonné{filteredUsers.length > 1 ? 's' : ''} affiché{filteredUsers.length > 1 ? 's' : ''}</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {filteredUsers.map((u) => {
                    const st = statusOf(u);
                    const dl = daysLeft(u.expires_at);
                    const soon = st.key === 'active' && dl !== null && dl <= 7;
                    return (
                      <article key={u.id} className="pppoe-rise rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 p-4 shadow-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg font-extrabold">
                            {(u.name || '?').trim().charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {u.phone || 'Pas de numéro'}</p>
                          </div>
                          <span className={`shrink-0 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label.toUpperCase()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="rounded-2xl bg-white/5 border border-white/5 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1"><Wifi className="w-3 h-3" /> Forfait</p>
                            <p className="text-sm font-bold text-white mt-1 truncate">{u.profile_name}</p>
                            <p className="text-xs text-amber-500">{u.rate_limit}</p>
                          </div>
                          <div className={`rounded-2xl border p-3 ${soon ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5'}`}>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1"><Calendar className="w-3 h-3" /> Expiration</p>
                            <p className="text-sm font-bold text-white mt-1">{u.expires_at ? format(new Date(u.expires_at), 'dd MMM yyyy', { locale: fr }) : '—'}</p>
                            {dl !== null && st.key !== 'suspended' && (
                              <p className={`text-xs font-semibold ${dl < 0 ? 'text-red-400' : soon ? 'text-amber-400' : 'text-gray-400'}`}>
                                {dl < 0 ? `Expiré depuis ${Math.abs(dl)} j` : dl === 0 ? "Expire aujourd'hui" : `Dans ${dl} jour${dl > 1 ? 's' : ''}`}
                              </p>
                            )}
                          </div>
                        </div>

                        <button onClick={() => copyCreds(u)} className="mt-2 w-full text-left rounded-2xl bg-black/40 border border-white/5 px-3 py-2.5 font-mono text-xs text-amber-400 break-all active:scale-[0.99] transition-all" title="Toucher pour copier">
                          {u.username} / {u.password}
                        </button>

                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {u.phone && u.phone.trim() !== '' ? (
                            <a href={getWhatsAppLink(u.phone, u.username, u.password)} target="_blank" rel="noopener noreferrer" className="h-11 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center active:scale-95 transition-all" title="Envoyer via WhatsApp">
                              <MessageCircle className="w-5 h-5" />
                            </a>
                          ) : (
                            <button disabled className="h-11 rounded-xl bg-white/5 text-gray-600 opacity-50 cursor-not-allowed flex items-center justify-center"><MessageCircle className="w-5 h-5" /></button>
                          )}
                          <button onClick={() => copyCreds(u)} className="h-11 rounded-xl bg-white/5 text-gray-300 flex items-center justify-center active:scale-95 transition-all" title="Copier">
                            {copiedId === u.id ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                          </button>
                          <button onClick={() => toggleStatus(u)} className={`h-11 rounded-xl flex items-center justify-center active:scale-95 transition-all ${u.status === 'active' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`} title={u.status === 'active' ? 'Suspendre' : 'Activer'}>
                            {u.status === 'active' ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                          </button>
                          <button onClick={() => deleteUser(u)} className="h-11 rounded-xl bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center active:scale-95 transition-all" title="Supprimer">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ═════ FORFAITS ═════ */}
        {activeTab === 'profiles' && (
          <>
            <div className="flex items-center justify-between gap-3 mb-5">
              <p className="text-sm text-gray-400">{profiles.length} forfait{profiles.length > 1 ? 's' : ''} • {users.length} abonné{users.length > 1 ? 's' : ''} au total</p>
              <button onClick={() => setIsProfileModalOpen(true)} className="h-12 px-6 flex items-center justify-center gap-2 bg-white text-black rounded-2xl text-sm font-bold shadow-xl transition-all active:scale-[0.98] shrink-0">
                <Tag className="w-5 h-5" /> Nouveau forfait
              </button>
            </div>

            {loading ? (
              <LoadingSpinner message="Chargement des forfaits..." />
            ) : profiles.length === 0 ? (
              <EmptyState icon={<Tag className="w-8 h-8" />} title="Aucun forfait configuré" text="Créez un forfait pour pouvoir ajouter des abonnés." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {profiles.map((p) => {
                  const n = subscribersByProfile[p.name] || 0;
                  return (
                    <article key={p.id} className="pppoe-rise relative overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 p-5 shadow-xl">
                      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                      <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center"><Wifi className="w-5 h-5" /></div>
                        <h3 className="font-extrabold text-white text-lg leading-tight truncate flex-1">{p.name}</h3>
                      </div>
                      <div className="relative mt-4 flex items-end gap-1.5">
                        <span className="text-3xl font-black tracking-tight text-amber-400 tabular-nums">{p.price.toLocaleString()}</span>
                        <span className="pb-1 text-sm text-gray-400 font-medium">FCFA</span>
                      </div>
                      <div className="relative mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-full"><Gauge className="w-3.5 h-3.5 text-amber-500" /> {p.rate_limit}</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-full"><Clock className="w-3.5 h-3.5 text-amber-500" /> {p.duration_days} jours</span>
                      </div>
                      <div className="relative mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-gray-500">Abonnés</span>
                        <span className={`font-extrabold ${n > 0 ? 'text-white' : 'text-gray-600'}`}>{n}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═════ PPPoE ═════ */}
        {activeTab === 'settings' && (
          <FormCard icon={<Settings className="w-6 h-6" />} title="Configuration PPPoE" subtitle="Paramètres appliqués sur le routeur sélectionné.">
            <form onSubmit={handleSetupInfrastructure} className="space-y-4">
              <FieldGroup title="Serveur">
                <Field label="Port physique (ex: ether5)"><input value={cfgPort} onChange={e => setCfgPort(e.target.value)} className={inputCls} required /></Field>
                <Field label="Nom du service"><input value={cfgService} onChange={e => setCfgService(e.target.value)} className={inputCls} required /></Field>
                <Field label="Interface d'écoute PPPoE" className="sm:col-span-2">
                  <select value={cfgInterface} onChange={e => setCfgInterface(e.target.value)} className={inputCls}>
                    <option value="bridge_pppoe">bridge_pppoe (Mode Simple / Sans VLAN)</option>
                    <option value="vlan-pppoe">vlan-pppoe (Mode Trunk / Avec VLAN)</option>
                  </select>
                </Field>
              </FieldGroup>

              <FieldGroup title="Adressage clients">
                <Field label="Pool d'IP"><input value={cfgPool} onChange={e => setCfgPool(e.target.value)} className={inputCls} required /></Field>
                <Field label="Plage IP clients"><input value={cfgRange} onChange={e => setCfgRange(e.target.value)} className={inputCls} required /></Field>
                <Field label="IP passerelle"><input value={cfgGateway} onChange={e => setCfgGateway(e.target.value)} className={inputCls} required /></Field>
                <Field label="Serveurs DNS"><input value={cfgDns} onChange={e => setCfgDns(e.target.value)} className={inputCls} required /></Field>
              </FieldGroup>

              <button type="submit" disabled={isSubmitting} className={`${primaryBtn} mt-2`}>{isSubmitting ? 'Configuration...' : 'Activer PPPoE'}</button>
            </form>
          </FormCard>
        )}

        {/* ═════ VLANs ═════ */}
        {activeTab === 'vlan' && (
          <div className="grid lg:grid-cols-5 gap-4 items-start">
            <div className="lg:col-span-3">
              <FormCard icon={<Layers className="w-6 h-6" />} title="VLANs dynamiques" subtitle="Ajoutez autant de réseaux isolés que nécessaire.">
                <Notice>Le mode Trunk transporte plusieurs réseaux sur un seul câble. Définissez vos VLANs (PPPoE, Hotspot, Caméras, etc.).</Notice>
                <form onSubmit={handleSetupVLAN} className="space-y-4">
                  <Field label="Port Trunk physique (ex: ether5)"><input value={vlanTrunkPort} onChange={e => setVlanTrunkPort(e.target.value)} className={inputCls} required /></Field>

                  <div className="space-y-3">
                    {vlansList.map((vlan, index) => (
                      <div key={index} className="rounded-2xl bg-white/5 border border-white/10 p-4 pppoe-rise">
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-2 text-sm font-extrabold text-white">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs">ID {vlan.vlan_id}</span>
                            {vlan.name}
                          </span>
                          <button type="button" onClick={() => removeVlan(index)} className="text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-all" aria-label="Supprimer ce VLAN"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Nom"><input value={vlan.name} onChange={e => updateVlan(index, { name: e.target.value })} className={inputCls} required /></Field>
                          <Field label="ID VLAN (1-4094)"><input type="number" value={vlan.vlan_id} onChange={e => updateVlan(index, { vlan_id: Number(e.target.value) })} className={inputCls} required /></Field>
                          <Field label="Rôle">
                            <select value={vlan.role} onChange={e => updateVlan(index, { role: e.target.value })} className={inputCls}>
                              <option value="pppoe">PPPoE (Résidentiel)</option>
                              <option value="hotspot">Hotspot (Wi-Fi)</option>
                              <option value="guest">Invité</option>
                              <option value="camera">Caméras</option>
                              <option value="custom">Autre</option>
                            </select>
                          </Field>
                          <Field label="Adresse IP"><input value={vlan.ip_address} onChange={e => updateVlan(index, { ip_address: e.target.value })} className={inputCls} required /></Field>
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={addVlan} className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-500/30 text-amber-500 text-sm font-bold bg-amber-500/5 active:scale-[0.98] transition-all">
                      <Plus className="w-4 h-4" /> Ajouter un VLAN
                    </button>
                  </div>

                  <button type="submit" disabled={isSubmitting} className={`${primaryBtn} mt-2`}>{isSubmitting ? 'Configuration...' : 'Appliquer la configuration VLAN'}</button>
                </form>
              </FormCard>
            </div>

            {/* Schéma du réseau, collé à côté du formulaire */}
            <aside className="lg:col-span-2 lg:sticky lg:top-4">
              <div className="pppoe-rise relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black shadow-xl">
                <div className="absolute inset-0 opacity-60 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:18px_18px]" />
                <div className="relative p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-500 mb-3">Schéma du réseau</p>
                  <div className="max-w-[280px] mx-auto">
                    <CompactCtx.Provider value={true}><VlanDiagram /></CompactCtx.Provider>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ═════ MULTI-WAN ═════ */}
        {activeTab === 'wan' && (
          <div className="space-y-4">
            {/* Bascule Surveillance / Configuration */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1 max-w-md">
              <button onClick={() => setWanView('monitor')} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${wanView === 'monitor' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}>
                <Activity className="w-4 h-4" /> Surveillance
              </button>
              <button onClick={() => setWanView('config')} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${wanView === 'config' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}>
                <SlidersHorizontal className="w-4 h-4" /> Configuration
              </button>
            </div>

            {wanView === 'monitor' && (
              <>
                {/* Débit instantané */}
                <div className="grid grid-cols-3 gap-2.5">
                  <StatCard icon={<ArrowDown className="w-3.5 h-3.5" />} label="Download" tone="amber" value={<>{lastPoint ? lastPoint.download.toFixed(1) : '—'}<span className="text-xs font-semibold ml-1">Mbps</span></>} />
                  <StatCard icon={<ArrowUp className="w-3.5 h-3.5" />} label="Upload" value={<>{lastPoint ? lastPoint.upload.toFixed(1) : '—'}<span className="text-xs font-semibold ml-1">Mbps</span></>} />
                  <StatCard icon={<Globe className="w-3.5 h-3.5" />} label="Lignes en ligne" tone={wanStats.length > 0 && wansUp === wanStats.length ? 'green' : 'red'} value={`${wansUp}/${wanStats.length}`} />
                </div>

                <div className="pppoe-rise bg-gray-900 border border-white/10 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-500" /> Bande passante globale (Mbps)</h3>
                  <div className="h-64 w-full">
                    {trafficHistory.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-gray-500">En attente de données...</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trafficHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                            <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="time" stroke="#666" fontSize={10} tickMargin={10} />
                          <YAxis stroke="#666" fontSize={10} width={40} />
                          <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value) => [`${value} Mbps`, '']} />
                          <Area type="monotone" dataKey="download" name="Téléchargement" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorDownload)" />
                          <Area type="monotone" dataKey="upload" name="Envoi" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUpload)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="flex justify-center gap-6 mt-2 text-xs font-medium text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Téléchargement</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Envoi</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {wanStats.map((stat) => (
                    <div key={stat.interface} className="pppoe-rise bg-gray-900 border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-lg">
                      <div>
                        <h3 className="text-white font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-amber-500" /> {stat.name}</h3>
                        <p className="text-xs text-gray-400 font-mono mt-1">{stat.interface}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full inline-block mb-2 border ${stat.is_up ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {stat.is_up ? '● En ligne' : '● Hors ligne'}
                        </div>
                        <div className="text-xs text-gray-300 font-mono flex items-center justify-end gap-1"><ArrowDown className="w-3 h-3 text-amber-500" /> {(stat.rx / (1024 * 1024)).toFixed(2)} Mo</div>
                        <div className="text-xs text-gray-300 font-mono flex items-center justify-end gap-1 mt-0.5"><ArrowUp className="w-3 h-3 text-amber-500" /> {(stat.tx / (1024 * 1024)).toFixed(2)} Mo</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {wanView === 'config' && (
              <FormCard icon={<Globe className="w-6 h-6" />} title="Configuration Multi-WAN" subtitle="Gérez vos lignes WAN et leurs poids.">
                <Notice>Répartissez le trafic Internet sur plusieurs lignes (ex: Starlink). Si une ligne tombe, le trafic bascule automatiquement sur les autres.</Notice>
                <form onSubmit={handleSetupLoadBalancing} className="space-y-3">
                  {wans.map((wan, index) => (
                    <div key={index} className="pppoe-rise rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-2 text-sm font-extrabold text-white">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center text-xs">{index + 1}</span> Connexion WAN
                        </span>
                        {wans.length > 1 && (
                          <button type="button" onClick={() => removeWan(index)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 active:scale-95 transition-all" aria-label="Supprimer cette ligne"><X className="w-5 h-5" /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Field label="Nom"><input value={wan.name} onChange={e => updateWan(index, { name: e.target.value })} className={inputCls} required /></Field>
                        <Field label="Interface"><input value={wan.interface} onChange={e => updateWan(index, { interface: e.target.value })} className={inputCls} required /></Field>
                        <Field label="Gateway"><input value={wan.gateway} onChange={e => updateWan(index, { gateway: e.target.value })} className={inputCls} placeholder="192.168.1.1" required /></Field>
                        <Field label="Poids"><input type="number" min="1" max="10" value={wan.weight} onChange={e => updateWan(index, { weight: Number(e.target.value) })} className={inputCls} required /></Field>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addWan} className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-500/30 text-amber-500 text-sm font-bold bg-amber-500/5 active:scale-[0.98] transition-all">
                    <Plus className="w-4 h-4" /> Ajouter une connexion WAN
                  </button>
                  {wans.length < 2 && <p className="text-xs text-amber-300/90 text-center">Ajoutez au moins 2 connexions WAN pour activer le Load Balancing.</p>}
                  <button type="submit" disabled={isSubmitting} className={`${primaryBtn} mt-2`}>{isSubmitting ? 'Configuration...' : 'Activer le Load Balancing'}</button>
                </form>
              </FormCard>
            )}
          </div>
        )}
      </div>

      {/* ═════ MODALS ═════ */}
      <Sheet open={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Nouveau forfait PPPoE">
        <form onSubmit={handleCreateProfile} className="space-y-4">
          <Field label="Nom du forfait"><input placeholder="Ex : Fibre 20M" required value={profName} onChange={e => setProfName(e.target.value)} className={inputCls} /></Field>
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Débits internet (Mbps)</label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Download"><input type="number" min="1" required value={profDownload} onChange={e => setProfDownload(e.target.value)} className={inputCls} /></Field>
              <Field label="Upload"><input type="number" min="1" required value={profUpload} onChange={e => setProfUpload(e.target.value)} className={inputCls} /></Field>
            </div>
            <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Rate limit MikroTik généré</p>
              <p className="text-lg font-extrabold text-amber-500">{profUpload || '0'}M/{profDownload || '0'}M</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix (FCFA)"><input type="number" min="0" required value={profPrice} onChange={e => setProfPrice(e.target.value)} className={inputCls} /></Field>
            <Field label="Durée (jours)"><input type="number" min="1" required value={profDuration} onChange={e => setProfDuration(e.target.value)} className={inputCls} /></Field>
          </div>
          <button type="submit" disabled={isSubmitting} className={`${primaryBtn} mt-2`}>{isSubmitting ? 'Création...' : 'Créer le forfait'}</button>
        </form>
      </Sheet>

      <Sheet open={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Nouvel abonné PPPoE">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Field label="Nom complet"><input placeholder="Nom complet du client" required value={clientName} onChange={e => setClientName(e.target.value)} className={inputCls} /></Field>
          <Field label="Téléphone"><input type="tel" placeholder="Ex : 771234567" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} className={inputCls} /></Field>
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block">Forfait</label>
            <ProfilePicker profiles={profiles} value={selectedProfile} onChange={setSelectedProfile} />
          </div>
          <button type="submit" disabled={isSubmitting || profiles.length === 0 || selectedProfile === ''} className={`${primaryBtn} mt-2`}>
            {isSubmitting ? 'Génération...' : 'Générer les identifiants'}
          </button>
        </form>
      </Sheet>
    </Layout>
  );
}