'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/api';

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { 
      name: 'Tableau de bord', 
      href: '/dashboard', 
      icon: (isActive: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    { 
      name: 'Statistiques', 
      href: '/statistics', 
      icon: (isActive: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" strokeLinecap="round"/>
          <path d="M18 17V9" strokeLinecap="round"/>
          <path d="M12 17V5" strokeLinecap="round"/>
          <path d="M6 17v-3" strokeLinecap="round"/>
        </svg>
      )
    },
    { 
      name: 'Routeurs', 
      href: '/routers', 
      icon: (isActive: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="2" />
          <path d="M12 6a6 6 0 0 1 6 6" strokeLinecap="round" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          <path d="M6 12a6 6 0 0 1 6-6" strokeLinecap="round" />
          <path d="M2 12a10 10 0 0 1 10-10" strokeLinecap="round" />
        </svg>
      )
    },
    { 
      name: 'Portefeuille', 
      href: '/wallet', 
      icon: (isActive: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <circle cx="12" cy="15" r="1" fill="currentColor" />
        </svg>
      )
    },
    { 
      name: 'Abonnement', 
      href: '/subscription', 
      icon: (isActive: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    },
    { 
      name: 'Paramètres', 
      href: '/settings', 
      icon: (isActive: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      )
    },
    { 
      name: 'Sessions', 
      href: '/sessions', 
      icon: (isActive: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    ...(user?.role === 'ADMIN' ? [
      { 
        name: 'Utilisateurs', 
        href: '/admin/users', 
        icon: (isActive: boolean) => (
          <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )
      },
      { 
        name: 'Wallets', 
        href: '/admin/wallets', 
        icon: (isActive: boolean) => (
          <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
            <circle cx="16" cy="12" r="2" />
          </svg>
        )
      },
      { 
        name: 'Paiements', 
        href: '/admin/payments', 
        icon: (isActive: boolean) => (
          <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
            <circle cx="18" cy="15" r="1" fill="currentColor" />
          </svg>
        )
      },
      { 
        name: 'Monitoring', 
        href: '/monitoring', 
        icon: (isActive: boolean) => (
          <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 20L15 15M4 4L9 9M12 4L12 20M4 12L20 12M9 9L4 4M15 15L20 20" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="5" cy="5" r="2" />
            <circle cx="19" cy="19" r="2" />
          </svg>
        )
      },
    ] : []),
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 bg-[#0f172a] text-white shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 border-r border-white/10
        `}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(217,119,6,0.1)_0%,transparent_50%)]"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col">
          {/* En-tête */}
          <div className="relative overflow-hidden border-b border-white/10 p-6">
            <div className="relative flex items-center gap-4">
              <div className="relative w-12 h-12 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                <svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round"/>
                  <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7"/>
                  <path d="M8 16.5L12 12.5L16 16.5" strokeLinecap="round" strokeWidth="2"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  MbeejFepal
                </h1>
                <p className="text-xs text-gray-400">Plateforme de gestion</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200 group relative overflow-hidden
                      ${isActive 
                        ? 'bg-[#d97706] text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }
                    `}
                    onClick={onClose}
                  >
                    <span className="relative z-10">
                      {item.icon(isActive)}
                    </span>
                    <span className="text-sm font-medium flex-1 relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer Sidebar */}
          <div className="relative border-t border-white/10 p-6">
            <p className="text-xs text-center text-gray-500">© 2026 MbeejFepal</p>
          </div>
        </div>
      </div>
    </>
  );
}