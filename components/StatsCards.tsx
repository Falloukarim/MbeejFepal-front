'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';

interface StatsCardsProps {
  stats: {
    routers: { total: number; active: number };
    users: { total: number };
    sessions: { active: number };
    revenue: { today: number; month: number };
    payments: { failed_today: number };
    wallets: { total_balance: number };
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Routeurs',
      icon: '📡',
      value: `${stats.routers.active} / ${formatNumber(stats.routers.total)}`,
      subtitle: 'actifs / total',
      color: 'amber',
      progress: (stats.routers.active / stats.routers.total) * 100,
    },
    {
      title: 'Utilisateurs',
      icon: '👤',
      value: formatNumber(stats.users.total),
      subtitle: 'inscrits',
      color: 'blue',
    },
    {
      title: 'Sessions en cours',
      icon: '🕒',
      value: formatNumber(stats.sessions.active),
      subtitle: 'actives',
      color: 'green',
    },
    {
      title: "Revenus aujourd'hui",
      icon: '💰',
      value: formatCurrency(stats.revenue.today),
      subtitle: `${formatCurrency(stats.revenue.month)} ce mois`,
      color: 'purple',
    },
    {
      title: 'Paiements échoués',
      icon: '⚠️',
      value: stats.payments.failed_today.toString(),
      subtitle: "aujourd'hui",
      color: 'red',
    },
    {
      title: 'Solde total wallets',
      icon: '💳',
      value: formatCurrency(stats.wallets.total_balance),
      subtitle: 'tous utilisateurs',
      color: 'indigo',
    },
  ];

  const colorClasses = {
    amber: {
      bg: 'from-amber-50 to-amber-100',
      border: 'border-amber-200',
      badge: 'bg-amber-200 text-amber-700',
      progress: 'bg-amber-600',
      progressBg: 'bg-amber-200',
    },
    blue: {
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      badge: 'bg-blue-200 text-blue-700',
      progress: 'bg-blue-600',
      progressBg: 'bg-blue-200',
    },
    green: {
      bg: 'from-green-50 to-green-100',
      border: 'border-green-200',
      badge: 'bg-green-200 text-green-700',
      progress: 'bg-green-600',
      progressBg: 'bg-green-200',
    },
    purple: {
      bg: 'from-purple-50 to-purple-100',
      border: 'border-purple-200',
      badge: 'bg-purple-200 text-purple-700',
      progress: 'bg-purple-600',
      progressBg: 'bg-purple-200',
    },
    red: {
      bg: 'from-red-50 to-red-100',
      border: 'border-red-200',
      badge: 'bg-red-200 text-red-700',
      progress: 'bg-red-600',
      progressBg: 'bg-red-200',
    },
    indigo: {
      bg: 'from-indigo-50 to-indigo-100',
      border: 'border-indigo-200',
      badge: 'bg-indigo-200 text-indigo-700',
      progress: 'bg-indigo-600',
      progressBg: 'bg-indigo-200',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {cards.map((card, index) => {
        const colors = colorClasses[card.color as keyof typeof colorClasses];
        return (
          <div
            key={index}
            className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-6 shadow-lg border ${colors.border}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">{card.icon}</span>
              <span className={`text-xs ${colors.badge} px-2 py-1 rounded-full`}>
                {card.title}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-600 mt-1">{card.subtitle}</p>
            {card.progress !== undefined && (
              <div className="mt-3 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.progress} rounded-full`}
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}