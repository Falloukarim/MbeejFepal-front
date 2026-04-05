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
        setSessions(adaptedSessions);
      } catch (error) {
        toast.error('Erreur lors du chargement des sessions');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const formatDate = (dateString: string | null | undefined, withTime = true) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(withTime && { hour: '2-digit', minute: '2-digit' })
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getRemainingTime = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) return null;
    const diffMin = Math.round((expiryDate.getTime() - Date.now()) / 60000);
    return diffMin > 0 ? diffMin : 0;
  };

  const getStateConfig = (state: string) => {
    switch (state) {
      case 'ACTIVE':
        return { label: 'Active', bg: 'bg-green-100', text: 'text-green-800', icon: 'bi-play-circle-fill' };
      case 'CREATED':
        return { label: 'Créée', bg: 'bg-blue-100', text: 'text-blue-800', icon: 'bi-plus-circle' };
      case 'EXPIRED':
        return { label: 'Expirée', bg: 'bg-gray-100', text: 'text-gray-600', icon: 'bi-clock-history' };
      case 'TERMINATED':
        return { label: 'Terminée', bg: 'bg-red-100', text: 'text-red-800', icon: 'bi-stop-circle' };
      default:
        return { label: state, bg: 'bg-gray-100', text: 'text-gray-600', icon: 'bi-question-circle' };
    }
  };

  const formatUserId = (userId: string) => userId ? `${userId.substring(0, 6)}...` : '-';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-4 border-amber-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md mb-3">
            <i className="bi bi-clock-history"></i>
            SESSIONS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Historique des sessions</h1>
          <p className="text-gray-500 mt-1 text-sm">Consultez toutes vos connexions passées et actives</p>
        </div>

        {/* Liste des sessions */}
        <div className="space-y-4">
          {sessions.length > 0 ? (
            sessions.map((session) => {
              const remaining = getRemainingTime(session.expires_at);
              const stateConfig = getStateConfig(session.state);
              const isActive = session.state === 'ACTIVE';
              
              return (
                <div
                  key={session.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-amber-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {/* En-tête */}
                  <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <i className="bi bi-wifi text-amber-600 text-sm"></i>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Session #{session.id}</p>
                        <p className="text-xs text-gray-500">{formatDate(session.created_at, false)}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${stateConfig.bg} ${stateConfig.text}`}>
                      <i className={`bi ${stateConfig.icon} text-xs`}></i>
                      {stateConfig.label}
                    </div>
                  </div>

                  {/* Corps */}
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-person text-amber-500 w-4"></i>
                        <span className="text-gray-500">Utilisateur:</span>
                        <span className="text-gray-800 font-mono text-xs truncate" title={session.users_id}>
                          {formatUserId(session.users_id)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="bi bi-router text-amber-500 w-4"></i>
                        <span className="text-gray-500">Routeur:</span>
                        <span className="text-gray-800 font-medium">#{session.router_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="bi bi-tag text-amber-500 w-4"></i>
                        <span className="text-gray-500">Forfait:</span>
                        <span className="text-gray-800">#{session.hotspot_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="bi bi-hash text-amber-500 w-4"></i>
                        <span className="text-gray-500">MAC:</span>
                        <span className="text-gray-800 font-mono text-xs truncate">{session.mac_address}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center pt-2 border-t border-amber-50 text-xs text-gray-500">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <i className="bi bi-calendar-plus"></i>
                          {formatDate(session.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="bi bi-calendar-x"></i>
                          {formatDate(session.expires_at)}
                        </span>
                      </div>
                      {isActive && remaining !== null && remaining > 0 && (
                        <div className="mt-2 sm:mt-0 flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full text-amber-700">
                          <i className="bi bi-hourglass-split animate-pulse"></i>
                          <span className="font-medium">{remaining} min restantes</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
                <i className="bi bi-clock-history text-4xl text-amber-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Aucune session</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Les sessions apparaîtront ici lorsque des clients se connecteront à vos hotspots
              </p>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-gray-400 text-xs">
          <i className="bi bi-c-circle me-1"></i>
          2026 MbeejFepal. Tous droits réservés.
        </div>
      </div>
    </Layout>
  );
}