'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getRouters, getProfiles, getWallet, getMySessions, type Router, type HotspotProfile, type Wallet, type Session } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      // 1. Récupérer les routeurs
      const routersData = await getRouters();
      console.log('📦 Routeurs reçus (brut):', routersData);
      
      // Adapter les routeurs
      const adaptedRouters = routersData.map((item: any) => ({
        id: item.ID,
        user_id: item.UserID,
        name: item.Name || 'Sans nom',
        config_token: item.ConfigToken,
        is_active: item.IsActive || false,
        last_seen: item.LastSeen,
        created_at: item.CreatedAt
      })).filter(router => router.id);
      
      setRouters(adaptedRouters);
      console.log('✅ Routeurs adaptés:', adaptedRouters);

      // 2. Récupérer tous les profils
      try {
        const profilesData = await getProfiles();
        console.log('📦 Profils reçus (brut):', profilesData);
        
        // Adapter les profils
        const adaptedProfiles = profilesData.map((item: any) => ({
          id: item.id,
          router_id: item.router_id || item.RouterID,
          profile_name: item.profile_name || item.ProfileName || 'Sans nom',
          duration_minutes: item.duration_minutes || item.DurationMinutes || 0,
          price: item.price || item.Price || 0,
          currency: item.currency || item.Currency || 'XOF',
          bandwidth_limit: item.bandwidth_limit || item.BandwidthLimit,
          is_active: item.is_active || item.IsActive || false,
          created_at: item.created_at || item.CreatedAt,
          updated_at: item.updated_at || item.UpdatedAt
        })).filter(profile => profile.id);
        
        setProfiles(adaptedProfiles);
        console.log('✅ Profils adaptés:', adaptedProfiles);
      } catch (error) {
        console.error('❌ Erreur chargement profils:', error);
      }
      
      // 3. Récupérer wallet et sessions
      const [walletData, sessionsData] = await Promise.all([
        getWallet().catch(() => {
          console.log('⚠️ Wallet non disponible');
          return null;
        }),
        getMySessions().catch(() => {
          console.log('⚠️ Sessions non disponibles');
          return [];
        }),
      ]);
      
      // Adapter le wallet (avec cast any)
      if (walletData) {
        console.log('📦 Wallet reçu (brut):', walletData);
        const rawWallet = walletData as any;
        const adaptedWallet = {
          id: rawWallet.ID,
          user_id: rawWallet.UserID,
          balance: rawWallet.Balance,
          currency: rawWallet.Currency,
          created_at: rawWallet.CreatedAt,
          updated_at: rawWallet.UpdatedAt
        };
        console.log('✅ Wallet adapté:', adaptedWallet);
        setWallet(adaptedWallet);
      }
      
      // Adapter les sessions
      if (sessionsData && sessionsData.length > 0) {
        console.log('📦 Sessions reçues (brut):', sessionsData);
        
        const adaptedSessions = sessionsData.map((item: any) => ({
          id: item.id || item.ID,
          zone_code: item.zone_code || item.ZoneCode,
          users_id: item.users_id || item.UsersID,
          router_id: item.router_id || item.RouterID,
          hotspot_id: item.hotspot_id || item.HotspotID,
          mac_address: item.mac_address || item.MacAddress,
          ip_address: item.ip_address || item.IpAddress,
          state: item.state || item.State || 'CREATED',
          created_at: item.created_at || item.CreatedAt,
          expires_at: item.expires_at || item.ExpiresAt
        })).filter(session => session.id);
        
        setSessions(adaptedSessions);
        console.log('✅ Sessions adaptées:', adaptedSessions);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
  // Fonction de formatage sécurisé des dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // Wallet par défaut robuste
  const safeWallet = {
    balance: wallet?.balance ?? 0,
    currency: wallet?.currency ?? 'XOF'
  };

  const formatBalance = (balance: number | undefined, currency: string) => {
    if (typeof balance !== 'number' || isNaN(balance)) return '0 XOF';
    return `${balance.toLocaleString()} ${currency || 'XOF'}`;
  };

  const stats = [
    {
      name: 'Routeurs actifs',
      value: routers.filter(r => r.is_active).length,
      total: routers.length,
      icon: '📡',
    },
    {
      name: 'Forfaits actifs',
      value: profiles.filter(p => p.is_active).length,
      total: profiles.length,
      icon: '🏷️',
    },
    {
      name: 'Solde',
      value: formatBalance(safeWallet.balance, safeWallet.currency),
      icon: '💰',
    },
    {
      name: 'Sessions actives',
      value: sessions.filter(s => s.state === 'ACTIVE').length,
      total: sessions.length,
      icon: '🕒',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="relative w-20 h-20">
            <i className="bi bi-wifi text-5xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#d97706] animate-[pulse_2s_ease-in-out_infinite]"></i>
            <div className="absolute inset-0 border-2 border-[#d97706] rounded-full animate-[ripple_1.5s_linear_infinite]"></div>
            <div className="absolute inset-0 border-2 border-[#d97706] rounded-full animate-[ripple_1.5s_linear_infinite_0.5s]"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Effets de fond */}
      <div className="fixed inset-0 pointer-events-none z-0"
           style={{
             background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 50%, #fde68a 100%)'
           }}>
        <div className="absolute inset-0"
             style={{
               background: 'radial-gradient(circle at 0% 0%, rgba(217,119,6,0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(217,119,6,0.08) 0%, transparent 50%)'
             }} />
        <div className="absolute inset-0"
             style={{
               background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"none\"><path d=\"M0 0 L100 100 M100 0 L0 100\" stroke=\"%23d97706\" stroke-width=\"0.5\" opacity=\"0.05\"/></svg>')",
               backgroundSize: '50px 50px'
             }} />
      </div>

      <div className="relative z-10">
        {/* En-tête */}
        <div className="mb-8 animate-[slideUp_0.5s_ease-out]">
          <div className="inline-block bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-md">
            <i className="bi bi-star-fill mr-1"></i> TABLEAU DE BORD
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenue sur votre espace</h1>
          <p className="text-gray-600 mt-2">Gérez vos routeurs, forfaits et suivez vos revenus</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-gray-800 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-[slideUp_0.5s_ease-out]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl animate-[float_3s_ease-in-out_infinite]" style={{ animationDelay: `${index * 0.2}s` }}>
                    {stat.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-300">{stat.name}</span>
                </div>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.total !== undefined && (
                  <p className="text-sm text-gray-400 mt-2">
                    sur {stat.total} au total
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/routers/new"
            className="group relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-gray-800 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4 animate-[float_3s_ease-in-out_infinite]">📡</div>
              <h3 className="text-xl font-semibold mb-2">Ajouter un routeur</h3>
              <p className="text-gray-300">Configurez un nouveau point d'accès</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                <span>Commencer</span>
                <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          </Link>

          <Link
            href="/profiles/new"
            className="group relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-gray-800 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4 animate-[float_3s_ease-in-out_infinite_0.2s]">🏷️</div>
              <h3 className="text-xl font-semibold mb-2">Créer un forfait</h3>
              <p className="text-gray-300">Définissez une nouvelle offre</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                <span>Créer</span>
                <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          </Link>

          <Link
            href="/wallet"
            className="group relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-gray-800 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4 animate-[float_3s_ease-in-out_infinite_0.4s]">💰</div>
              <h3 className="text-xl font-semibold mb-2">Mon portefeuille</h3>
              <p className="text-gray-300">Consultez vos revenus</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                <span>Voir le solde</span>
                <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          </Link>
        </div>

        {/* Grille des sections récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Routeurs récents */}
          <div className="group relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-gray-800 rounded-2xl shadow-xl animate-[slideUp_0.6s_ease-out]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative z-10">
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">📡</span>
                  Routeurs récents
                </h2>
                <Link href="/routers" className="text-[#d97706] hover:text-[#fbbf24] font-medium transition-colors flex items-center gap-1 group/link">
                  <span>Voir tout</span>
                  <i className="bi bi-arrow-right group-hover/link:translate-x-1 transition-transform"></i>
                </Link>
              </div>
              
              <div className="divide-y divide-white/10">
                {routers.slice(0, 5).map((router) => {
                  // Sécurité : si l'ID n'existe pas, on ignore cet élément
                  if (!router?.id) return null;
                  return (
                    <div key={router.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold
                          ${router.is_active ? 'bg-[#d97706]' : 'bg-gray-600'}`}>
                          📡
                        </div>
                        <div>
                          <p className="font-medium text-white">{router.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${router.is_active ? 'bg-[#d97706]' : 'bg-gray-500'}`}></span>
                            {router.is_active ? 'Actif' : 'Inactif'}
                            {router.last_seen && (
                              <>
                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                <span>Vu le {formatDate(router.last_seen)}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/routers/${router.id}`}
                        className="text-[#d97706] hover:text-[#fbbf24] font-medium text-sm transition-colors"
                      >
                        Détails →
                      </Link>
                    </div>
                  );
                })}
                {routers.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <div className="text-5xl mb-4 opacity-30">📡</div>
                    <p className="text-gray-400 mb-2">Aucun routeur pour le moment</p>
                    <Link href="/routers/new" className="text-[#d97706] hover:text-[#fbbf24] font-medium text-sm">
                      + Ajouter un routeur
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sessions actives */}
          <div className="group relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-gray-800 rounded-2xl shadow-xl animate-[slideUp_0.7s_ease-out]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative z-10">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">🕒</span>
                  Sessions actives
                </h2>
              </div>
              
              <div className="divide-y divide-white/10">
                {sessions.filter(s => s.state === 'ACTIVE').slice(0, 5).map((session) => {
                  // Sécurité : si l'ID n'existe pas, on ignore cet élément
                  if (!session?.id) return null;
                  return (
                    <div key={session.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#d97706] rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          <i className="bi bi-wifi text-xs"></i>
                        </div>
                        <div>
                          <p className="font-medium text-white">Session #{session.id}</p>
                          <p className="text-xs text-gray-400">
                            MAC: {session.mac_address || 'Inconnue'} • Créée le {formatDate(session.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                        Active
                      </span>
                    </div>
                  );
                })}
                {sessions.filter(s => s.state === 'ACTIVE').length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <div className="text-5xl mb-4 opacity-30">💤</div>
                    <p className="text-gray-400">Aucune session active</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <i className="bi bi-c-circle me-1"></i>
          2026 MbeejFepal. Tous droits réservés.
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { 
            transform: scale(1) translate(-50%, -50%);
            opacity: 1;
          }
          50% { 
            transform: scale(1.1) translate(-45%, -45%);
            opacity: 0.9;
          }
        }

        @keyframes ripple {
          0% {
            width: 20px;
            height: 20px;
            opacity: 0.5;
          }
          100% {
            width: 80px;
            height: 80px;
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </Layout>
  );
}