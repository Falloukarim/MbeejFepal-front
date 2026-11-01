'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/lib/api';
import { useSubscription } from '@/app/context/SubscriptionContext';
import toast from 'react-hot-toast';
import { LogOut, Crown, Shield, Settings, ChevronDown, LayoutGrid, ChevronRight } from 'lucide-react';
import { primaryNav, isActivePath, pageTitle, BrandMark } from './navigation';

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSubscription();
  const [menuOpen, setMenuOpen] = useState(false);

  // Ferme le menu du profil à chaque changement de page
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Échap ferme le menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Déconnexion réussie');
    router.push('/login');
  };

  const u = user as any;
  const displayName: string = u?.name || u?.full_name || u?.email || 'Mon compte';
  const email: string = u?.email || '';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M';
  const isAdminUser = u?.role === 'ADMIN';

  const level = status?.subscription?.plan?.level;
  const planLabel = level === 'level2' ? 'Gold' : level === 'level1' ? 'Premium' : null;
  const hasActivePlan = !!status?.active && !!planLabel;
  const noPlan = !!status && !status.active;

  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0a]/75 backdrop-blur-xl border-b border-white/10 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16 max-w-7xl mx-auto">
        {/* Marque + titre de page */}
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0 shrink-0 active:opacity-80">
          <span className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <BrandMark />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent leading-none">
              MbeejFepal
            </span>
            <span className="block text-base font-extrabold text-white leading-tight truncate lg:hidden">{pageTitle(pathname)}</span>
            <span className="hidden lg:block text-xs text-gray-400 leading-tight mt-0.5">Plateforme de gestion</span>
          </span>
        </Link>

        {/* Navigation principale (ordinateur) */}
        <nav className="hidden lg:flex items-center gap-1 mx-auto bg-white/5 border border-white/10 rounded-2xl p-1">
          {primaryNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  active ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 lg:hidden" />

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pastille d'abonnement */}
          {hasActivePlan && (
            <Link
              href="/subscription"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all active:scale-95 ${
                level === 'level2'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-white/5 text-gray-200 border-white/15'
              }`}
            >
              {level === 'level2' ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              {planLabel}
            </Link>
          )}
          {noPlan && (
            <Link
              href="/subscription"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-500 text-black active:scale-95 transition-all"
            >
              <Crown className="w-3.5 h-3.5" /> S'abonner
            </Link>
          )}

          {/* Menu « Plus » (outils secondaires) */}
          <button
            onClick={onMenuClick}
            aria-label="Plus d'outils"
            className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white transition-all active:scale-95"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          {/* Profil */}
          <div className="relative">
            <button
              data-logout
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menu du profil"
              className="flex items-center gap-1.5 pl-1 pr-2 h-10 rounded-full bg-white/5 border border-white/10 transition-all active:scale-95"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-sm font-extrabold">
                {initial}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <>
                <div data-logout className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div
                  role="menu"
                  className="hd-pop absolute right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-3xl bg-[#111827] border border-white/10 shadow-2xl overflow-hidden"
                >
                  {/* Carte profil */}
                  <div className="p-4 flex items-center gap-3 border-b border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent">
                    <span className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-lg font-extrabold">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{displayName}</p>
                      {email && email !== displayName && <p className="text-xs text-gray-400 truncate">{email}</p>}
                      <div className="flex gap-1.5 mt-1">
                        {isAdminUser && (
                          <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">ADMIN</span>
                        )}
                        {planLabel && (
                          <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            {planLabel.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/subscription"
                      role="menuitem"
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl text-gray-200 hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Crown className="w-5 h-5" /></span>
                      <span className="flex-1 text-sm font-semibold">Abonnement</span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </Link>
                    <Link
                      href="/settings"
                      role="menuitem"
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl text-gray-200 hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-xl bg-white/5 text-gray-300 flex items-center justify-center"><Settings className="w-5 h-5" /></span>
                      <span className="flex-1 text-sm font-semibold">Paramètres</span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </Link>
                  </div>

                  <div className="p-2 border-t border-white/10">
                    <button
                      data-logout
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 active:bg-red-500/15 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center"><LogOut className="w-5 h-5" /></span>
                      <span className="text-sm font-bold">Se déconnecter</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hd-pop { from { opacity: 0; transform: translateY(-8px) scale(.97); } to { opacity: 1; transform: none; } }
        .hd-pop { animation: hd-pop .2s cubic-bezier(.2,.8,.2,1) both; transform-origin: top right; }
      `}</style>
    </header>
  );
}