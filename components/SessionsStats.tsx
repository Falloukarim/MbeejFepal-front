'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface ActiveSession {
  id: number;
  router_id: number;
  router_name: string;
  profile: string;
  mac: string;
  created_at: string;
  expires_at: string;
  remaining: number;
}

interface SessionsTableProps {
  sessions: ActiveSession[];
  onRefresh?: () => void;
  loading?: boolean;
}

export default function SessionsTable({ sessions, onRefresh, loading = false }: SessionsTableProps) {
  const [sortField, setSortField] = useState<keyof ActiveSession>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof ActiveSession) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Gestion spéciale pour les dates
    if (sortField === 'created_at' || sortField === 'expires_at') {
      aValue = new Date(a[sortField]).getTime();
      bValue = new Date(b[sortField]).getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getRemainingTimeColor = (minutes: number) => {
    if (minutes < 5) return 'bg-red-100 text-red-800 border-red-200';
    if (minutes < 15) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const formatRemainingTime = (minutes: number) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h${mins > 0 ? mins : ''}`;
  };

  const SortIcon = ({ field }: { field: keyof ActiveSession }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-400">↕️</span>;
    return sortDirection === 'asc' ? <span className="ml-1 text-amber-600">↑</span> : <span className="ml-1 text-amber-600">↓</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🕒</span>
            Sessions en cours
          </h2>
        </div>
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-500">Chargement des sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* En-tête avec bouton de rafraîchissement */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🕒</span>
          Sessions en cours ({sessions.length})
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-amber-600 hover:text-amber-700 text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
            disabled={loading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 14a9 9 0 1 0 2.13-9.36L1 10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Rafraîchir
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-6xl mb-4 opacity-30">😴</div>
          <p className="text-gray-500 text-lg">Aucune session active</p>
          <p className="text-gray-400 text-sm mt-2">Les sessions apparaîtront ici lorsque des clients se connecteront</p>
        </div>
      ) : (
        <>
          {/* Version Desktop - Tableau */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-amber-600"
                    onClick={() => handleSort('id')}
                  >
                    ID <SortIcon field="id" />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-amber-600"
                    onClick={() => handleSort('router_name')}
                  >
                    Routeur <SortIcon field="router_name" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forfait
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MAC
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-amber-600"
                    onClick={() => handleSort('created_at')}
                  >
                    Créée le <SortIcon field="created_at" />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-amber-600"
                    onClick={() => handleSort('expires_at')}
                  >
                    Expire le <SortIcon field="expires_at" />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-amber-600"
                    onClick={() => handleSort('remaining')}
                  >
                    Temps restant <SortIcon field="remaining" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">#{session.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span>{session.router_name}</span>
                        <span className="text-xs text-gray-400">#{session.router_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{session.profile || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {session.mac}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {format(new Date(session.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      {format(new Date(session.expires_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRemainingTimeColor(session.remaining)}`}>
                        {formatRemainingTime(session.remaining)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Version Mobile - Cartes */}
          <div className="lg:hidden divide-y divide-gray-200">
            {sortedSessions.map((session) => (
              <div key={session.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="font-medium">Session #{session.id}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRemainingTimeColor(session.remaining)}`}>
                    {formatRemainingTime(session.remaining)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Routeur</span>
                    <p className="font-medium">{session.router_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Forfait</span>
                    <p>{session.profile || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 text-xs">MAC</span>
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded mt-1">
                      {session.mac}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Créée</span>
                    <p className="text-sm">{format(new Date(session.created_at), 'dd/MM HH:mm')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Expire</span>
                    <p className="text-sm">{format(new Date(session.expires_at), 'dd/MM HH:mm')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pied de tableau avec nombre total */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            Affichage de {sessions.length} session{sessions.length > 1 ? 's' : ''} active{sessions.length > 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
}