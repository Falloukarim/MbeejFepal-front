'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { User } from '@/lib/api';
import { X, ChevronRight, LogOut } from 'lucide-react';
import { secondaryNav, adminNav, isActivePath, BrandMark, type NavItem } from './navigation';

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

// Tiroir « Plus » : feuille qui monte du bas sur mobile, panneau latéral sur ordinateur.
// Il ne contient plus que les outils secondaires ; la navigation principale
// est dans l'en-tête (ordinateur) et la barre du bas (mobile).
export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Déconnexion réussie');
    router.push('/login');
  };

  const u = user as any;
  const displayName: string = u?.name || u?.full_name || u?.email || 'Mon compte';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M';
  const isAdminUser = user?.role === 'ADMIN';

  const renderItem = (item: NavItem) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all active:scale-[0.98] ${
          active ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-200 hover:bg-white/5'
        }`}
      >
        <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${active ? 'bg-black/15' : 'bg-white/5 text-amber-500'}`}>
          <Icon className="w-5 h-5" />
        </span>
        <span className="flex-1 text-sm font-bold">{item.name}</span>
        <ChevronRight className={`w-4 h-4 ${active ? 'text-black/60' : 'text-gray-600'}`} />
      </Link>
    );
  };

  return (
    <>
      <style>{`
        @keyframes sb-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sb-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
        @keyframes sb-left { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }
        .sb-fade { animation: sb-fade .2s ease both; }
        .sb-panel { animation: sb-up .35s cubic-bezier(.2,.8,.2,1) both; }
        @media (min-width: 1024px) { .sb-panel { animation-name: sb-left; } }
      `}</style>

      {/* Fond (reste cliquable même quand la navigation est verrouillée) */}
      <div data-logout className="sb-fade fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <aside
        role="dialog"
        aria-label="Plus d'outils"
        className="sb-panel fixed z-50 bottom-0 inset-x-0 max-h-[88dvh] lg:max-h-none lg:inset-y-0 lg:left-auto lg:right-0 lg:bottom-auto lg:w-96
          flex flex-col bg-[#0f172a] border border-white/10 shadow-2xl
          rounded-t-[28px] lg:rounded-t-none lg:rounded-l-[28px] overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_100%_0%,rgba(217,119,6,0.12)_0%,transparent_55%)]" />

        <div className="relative flex flex-col min-h-0 flex-1 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15 lg:hidden" />

          {/* En-tête du tiroir */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <BrandMark />
              </span>
              <div>
                <p className="text-lg font-extrabold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent leading-tight">MbeejFepal</p>
                <p className="text-xs text-gray-400 leading-tight">Plus d'outils</p>
              </div>
            </div>
            <button
              data-logout
              onClick={onClose}
              aria-label="Fermer"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Liens */}
          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            <h3 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">Outils</h3>
            <div className="space-y-1.5">{secondaryNav.map(renderItem)}</div>

            {isAdminUser && (
              <>
                <h3 className="px-1 mt-5 mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">Administration</h3>
                <div className="space-y-1.5">{adminNav.map(renderItem)}</div>
              </>
            )}
          </div>

          {/* Pied : profil + déconnexion */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-extrabold">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-500">{isAdminUser ? 'Administrateur' : 'Compte'}</p>
              </div>
              <button
                data-logout
                onClick={handleLogout}
                aria-label="Se déconnecter"
                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/15 text-red-400 active:scale-95 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-4 text-center text-[11px] text-gray-600">© 2026 MbeejFepal</p>
          </div>
        </div>
      </aside>
    </>
  );
}