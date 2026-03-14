'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated()) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, 100); // Petit délai pour fluidité

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fond avec dégradé - inspiré du template */}
      <div className="fixed inset-0 pointer-events-none z-0"
           style={{
             background: 'linear-gradient(135deg, #ffffff 0%, #fff7e6 50%, #ffedd5 100%)'
           }}>
        <div className="absolute inset-0"
             style={{
               background: 'radial-gradient(circle at 0% 0%, rgba(245,158,11,0.03) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(245,158,11,0.03) 0%, transparent 50%)'
             }} />
      </div>

      {/* Spinner centré élégant */}
      <div className="relative z-10 text-center">
        {/* Logo avec effet de glow */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-2xl blur-xl opacity-30 animate-pulse"></div>
          <div className="relative w-full h-full bg-gradient-to-r from-black to-gray-800 rounded-2xl flex items-center justify-center shadow-2xl border border-[rgba(245,158,11,0.3)]">
            <svg className="w-10 h-10 text-[#f59e0b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="20" r="1" fill="#f59e0b" stroke="none"/>
            </svg>
          </div>
        </div>

        {/* Spinner animé */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-[rgba(245,158,11,0.1)] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-[#f59e0b] border-r-[#d97706] rounded-full animate-spin"></div>
        </div>

        {/* Message de redirection */}
        <p className="text-gray-600 text-sm tracking-wide animate-pulse">
          Redirection en cours...
        </p>

        {/* Petit texte élégant */}
        <p className="text-gray-400 text-xs mt-8">
          MbeejFepal • Connexion sécurisée
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}