'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { primaryNav, secondaryNav, adminNav, isActivePath } from './navigation';

interface BottomNavProps {
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

// Barre d'onglets mobile : 4 pages principales + « Plus »
export default function BottomNav({ onMenuClick, isMenuOpen }: BottomNavProps) {
  const pathname = usePathname();

  // « Plus » est actif quand on est sur une page du tiroir
  const onMorePage = [...secondaryNav, ...adminNav].some((n) => isActivePath(pathname, n.href));

  return (
    <nav
      aria-label="Navigation principale"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a]/85 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 px-2 pt-1.5 pb-1.5 max-w-xl mx-auto">
        {primaryNav.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-2xl active:scale-95 transition-transform"
            >
              {active && <span className="absolute -top-1.5 h-1 w-8 rounded-full bg-amber-500" />}
              <span className={`w-11 h-8 flex items-center justify-center rounded-full transition-all ${active ? 'bg-amber-500/15 text-amber-400' : 'text-gray-500'}`}>
                <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={`text-[10px] font-bold ${active ? 'text-amber-400' : 'text-gray-500'}`}>{item.short}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onMenuClick}
          aria-expanded={isMenuOpen}
          className="relative flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-2xl active:scale-95 transition-transform"
        >
          {(isMenuOpen || onMorePage) && <span className="absolute -top-1.5 h-1 w-8 rounded-full bg-amber-500" />}
          <span className={`w-11 h-8 flex items-center justify-center rounded-full transition-all ${isMenuOpen || onMorePage ? 'bg-amber-500/15 text-amber-400' : 'text-gray-500'}`}>
            <MoreHorizontal className="w-[22px] h-[22px]" />
          </span>
          <span className={`text-[10px] font-bold ${isMenuOpen || onMorePage ? 'text-amber-400' : 'text-gray-500'}`}>Plus</span>
        </button>
      </div>
    </nav>
  );
}