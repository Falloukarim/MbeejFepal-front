'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Layout from '@/components/layout/Layout';
import api from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  Network,
  Settings,
  UserPlus,
  X,
  Copy,
  Check,
  Power,
  PowerOff,
  Trash2,
  Tag,
  Wifi,
  MessageCircle,
  Phone,
  Calendar,
  Clock,
  Users,
  Router as RouterIcon,
} from 'lucide-react';

// --- Interfaces ---
interface Router { id: number; name: string; }
interface Profile { id: number; name: string; rate_limit: string; price: number; duration_days: number; }
interface User { id: number; name: string; phone: string; username: string; password: string; status: string; expires_at: string; profile_name: string; rate_limit: string; }

const inputCls =
  'w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all';

// ───────── Feuille modale façon mobile (bottom sheet) ─────────
function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm pppoe-fade" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="pppoe-sheet w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-gray-900 border border-white/10 rounded-t-[28px] sm:rounded-[28px] shadow-2xl px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white active:scale-95 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ───────── Sélecteur de forfait (remplace le <select> à fond blanc) ─────────
function ProfilePicker({ profiles, value, onChange }: { profiles: Profile[]; value: number | ''; onChange: (id: number) => void }) {
  if (profiles.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
        Aucun forfait disponible. Créez d'abord un forfait dans l'onglet « Forfaits ».
      </div>
    );
  }
  return (
    <div role="radiogroup" aria-label="Forfait" className="space-y-2.5 max-h-72 overflow-y-auto pr-1 -mr-1">
      {profiles.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(p.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
              active
                ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/25'
                : 'border-white/10 bg-gray-800/70 hover:bg-gray-800 hover:border-white/20'
            }`}
          >
            <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${active ? 'bg-amber-500 text-black' : 'bg-white/5 text-amber-500'}`}>
              <Wifi className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white leading-snug truncate">{p.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {p.rate_limit} · {p.duration_days} jours
              </p>
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

export default function PPPoEPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'profiles' | 'settings'>('users');

  const [routers, setRouters] = useState<Router[]>([]);
  const [selectedRouter, setSelectedRouter] = useState<number | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Formulaires ---
  const [profName, setProfName] = useState('');
  const [profDownload, setProfDownload] = useState('10');
  const [profUpload, setProfUpload] = useState('10');
  const [profPrice, setProfPrice] = useState('');
  const [profDuration, setProfDuration] = useState('30');

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<number | ''>('');

  const [cfgPort, setCfgPort] = useState('ether5');
  const [cfgService, setCfgService] = useState('MBEEJ_PPPOE');
  const [cfgPool, setCfgPool] = useState('pool_pppoe');
  const [cfgRange, setCfgRange] = useState('10.50.0.2-10.50.255.254');
  const [cfgGateway, setCfgGateway] = useState('10.50.0.1/16');
  const [cfgDns, setCfgDns] = useState('1.1.1.1,8.8.8.8');

  useEffect(() => {
    api.get('/routers').then(res => {
      const adapted = res.data.map((r: any) => ({ id: r.ID || r.id, name: r.Name || r.name }));
      setRouters(adapted);
      if (adapted.length > 0) setSelectedRouter(adapted[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedRouter) return;
    fetchData();
  }, [selectedRouter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, uRes] = await Promise.all([
        api.get(`/api/pppoe/profiles?router_id=${selectedRouter}`),
        api.get(`/api/pppoe/users?router_id=${selectedRouter}`)
      ]);
      setProfiles(Array.isArray(pRes.data) ? pRes.data : []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
    } catch (e) {
      toast.error('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const download = Number(profDownload);
    const upload = Number(profUpload);

    if (!Number.isFinite(download) || download <= 0 || !Number.isFinite(upload) || upload <= 0) {
      toast.error('Les débits Download et Upload doivent être supérieurs à 0.');
      return;
    }

    if (!selectedRouter) {
      toast.error('Veuillez sélectionner un routeur.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/pppoe/profiles', {
        router_id: selectedRouter,
        name: profName,
        rate_limit: `${upload}M/${download}M`,
        price: Number(profPrice),
        duration_days: Number(profDuration)
      });
      toast.success('Forfait créé');
      setIsProfileModalOpen(false);
      setProfName(''); setProfDownload('10'); setProfUpload('10'); setProfPrice(''); setProfDuration('30');
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data || 'Erreur forfait');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProfile === '') {
      toast.error('Veuillez choisir un forfait.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/pppoe/users', {
        router_id: selectedRouter, profile_id: Number(selectedProfile), name: clientName, phone: clientPhone
      });
      toast.success('Abonné créé avec succès !');
      setIsUserModalOpen(false);
      setClientName(''); setClientPhone(''); setSelectedProfile('');
      fetchData();
    } catch (e:any) {
      toast.error(e.response?.data || 'Erreur abonné');
    } finally { setIsSubmitting(false); }
  };

  const handleSetupInfrastructure = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post(`/api/pppoe/setup/${selectedRouter}`, {
        port: cfgPort, service_name: cfgService, pool_name: cfgPool, client_range: cfgRange, gateway_ip: cfgGateway, dns: cfgDns
      });
      toast.success('Infrastructure réseau configurée !');
    } catch (e: any) {
      toast.error(e.response?.data || 'Erreur de configuration');
    } finally { setIsSubmitting(false); }
  };

  const toggleStatus = async (u: User) => {
    try {
      await api.put(`/api/pppoe/users/${u.id}/${u.status === 'active' ? 'suspend' : 'activate'}`);
      fetchData();
    } catch (e) { toast.error('Erreur action'); }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Supprimer cet abonné ?')) return;
    try { await api.delete(`/api/pppoe/users/${id}`); fetchData(); } catch (e) { toast.error('Erreur suppression'); }
  };

  const copyCreds = (u: User) => {
    navigator.clipboard.writeText(`User: ${u.username}\nPass: ${u.password}`);
    setCopiedId(u.id); setTimeout(() => setCopiedId(null), 2000);
    toast.success('Identifiants copiés !');
  };

  // Génère le lien WhatsApp
  const getWhatsAppLink = (phone: string, username: string, password: string) => {
    if (!phone) return '#';
    // Nettoie le numéro (enlève les espaces, le +, le 00, et le 0 initial)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    // Ajoute l'indicatif du Sénégal (221) si le numéro fait 9 chiffres
    if (cleanPhone.length === 9) cleanPhone = '221' + cleanPhone;

    const message = `Bonjour ${username},\n\nVoici vos identifiants de connexion Internet :\n👤 Utilisateur : ${username}\n🔑 Mot de passe : ${password}\n\nMerci de votre confiance !`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const tabs: { key: 'users' | 'profiles' | 'settings'; label: string; icon: ReactNode }[] = [
    { key: 'users', label: 'Abonnés', icon: <Users className="w-4 h-4" /> },
    { key: 'profiles', label: 'Forfaits', icon: <Tag className="w-4 h-4" /> },
    { key: 'settings', label: 'Réseau', icon: <Settings className="w-4 h-4" /> },
  ];

  const statusOf = (u: User) => {
    const expired = new Date(u.expires_at).getTime() < Date.now();
    if (u.status !== 'active') return { label: 'Suspendu', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    if (expired) return { label: 'Expiré', cls: 'bg-red-500/15 text-red-400 border-red-500/30' };
    return { label: 'Actif', cls: 'bg-green-500/15 text-green-400 border-green-500/30' };
  };

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

      <div className="max-w-3xl mx-auto px-4 pt-4 pb-10">
        {/* En-tête */}
        <header className="mb-5">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-amber-500 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider mb-3">
            <Network className="w-3.5 h-3.5" /> PPPoE RÉSIDENTIEL
          </div>
          <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-white">Gestion PPPoE</h1>
          <p className="text-sm text-gray-400 mt-1">
            {users.length} abonné{users.length > 1 ? 's' : ''} · {profiles.length} forfait{profiles.length > 1 ? 's' : ''}
          </p>
        </header>

        {/* Onglets (segmented control) */}
        <div role="tablist" className="grid grid-cols-3 bg-white/5 border border-white/10 rounded-2xl p-1 mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                activeTab === t.key ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Sélecteur de routeur : pastilles défilantes */}
        <div className="mb-6 -mx-4 px-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {routers.length === 0 && <span className="text-sm text-gray-500">Aucun routeur</span>}
          {routers.map((r) => {
            const active = selectedRouter === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRouter(r.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition-all active:scale-95 ${
                  active ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-gray-300 border-white/10'
                }`}
              >
                <RouterIcon className="w-4 h-4" />
                {r.name}
              </button>
            );
          })}
        </div>

        {/* ───────── ONGLET : ABONNÉS ───────── */}
        {activeTab === 'users' && (
          <>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="w-full h-14 mb-5 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl text-base font-bold shadow-xl shadow-amber-600/25 transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-5 h-5" /> Nouvel abonné
            </button>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[0, 1, 2].map((i) => <div key={i} className="h-44 rounded-[28px] bg-white/10" />)}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-14 rounded-[28px] bg-white/5 border border-white/10">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Users className="w-8 h-8" />
                </div>
                <p className="font-bold text-white">Aucun abonné pour le moment</p>
                <p className="text-sm text-gray-400 mt-1">Ajoutez votre premier client PPPoE.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u, i) => {
                  const st = statusOf(u);
                  return (
                    <article
                      key={u.id}
                      className="pppoe-rise rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 p-4 shadow-xl"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    >
                      {/* Haut : avatar, nom, statut */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg font-extrabold">
                          {(u.name || '?').trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {u.phone || 'Pas de numéro'}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full border ${st.cls}`}>
                          {st.label.toUpperCase()}
                        </span>
                      </div>

                      {/* Forfait + expiration */}
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="rounded-2xl bg-white/5 border border-white/5 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1"><Wifi className="w-3 h-3" /> Forfait</p>
                          <p className="text-sm font-bold text-white mt-1 truncate">{u.profile_name}</p>
                          <p className="text-xs text-amber-500">{u.rate_limit}</p>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-white/5 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1"><Calendar className="w-3 h-3" /> Expiration</p>
                          <p className="text-sm font-bold text-white mt-1">{format(new Date(u.expires_at), 'dd MMM yyyy', { locale: fr })}</p>
                        </div>
                      </div>

                      {/* Identifiants */}
                      <div className="mt-2 rounded-2xl bg-black/40 border border-white/5 px-3 py-2.5 font-mono text-xs text-amber-400 break-all">
                        {u.username} / {u.password}
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {u.phone && u.phone.trim() !== '' ? (
                          <a
                            href={getWhatsAppLink(u.phone, u.username, u.password)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-11 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center active:scale-95 transition-all"
                            title="Envoyer les identifiants via WhatsApp"
                            aria-label="Envoyer via WhatsApp"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </a>
                        ) : (
                          <button disabled className="h-11 rounded-xl bg-white/5 text-gray-600 opacity-50 cursor-not-allowed flex items-center justify-center" title="Numéro de téléphone manquant" aria-label="WhatsApp indisponible">
                            <MessageCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => copyCreds(u)} className="h-11 rounded-xl bg-white/5 text-gray-300 flex items-center justify-center active:scale-95 transition-all" title="Copier" aria-label="Copier les identifiants">
                          {copiedId === u.id ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => toggleStatus(u)}
                          className={`h-11 rounded-xl flex items-center justify-center active:scale-95 transition-all ${u.status === 'active' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}
                          title={u.status === 'active' ? 'Suspendre' : 'Activer'}
                          aria-label={u.status === 'active' ? 'Suspendre' : 'Activer'}
                        >
                          {u.status === 'active' ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="h-11 rounded-xl bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center active:scale-95 transition-all" title="Supprimer" aria-label="Supprimer">
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

        {/* ───────── ONGLET : FORFAITS ───────── */}
        {activeTab === 'profiles' && (
          <>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full h-14 mb-5 flex items-center justify-center gap-2 bg-white text-black rounded-2xl text-base font-bold shadow-xl transition-all active:scale-[0.98]"
            >
              <Tag className="w-5 h-5" /> Nouveau forfait
            </button>

            {profiles.length === 0 ? (
              <div className="text-center py-14 rounded-[28px] bg-white/5 border border-white/10">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Tag className="w-8 h-8" />
                </div>
                <p className="font-bold text-white">Aucun forfait configuré</p>
                <p className="text-sm text-gray-400 mt-1">Créez un forfait pour pouvoir ajouter des abonnés.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {profiles.map((p, i) => (
                  <article
                    key={p.id}
                    className="pppoe-rise relative overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 p-5 shadow-xl"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                    <div className="relative flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Wifi className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-white text-lg leading-tight truncate">{p.name}</h3>
                    </div>
                    <div className="relative mt-4 flex items-end gap-1.5">
                      <span className="text-3xl font-black tracking-tight text-amber-400 tabular-nums">{p.price.toLocaleString()}</span>
                      <span className="pb-1 text-sm text-gray-400 font-medium">FCFA</span>
                    </div>
                    <div className="relative mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-full">
                        <Wifi className="w-3.5 h-3.5 text-amber-500" /> {p.rate_limit}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> {p.duration_days} jours
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* ───────── ONGLET : CONFIGURATION ───────── */}
        {activeTab === 'settings' && (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-[28px] p-5 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <h2 className="relative z-10 text-xl font-extrabold text-white mb-1 flex items-center gap-2"><Settings className="text-amber-500" /> Configuration réseau</h2>
            <p className="relative z-10 text-sm text-gray-400 mb-6">Paramètres PPPoE appliqués sur le routeur sélectionné.</p>
            <form onSubmit={handleSetupInfrastructure} className="relative z-10 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Port physique (ex: ether5)', value: cfgPort, set: setCfgPort },
                  { label: 'Nom du service', value: cfgService, set: setCfgService },
                  { label: 'Nom du pool', value: cfgPool, set: setCfgPool },
                  { label: 'Plage IP clients', value: cfgRange, set: setCfgRange },
                  { label: 'IP passerelle', value: cfgGateway, set: setCfgGateway },
                  { label: 'Serveurs DNS', value: cfgDns, set: setCfgDns },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">{f.label}</label>
                    <input value={f.value} onChange={(e) => f.set(e.target.value)} className={inputCls} required />
                  </div>
                ))}
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl mt-4 shadow-xl shadow-amber-600/25 transition-all active:scale-[0.98] disabled:opacity-50">
                {isSubmitting ? 'Configuration en cours...' : 'Activer / Mettre à jour PPPoE sur le routeur'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ───────── MODALS ───────── */}
      <Sheet open={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Nouveau forfait PPPoE">
        <form onSubmit={handleCreateProfile} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Nom du forfait</label>
            <input placeholder="Ex : Fibre 20M" required value={profName} onChange={e => setProfName(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Débits internet (Mbps)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Download</label>
                <input type="number" min="1" step="any" placeholder="20" required value={profDownload} onChange={e => setProfDownload(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Upload</label>
                <input type="number" min="1" step="any" placeholder="10" required value={profUpload} onChange={e => setProfUpload(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Rate limit MikroTik généré</p>
              <p className="text-lg font-extrabold text-amber-500">{profUpload || '0'}M/{profDownload || '0'}M</p>
              <p className="text-[10px] text-gray-500 mt-1">Format : Upload / Download</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Prix (FCFA)</label>
              <input type="number" min="0" step="1" placeholder="Prix" required value={profPrice} onChange={e => setProfPrice(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Durée (jours)</label>
              <input type="number" min="1" step="1" placeholder="30" required value={profDuration} onChange={e => setProfDuration(e.target.value)} className={inputCls} />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl mt-2 shadow-xl shadow-amber-600/25 transition-all active:scale-[0.98] disabled:opacity-50">
            {isSubmitting ? 'Création...' : 'Créer le forfait'}
          </button>
        </form>
      </Sheet>

      <Sheet open={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Nouvel abonné PPPoE">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Nom complet</label>
            <input placeholder="Nom complet du client" required value={clientName} onChange={e => setClientName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Téléphone</label>
            <input type="tel" inputMode="tel" placeholder="Ex : 771234567" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block">Forfait</label>
            <ProfilePicker profiles={profiles} value={selectedProfile} onChange={setSelectedProfile} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || profiles.length === 0 || selectedProfile === ''}
            className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl mt-2 shadow-xl shadow-amber-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {isSubmitting ? 'Génération en cours...' : 'Générer les identifiants'}
          </button>
        </form>
      </Sheet>
    </Layout>
  );
}