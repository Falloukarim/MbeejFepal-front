'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

interface RouterStatus {
  id: number;
  name: string;
  is_active: boolean;
  last_seen: string | null;
  active_sessions: number;
  total_sessions: number;
  today_revenue: number;
}

interface RoutersTableProps {
  routers: RouterStatus[];
}

export default function RoutersTable({ routers }: RoutersTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">📡</span>
          État des routeurs
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Routeur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière vue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions actives</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions totales</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenus aujourd'hui</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {routers.map((router) => (
              <tr key={router.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{router.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    router.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {router.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {router.last_seen 
                    ? format(new Date(router.last_seen), 'dd/MM HH:mm')
                    : 'Jamais'}
                </td>
                <td className="px-6 py-4 font-semibold">{router.active_sessions}</td>
                <td className="px-6 py-4">{router.total_sessions}</td>
                <td className="px-6 py-4 font-semibold text-green-600">
                  {formatCurrency(router.today_revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}