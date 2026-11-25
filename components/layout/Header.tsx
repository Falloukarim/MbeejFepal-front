'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/lib/api';
import { useSubscription } from '@/app/context/SubscriptionContext';
import toast from 'react-hot-toast';
import { LogOut, Crown, Shield, Settings, ChevronDown, LayoutGrid, ChevronRight } from 'lucide-react';
import { primaryNav, isActivePath, pageTitle, BrandMark } from './navigation';

/* ─── AJOUT ─────────────────────────────────────────────────────────── */
const WHATSAPP_GROUP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ?? 'https://chat.whatsapp.com/REMPLACER_ICI';

// Icône WhatsApp officielle (lucide-react n'en a pas)
function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
/* ───────────────────────────────────────────────────────────────────── */

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSubscription();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
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

        <nav className="hidden lg:flex items-center gap-1 mx-auto bg-white/5 border border-white/10 rounded-2xl p-1">
          {primaryNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
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

        <div className="flex items-center gap-2 shrink-0">
          {hasActivePlan && (
            <Link href="/subscription"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all active:scale-95 ${
                level === 'level2' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-white/5 text-gray-200 border-white/15'
              }`}
            >
              {level === 'level2' ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              {planLabel}
            </Link>
          )}
          {noPlan && (
            <Link href="/subscription"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-500 text-black active:scale-95 transition-all"
            >
              <Crown className="w-3.5 h-3.5" /> S'abonner
            </Link>
          )}

          {/* ─── AJOUT : bouton WhatsApp (desktop) ─── */}
          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Rejoindre le groupe WhatsApp"
            className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300 transition-all active:scale-95"
          >
            <WhatsAppIcon className="w-5 h-5" />
          </a>
          {/* ─────────────────────────────────────── */}

          <button
            onClick={onMenuClick}
            aria-label="Plus d'outils"
            className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white transition-all active:scale-95"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

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
                    <Link href="/subscription" role="menuitem"
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl text-gray-200 hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Crown className="w-5 h-5" /></span>
                      <span className="flex-1 text-sm font-semibold">Abonnement</span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </Link>
                    <Link href="/settings" role="menuitem"
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl text-gray-200 hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-xl bg-white/5 text-gray-300 flex items-center justify-center"><Settings className="w-5 h-5" /></span>
                      <span className="flex-1 text-sm font-semibold">Paramètres</span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </Link>

                    {/* ─── AJOUT : item WhatsApp (mobile + desktop) ─── */}
                    <a
                      href={WHATSAPP_GROUP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl text-gray-200 hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <WhatsAppIcon className="w-5 h-5" />
                      </span>
                      <span className="flex-1 text-sm font-semibold">Groupe WhatsApp</span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </a>
                    {/* ─────────────────────────────────────────────── */}
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