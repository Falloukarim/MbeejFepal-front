'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getMySessions } from '@/lib/api';
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

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getMySessions();
        console.log('📦 Sessions reçues (brut):', data);
        
        // Adapter les données (majuscules → minuscules)
        const adaptedSessions = data.map((item: any) => ({
          id: item.ID,
          zone_code: item.ZoneCode || null,
          users_id: item.UserID,
          router_id: item.RouterID,
          hotspot_id: item.HotspotID,
          mac_address: item.MacAddress,
          ip_address: item.IpAddress || null,
          state: item.State || 'CREATED',
          created_at: item.CreatedAt,
          expires_at: item.ExpiresAt
        })).filter(session => session.id);
        
        console.log('✅ Sessions adaptées:', adaptedSessions);
        setSessions(adaptedSessions || []);
      } catch (error) {
        console.error('❌ Erreur chargement sessions:', error);
        toast.error('Erreur lors du chargement des sessions');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Fonction de formatage des dates
  const formatDate = (dateString: string | null | undefined, format: 'full' | 'short' | 'time' = 'full') => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      switch (format) {
        case 'short':
          return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        case 'time':
          return date.toLocaleString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          });
        default:
          return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
      }
    } catch {
      return 'Date invalide';
    }
  };

  // Calcul du temps restant
  const getRemainingTime = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    
    try {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) return null;
      
      const now = new Date();
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffMin = Math.round(diffMs / 60000);
      
      return diffMin > 0 ? diffMin : 0;
    } catch {
      return null;
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'ACTIVE':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Active</span>;
      case 'CREATED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Créée</span>;
      case 'EXPIRED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">Expirée</span>;
      case 'TERMINATED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Terminée</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">{state}</span>;
    }
  };

  // Extraire les 6 premiers caractères de l'UUID pour l'affichage
  const formatUserId = (userId: string) => {
    if (!userId) return '-';
    return userId.substring(0, 6) + '...';
  };

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
            <i className="bi bi-star-fill mr-1"></i> SESSIONS
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Historique des sessions</h1>
          <p className="text-gray-600 mt-2">Consultez toutes vos connexions</p>
        </div>

        {/* Liste des sessions */}
        <div className="bg-white/95 backdrop-blur-[20px] border border-[rgba(217,119,6,0.2)] rounded-[32px] shadow-xl overflow-hidden animate-[slideUp_0.6s_ease-out]">
          <div className="px-6 py-4 border-b border-[rgba(217,119,6,0.2)] bg-gradient-to-r from-[#fff7e6] to-[#fffbeb]">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <i className="bi bi-clock-history text-[#d97706]"></i>
              Liste des sessions
            </h2>
          </div>

          {sessions.length > 0 ? (
            <div className="divide-y divide-[rgba(217,119,6,0.1)]">
              {sessions.map((session, index) => {
                const remainingMinutes = getRemainingTime(session.expires_at);
                
                return (
                  <div 
                    key={session.id} 
                    className="px-6 py-5 hover:bg-[rgba(217,119,6,0.05)] transition-colors animate-[slideUp_0.5s_ease-out]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        {/* En-tête de la session */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#d97706] to-[#92400e] rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0">
                            <i className="bi bi-wifi"></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-medium text-gray-900">
                                Session #{session.id}
                              </p>
                              {getStateBadge(session.state)}
                              <span className="text-xs text-gray-500">
                                {formatDate(session.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Grille d'informations détaillées */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Utilisateur */}
                          <div className="flex items-center gap-2 p-2 bg-[rgba(217,119,6,0.05)] rounded-lg">
                            <i className="bi bi-person text-[#d97706] text-xs"></i>
                            <span className="text-gray-500">Utilisateur:</span>
                            <span className="text-gray-900 font-mono text-xs" title={session.users_id}>
                              {formatUserId(session.users_id)}
                            </span>
                          </div>

                          {/* Routeur */}
                          <div className="flex items-center gap-2 p-2 bg-[rgba(217,119,6,0.05)] rounded-lg">
                            <i className="bi bi-router text-[#d97706] text-xs"></i>
                            <span className="text-gray-500">Routeur:</span>
                            <span className="text-gray-900 font-medium">#{session.router_id}</span>
                          </div>

                          {/* Forfait */}
                          <div className="flex items-center gap-2 p-2 bg-[rgba(217,119,6,0.05)] rounded-lg">
                            <i className="bi bi-tag text-[#d97706] text-xs"></i>
                            <span className="text-gray-500">Forfait:</span>
                            <span className="text-gray-900 font-medium">#{session.hotspot_id}</span>
                          </div>

                          {/* Adresse MAC */}
                          <div className="flex items-center gap-2 p-2 bg-[rgba(217,119,6,0.05)] rounded-lg">
                            <i className="bi bi-hash text-[#d97706] text-xs"></i>
                            <span className="text-gray-500">MAC:</span>
                            <span className="text-gray-900 font-mono text-xs">{session.mac_address}</span>
                          </div>
                        </div>

                        {/* Dates d'expiration */}
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <i className="bi bi-calendar-plus"></i>
                            <span>Création: {formatDate(session.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <i className="bi bi-calendar-x"></i>
                            <span>Expiration: {formatDate(session.expires_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badge temps restant pour les sessions actives */}
                      {session.state === 'ACTIVE' && remainingMinutes !== null && remainingMinutes > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(217,119,6,0.1)] rounded-xl border border-[rgba(217,119,6,0.2)] lg:self-center">
                          <i className="bi bi-hourglass-split text-[#d97706] animate-spin"></i>
                          <span className="text-sm text-[#d97706] font-medium whitespace-nowrap">
                            {remainingMinutes} min restantes
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#fff7e6] to-[#fffbeb] rounded-full flex items-center justify-center border border-[rgba(217,119,6,0.2)]">
                <i className="bi bi-clock-history text-5xl text-[#d97706] opacity-50"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune session pour le moment</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Les sessions apparaîtront ici lorsque des clients se connecteront à vos hotspots
              </p>
            </div>
          )}
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
      `}</style>
    </Layout>
  );
}