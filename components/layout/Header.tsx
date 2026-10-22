'use client';

import { User } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Déconnexion réussie');
    router.push('/login');
  };

  return (
    <header className="bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        
        {/* Bouton menu mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50
            w-8 h-20 bg-[#d97706] text-white rounded-r-xl shadow-2xl
            flex items-center justify-center
            transition-all duration-300 hover:w-10"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18L9 12L15 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="lg:hidden w-8" />
        <div className="flex-1 lg:flex-none" />
        
        {/* Actions utilisateur */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">

          </div>

          <button
  data-logout                          // ✅ AJOUTE CETTE LIGNE
  onClick={handleLogout}
  className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
>
  <LogOut className="w-5 h-5" />
</button>
        </div>
      </div>
    </header>
  );
}