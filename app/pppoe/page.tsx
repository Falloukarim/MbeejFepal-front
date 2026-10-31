'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { 
  getRouters, 
  getPPPProfiles, 
  getPPPUsers, 
  createPPPUser, 
  suspendPPPUser, 
  activatePPPUser,
  type Router, 
  type PPPProfile, 
  type PPPUser 
} from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Network, 
  Plus, 
  Copy, 
  Check, 
  Power, 
  PowerOff, 
  UserPlus, 
  X,
  Wifi
} from 'lucide-react';

export default function PPPoEPage() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [selectedRouter, setSelectedRouter] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<PPPProfile[]>([]);
  const [users, setUsers] = useState<PPPUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Formulaire
  const [selectedProfile, setSelectedProfile] = useState<number | ''>('');
  const [duration, setDuration] = useState(30);

  // 1. Charger les routeurs au démarrage
  useEffect(() => {
    const fetchRouters = async () => {
      try {
        const data = await getRouters();
        setRouters(data);
        if (data.length > 0) setSelectedRouter(data[0].id);
      } catch (error) {
        toast.error('Erreur chargement des routeurs');
      }
    };
    fetchRouters();
  }, []);

  // 2. Charger les profils et les clients quand on change de routeur
  useEffect(() => {
    if (!selectedRouter) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profilesData, usersData] = await Promise.all([
          getPPPProfiles(selectedRouter),
          getPPPUsers(selectedRouter)
        ]);
        setProfiles(profilesData);
        setUsers(usersData);
      } catch (error) {
        toast.error('Erreur chargement des données PPPoE');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedRouter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouter || !selectedProfile) {
      toast.error('Veuillez choisir un forfait');
      return;
    }

    setIsCreating(true);
    try {
      const newUser = await createPPPUser({
        router_id: selectedRouter,
        profile_id: Number(selectedProfile), // ✅ Number() pour être sûr
        duration_days: duration
      });
      setUsers([newUser, ...users]);
      setIsModalOpen(false);
      setSelectedProfile('');
      toast.success(`Abonné ${newUser.username} créé avec succès !`);
    } catch (error: any) {
      toast.error(error.response?.data || "Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (user: PPPUser) => {
    try {
      if (user.status === 'active') {
        await suspendPPPUser(user.id);
        setUsers(users.map(u => u.id === user.id ? { ...u, status: 'suspended' } : u));
        toast.success('Abonné suspendu');
      } else {
        await activatePPPUser(user.id);
        setUsers(users.map(u => u.id === user.id ? { ...u, status: 'active' } : u));
        toast.success('Abonné réactivé');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const copyCredentials = (user: PPPUser) => {
    const text = `Identifiants PPPoE\nUser: ${user.username}\nPass: ${user.password}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Identifiants copiés !');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'suspended': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'expired': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-amber-500 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
            <Network className="w-4 h-4" />
            ABONNÉS RÉSIDENTIELS
          </div>
          <h1 className="text-3xl font-bold text-white">Clients PPPoE</h1>
          <p className="text-gray-300 mt-2">Générez et gérez les accès Internet fixes de vos clients.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
        >
          <UserPlus className="w-5 h-5" /> Générer un abonné
        </button>
      </div>

      {/* Sélecteur de routeur */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <label className="text-gray-300 font-medium flex items-center gap-2">
          <Wifi className="w-5 h-5 text-amber-500" /> Routeur :
        </label>
        <select
          value={selectedRouter || ''}
          onChange={(e) => setSelectedRouter(Number(e.target.value))}
          className="w-full sm:w-64 bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500"
        >
          {routers.map(r => (
            <option key={r.id} value={r.id}>{r.name} (ID: {r.id})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-[32px] shadow-2xl border border-white/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-5">Client</th>
                  <th className="px-6 py-5">Forfait</th>
                  <th className="px-6 py-5">Expiration</th>
                  <th className="px-6 py-5">Statut</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.username}</div>
                      <div className="text-sm text-gray-400 font-mono">{user.password}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{user.profile_name || 'Inconnu'}</div>
                      <div className="text-xs text-amber-500 font-medium">{user.rate_limit}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {format(new Date(user.expires_at), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(user.status)}`}>
                        {user.status === 'active' ? 'Actif' : user.status === 'suspended' ? 'Suspendu' : 'Expiré'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyCredentials(user)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          title="Copier les identifiants"
                        >
                          {copiedId === user.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-lg transition-all ${user.status === 'active' ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                          title={user.status === 'active' ? 'Suspendre' : 'Réactiver'}
                        >
                          {user.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Aucun client PPPoE pour ce routeur.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE CRÉATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="p-6 border-b border-white/10 flex justify-between items-center relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" /> Nouvel Abonné
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Forfait (Vitesse)</label>
                <select
                  value={selectedProfile}
                  // ✅ CORRECTION ICI
                  onChange={(e) => setSelectedProfile(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="" disabled>Sélectionnez un forfait</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.rate_limit}) - {p.price.toLocaleString()} F</option>
                  ))}
                </select>
                {profiles.length === 0 && (
                  <p className="text-xs text-red-400 mt-2">Aucun forfait configuré pour ce routeur.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Durée (jours)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={1}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreating || profiles.length === 0}
                className="w-full bg-[#d97706] text-white font-bold py-3 rounded-xl hover:bg-[#b45309] transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 mt-4"
              >
                {isCreating ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Générer les identifiants <Plus className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}