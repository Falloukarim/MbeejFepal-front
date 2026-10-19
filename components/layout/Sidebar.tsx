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
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    // ✅ NOUVEAU : Lien Statistiques
    { 
      name: 'Statistiques', 
      href: '/statistics', 
      icon: (isActive: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    },
    { 
      name: 'Paramètres', 
      href: '/settings', 
      icon: (isActive: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      )
    },
    { 
      name: 'Sessions', 
      href: '/sessions', 
      icon: (isActive: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    // ✅ ROUTES ADMIN UNIQUEMENT
    ...(user?.role === 'ADMIN' ? [
      { 
        name: 'Utilisateurs', 
        href: '/admin/users', 
        icon: (isActive: boolean) => (
          <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )
      },
      { 
        name: 'Wallets', 
        href: '/admin/wallets', 
        icon: (isActive: boolean) => (
          <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
            <circle cx="16" cy="12" r="2" />
          </svg>
        )
      },
      { 
        name: 'Paiements', 
        href: '/admin/payments', 
        icon: (isActive: boolean) => (
          <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#d97706] group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 bg-gradient-to-b from-black via-gray-900 to-gray-800
          text-white shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{
          boxShadow: '10px 0 30px rgba(217,119,6,0.15)',
          borderRight: '1px solid rgba(217,119,6,0.2)'
        }}
      >
        {/* Effets de fond */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(217,119,6,0.1)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(217,119,6,0.02)_0px,rgba(217,119,6,0.02)_1px,transparent_1px,transparent_20px)]"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col">
          {/* En-tête */}
          <div className="relative overflow-hidden border-b-3 border-[#d97706] p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(217,119,6,0.2)] to-transparent"></div>
            
            <div className="relative flex items-center gap-4">
              {/* Motif WiFi */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-10 h-10 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round"/>
                  <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7"/>
                  <path d="M8 16.5L12 12.5L16 16.5" strokeLinecap="round" strokeWidth="2"/>
                </svg>
                <div className="absolute inset-0 border border-[rgba(217,119,6,0.3)] rounded-full animate-ping opacity-20"></div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#d97706] to-[#fbbf24] bg-clip-text text-transparent">
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
                        ? 'bg-gradient-to-r from-[#d97706] to-[#b45309] text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-[rgba(217,119,6,0.1)] hover:text-white'
                      }
                    `}
                    onClick={onClose}
                  >
                    {!isActive && (
                      <span className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                    )}
                    
                    <span className="relative z-10">
                      {item.icon(isActive)}
                    </span>
                    
                    <span className="text-sm font-medium flex-1 relative z-10">{item.name}</span>
                    
                    {isActive && (
                      <svg className="w-4 h-4 text-white/70 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Section utilisateur */}
          <div className="relative border-t border-[rgba(217,119,6,0.2)] p-6">
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .border-b-3 {
          border-bottom-width: 3px;
        }
      `}</style>
    </>
  );
}