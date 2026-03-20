'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Router {
  id: number;
  name: string;
  admin_active: boolean;
  last_seen: string | null;
  connection_status: 'online' | 'offline' | 'never_connected';
  status_display: string;
}

interface OfflineRoutersCardProps {
  routers: Router[];
}

export default function OfflineRoutersCard({ routers }: OfflineRoutersCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Routeurs hors ligne (qui se sont déjà connectés mais sont maintenant offline)
  const offlineRouters = routers.filter(
    r => r.last_seen !== null && r.connection_status === 'offline'
  );

  // Routeurs qui ne se sont jamais connectés
  const neverConnectedRouters = routers.filter(
    r => r.connection_status === 'never_connected'
  );

  // Afficher la carte s'il y a des routeurs hors ligne OU jamais connectés
  if (offlineRouters.length === 0 && neverConnectedRouters.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-xl border border-orange-200 overflow-hidden mb-8">
      {/* En-tête avec compteur combiné */}
      <div 
        className="px-6 py-4 border-b border-orange-200 bg-gradient-to-r from-orange-100 to-amber-100 cursor-pointer hover:from-orange-200 hover:to-amber-200 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h2 className="text-xl font-semibold text-orange-900">
                Routeurs inactifs ({offlineRouters.length + neverConnectedRouters.length})
              </h2>
              <p className="text-sm text-orange-700 mt-1">
                {offlineRouters.length > 0 && `${offlineRouters.length} hors ligne`}
                {offlineRouters.length > 0 && neverConnectedRouters.length > 0 && ' • '}
                {neverConnectedRouters.length > 0 && `${neverConnectedRouters.length} jamais connectés`}
              </p>
            </div>
          </div>
          <button className="text-orange-700 hover:text-orange-900">
            <svg
              className={`w-6 h-6 transform transition-transform duration-300 ${
                expanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Détails dépliants */}
      {expanded && (
        <div className="p-6">
          <div className="space-y-6">
            {/* Routeurs hors ligne */}
            {offlineRouters.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📡</span>
                  Routeurs hors ligne ({offlineRouters.length})
                </h3>
                <div className="bg-white/60 rounded-xl p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-orange-700 uppercase">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-orange-700 uppercase">Nom</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-orange-700 uppercase">Dernière vue</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-orange-700 uppercase">Hors ligne depuis</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-orange-700 uppercase">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-100">
                        {offlineRouters.map((router) => {
                          const lastSeen = router.last_seen ? new Date(router.last_seen) : null;
                          const offlineSince = lastSeen 
                            ? format(lastSeen, 'dd/MM/yyyy HH:mm', { locale: fr })
                            : 'N/A';
                          const offlineDuration = lastSeen
                            ? Math.round((Date.now() - lastSeen.getTime()) / 60000)
                            : 0;

                          return (
                            <tr key={router.id} className="hover:bg-orange-50/50">
                              <td className="px-4 py-3 font-medium">#{router.id}</td>
                              <td className="px-4 py-3 font-semibold text-orange-900">{router.name}</td>
                              <td className="px-4 py-3">{offlineSince}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                  {offlineDuration} minutes
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                  Hors ligne
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Routeurs jamais connectés */}
            {neverConnectedRouters.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <span className="text-xl">🆕</span>
                  Routeurs jamais connectés ({neverConnectedRouters.length})
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Nom</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Statut</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {neverConnectedRouters.map((router) => (
                          <tr key={router.id} className="hover:bg-gray-100">
                            <td className="px-4 py-3">#{router.id}</td>
                            <td className="px-4 py-3 font-medium">{router.name}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                Jamais connecté
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button 
                                onClick={() => {
                                  // Action pour afficher les instructions de configuration
                                  navigator.clipboard.writeText(`/ip hotspot user add name=test password=test`);
                                  toast.success('Commande copiée !');
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Voir config →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}