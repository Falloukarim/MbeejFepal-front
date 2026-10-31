'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import api from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Network, Settings, UserPlus, X, Copy, Check, Power, PowerOff, Trash2, Tag } from 'lucide-react';

// --- Interfaces ---
interface Router { id: number; name: string; }
interface Profile { id: number; name: string; rate_limit: string; price: number; duration_days: number; }
interface User { id: number; name: string; phone: string; username: string; password: string; status: string; expires_at: string; profile_name: string; rate_limit: string; }

export default function PPPoEPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  
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
  // Profil
  const [profName, setProfName] = useState('');
  const [profSpeed, setProfSpeed] = useState('');
  const [profPrice, setProfPrice] = useState('');
  const [profDuration, setProfDuration] = useState('30');
  // Abonné
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<number | ''>('');
  // Config Réseau
  const [cfgPort, setCfgPort] = useState('ether5');
  const [cfgService, setCfgService] = useState('MBEEJ_PPPOE');
  const [cfgPool, setCfgPool] = useState('pool_pppoe');
  const [cfgRange, setCfgRange] = useState('10.50.0.2-10.50.255.254');
  const [cfgGateway, setCfgGateway] = useState('10.50.0.1/16');
  const [cfgDns, setCfgDns] = useState('1.1.1.1,8.8.8.8');

  // Chargement initial
  useEffect(() => {
    api.get('/routers').then(res => {
      const adapted = res.data.map((r: any) => ({ id: r.ID || r.id, name: r.Name || r.name }));
      setRouters(adapted);
      if (adapted.length > 0) setSelectedRouter(adapted[0].id);
    });
  }, []);

  // Recharger si on change de routeur
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
      // ✅ Sécurité pour éviter le .map sur null
      setProfiles(Array.isArray(pRes.data) ? pRes.data : []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
    } catch (e) {
      toast.error('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post('/api/pppoe/profiles', {
        router_id: selectedRouter, name: profName, rate_limit: profSpeed, price: Number(profPrice), duration_days: Number(profDuration)
      });
      toast.success('Forfait créé'); 
      setIsProfileModalOpen(false); 
      setProfName(''); setProfSpeed(''); setProfPrice('');
      fetchData();
    } catch (e:any) { 
      toast.error(e.response?.data || 'Erreur forfait'); 
    } finally { setIsSubmitting(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post('/api/pppoe/users', {
        router_id: selectedRouter, profile_id: Number(selectedProfile), name: clientName, phone: clientPhone
      });
      toast.success('Abonné créé avec succès !'); 
      setIsUserModalOpen(false); 
      setClientName(''); setClientPhone(''); setSelectedProfile('');
      fetchData();
    } catch (e:any) { 
      // Gestion du timeout du routeur
      if (e.code === 'ECONNABORTED' || e.message.includes('timeout')) {
        toast.error('Le routeur MikroTik ne répond pas (Timeout). Vérifiez le VPN.');
      } else {
        toast.error(e.response?.data || 'Erreur abonné'); 
      }
    } finally { setIsSubmitting(false); }
  };

  const handleSetupInfrastructure = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post(`/api/pppoe/setup/${selectedRouter}`, {
        port: cfgPort, service_name: cfgService, pool_name: cfgPool, client_range: cfgRange, gateway_ip: cfgGateway, dns: cfgDns
      });
      toast.success('Infrastructure réseau configurée avec succès !');
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

  return (
    <Layout>
      {/* En-tête */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-amber-500 px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
            <Network className="w-4 h-4" /> PPPoE RÉSIDENTIEL
          </div>
          <h1 className="text-3xl font-bold text-white">Gestion PPPoE</h1>
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}>Abonnés</button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}>Configuration</button>
        </div>
      </div>

      {/* Sélecteur Routeur */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
        <label className="text-gray-300 text-sm">Routeur :</label>
        <select value={selectedRouter || ''} onChange={e => setSelectedRouter(Number(e.target.value))} className="bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-2">
          {routers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {/* CONTENU : ONGLET ABONNÉS */}
      {activeTab === 'users' && (
        <>
          <div className="flex gap-2 mb-6">
             <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
                <Tag className="w-4 h-4" /> + Nouveau Forfait
             </button>
             <button onClick={() => setIsUserModalOpen(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg">
                <UserPlus className="w-4 h-4" /> + Nouvel Abonné
             </button>
          </div>
          
          <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400 border-b border-white/10">
                <tr><th className="px-6 py-4">Client</th><th className="px-6 py-4">Forfait</th><th className="px-6 py-4">Expiration</th><th className="px-6 py-4">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-10 text-amber-500">Chargement...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-500">Aucun abonné pour le moment.</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{u.name} <span className="text-gray-500 font-normal">({u.phone})</span></div>
                        <div className="font-mono text-xs text-amber-500 mt-1">{u.username} / {u.password}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{u.profile_name}</div>
                        <div className="text-amber-500 text-xs">{u.rate_limit}</div>
                      </td>
                      <td className="px-6 py-4">{format(new Date(u.expires_at), 'dd MMM yyyy', { locale: fr })}</td>
                      <td className="px-6 py-4 flex gap-3 items-center">
                        <button onClick={() => copyCreds(u)} className="p-2 bg-white/5 rounded-lg hover:text-white transition-all">{copiedId === u.id ? <Check className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4"/>}</button>
                        <button onClick={() => toggleStatus(u)} className={`p-2 rounded-lg bg-white/5 transition-all ${u.status === 'active' ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>{u.status === 'active' ? <PowerOff className="w-4 h-4"/> : <Power className="w-4 h-4"/>}</button>
                        <button onClick={() => deleteUser(u.id)} className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* CONTENU : ONGLET CONFIGURATION (AstaTech Style) */}
      {activeTab === 'settings' && (
        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-[32px] p-8 max-w-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <h2 className="relative z-10 text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings className="text-amber-500"/> Configuration Réseau PPPoE</h2>
          <form onSubmit={handleSetupInfrastructure} className="relative z-10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Port Physique (ex: ether5)</label>
                <input value={cfgPort} onChange={e => setCfgPort(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-amber-500" required/>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nom du Service</label>
                <input value={cfgService} onChange={e => setCfgService(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-amber-500" required/>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nom du Pool</label>
                <input value={cfgPool} onChange={e => setCfgPool(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-amber-500" required/>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Plage IP Clients</label>
                <input value={cfgRange} onChange={e => setCfgRange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-amber-500" required/>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">IP Passerelle</label>
                <input value={cfgGateway} onChange={e => setCfgGateway(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-amber-500" required/>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Serveurs DNS</label>
                <input value={cfgDns} onChange={e => setCfgDns(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-amber-500" required/>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-xl mt-6 transition-all shadow-lg disabled:opacity-50">
              {isSubmitting ? 'Configuration en cours...' : 'Activer / Mettre à jour PPPoE sur le routeur'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL : AJOUTER UN FORFAIT */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-[24px] shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
            <h2 className="text-xl font-bold text-white mb-6">Nouveau Forfait PPPoE</h2>
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <input placeholder="Nom (ex: Fibre 10M)" required value={profName} onChange={e => setProfName(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              <input placeholder="Débit (ex: 10M/10M)" required value={profSpeed} onChange={e => setProfSpeed(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              <input type="number" placeholder="Prix (FCFA)" required value={profPrice} onChange={e => setProfPrice(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              <input type="number" placeholder="Durée (jours)" required value={profDuration} onChange={e => setProfDuration(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl mt-2 disabled:opacity-50">
                {isSubmitting ? 'Création...' : 'Créer le Forfait'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : AJOUTER UN ABONNÉ */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-[24px] shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsUserModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
            <h2 className="text-xl font-bold text-white mb-6">Nouvel Abonné PPPoE</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input placeholder="Nom complet du client" required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              <input placeholder="Téléphone (ex: 771234567)" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              
              <select required value={selectedProfile} onChange={e => setSelectedProfile(e.target.value ? Number(e.target.value) : '')} className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                <option value="" disabled>Sélectionnez un forfait</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name} - {p.rate_limit} ({p.price} F)</option>)}
              </select>
              
              {profiles.length === 0 && (
                <p className="text-xs text-red-400">Veuillez d'abord créer un forfait.</p>
              )}

              <button type="submit" disabled={isSubmitting || profiles.length === 0} className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl mt-2 disabled:opacity-50">
                {isSubmitting ? 'Génération en cours...' : 'Générer les identifiants'}
              </button>
            </form>
          </div>
        </div>
      )} 
    </Layout>
  );
}