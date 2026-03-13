'use client';

import { User } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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
    <header className="bg-white/80 backdrop-blur-[20px] border-b border-[rgba(217,119,6,0.2)] sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Bouton menu mobile - flèche centrée à gauche */}
        <button
          onClick={onMenuClick}
          className="lg:hidden fixed left-2 top-1/2 -translate-y-1/2 z-50
            w-8 h-20 bg-gradient-to-r from-[#d97706] to-[#b45309]
            text-white rounded-r-xl shadow-lg
            flex items-center justify-center
            transition-all duration-300 hover:w-10
            border-l border-white/10"
          style={{ 
            boxShadow: '0 4px 20px rgba(217,119,6,0.3)',
          }}
          aria-label="Menu"
        >
          <svg 
            className="w-5 h-5" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
          >
            <path d="M15 18L9 12L15 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Espace pour compenser le bouton fixe */}
        <div className="lg:hidden w-8" />
        
        {/* Titre de page (optionnel - peut être dynamique) */}
        <div className="flex-1 lg:flex-none" />
        
        {/* Actions utilisateur */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Version mobile simplifiée */}
          <div className="sm:hidden flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-r from-[#d97706] to-[#b45309] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Bouton déconnexion */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[rgba(217,119,6,0.1)] text-[#d97706] rounded-xl hover:bg-[#d97706] hover:text-white transition-all duration-300 group"
            title="Déconnexion"
          >
            <svg className="w-4 sm:w-5 h-4 sm:h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round"/>
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
            </svg>
            <span className="hidden sm:inline text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}