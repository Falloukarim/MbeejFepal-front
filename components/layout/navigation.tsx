import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BarChart3,
  Router as RouterIcon,
  Wallet as WalletIcon,
  Network,
  Clock,
  Users,
  Landmark,
  CreditCard,
  Activity,
} from 'lucide-react';

export interface NavItem {
  name: string;   // libellé complet
  short: string;  // libellé court (barre du bas)
  href: string;
  icon: LucideIcon;
}

// ───────── Navigation principale : en-tête (ordinateur) + barre du bas (mobile) ─────────
export const primaryNav: NavItem[] = [
  { name: 'Tableau de bord', short: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Routeurs', short: 'Routeurs', href: '/routers', icon: RouterIcon },
  { name: 'Portefeuille', short: 'Wallet', href: '/wallet', icon: WalletIcon },
  { name: 'Sessions', short: 'Sessions', href: '/sessions', icon: Clock },
];

// ───────── Outils secondaires : tiroir « Plus » ─────────
export const secondaryNav: NavItem[] = [
  { name: 'Statistiques', short: 'Stats', href: '/statistics', icon: BarChart3 },
  { name: 'Clients PPPoE', short: 'PPPoE', href: '/pppoe', icon: Network },
];

// ───────── Administration (rôle ADMIN) : tiroir « Plus » ─────────
export const adminNav: NavItem[] = [
  { name: 'Utilisateurs', short: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Wallets', short: 'Wallets', href: '/admin/wallets', icon: Landmark },
  { name: 'Paiements', short: 'Paiements', href: '/admin/payments', icon: CreditCard },
  { name: 'Monitoring', short: 'Monitoring', href: '/monitoring', icon: Activity },
];

// Pages accessibles depuis le menu du profil (en-tête)
const extraTitles: { href: string; name: string }[] = [
  { href: '/subscription', name: 'Abonnement' },
  { href: '/settings', name: 'Paramètres' },
];

export const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + '/');

// Titre de la page courante (correspondance la plus précise)
export const pageTitle = (pathname: string) => {
  const all = [
    ...primaryNav.map((n) => ({ href: n.href, name: n.name })),
    ...secondaryNav.map((n) => ({ href: n.href, name: n.name })),
    ...adminNav.map((n) => ({ href: n.href, name: n.name })),
    ...extraTitles,
  ];
  const match = all
    .filter((n) => isActivePath(pathname, n.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.name ?? 'MbeejFepal';
};

// Logo de la marque
export function BrandMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round" />
      <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7" />
      <path d="M8 16.5L12 12.5L16 16.5" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}