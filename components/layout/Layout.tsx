'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getMe, type User } from '@/lib/api';
import { useSubscription } from '@/app/context/SubscriptionContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { status } = useSubscription();
  
  const isPastDue = status?.subscription?.status === 'past_due';
  const expirationDate = status?.subscription?.expires_at 
    ? new Date(status.subscription.expires_at).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })
    : '';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="relative w-20 h-20">
          <svg className="w-16 h-16 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500 animate-[pulse_2s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round"/>
            <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7"/>
            <path d="M8 16.5L12 12.5L16 16.5" strokeLinecap="round" strokeWidth="2"/>
          </svg>
          <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-[ripple_1.5s_linear_infinite]"></div>
          <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-[ripple_1.5s_linear_infinite_0.5s]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a] text-gray-100">
      {/* Effets de fond (Lueur ambrée) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(217,119,6,0.15)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(217,119,6,0.05)_0%,transparent_50%)]" />
      </div>

      <Sidebar 
        user={user} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:ml-72 transition-margin duration-300 relative z-20 flex flex-col min-h-screen">
        
        {/* Bandeau d'alerte abonnement */}
        {isPastDue && (
          <div className="bg-amber-500 text-black px-4 py-3 text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 shadow-lg z-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <span>
                Facture en attente. Accès maintenu jusqu'au <strong>{expirationDate}</strong>.
              </span>
            </div>
            <Link 
              href="/subscription" 
              data-logout
              className="mt-2 sm:mt-0 sm:ml-4 bg-black text-amber-500 px-4 py-1.5 rounded-lg hover:bg-gray-900 transition-colors whitespace-nowrap"
            >
              Payer maintenant
            </Link>
          </div>
        )}

        <Header 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          user={user}
        />

        <main className="p-4 sm:p-8 animate-[fadeIn_0.5s_ease-out] flex-1">
          {children}
        </main>

        <footer className="text-center py-6 text-gray-600 text-xs border-t border-white/5">
          © 2026 MbeejFepal. Tous droits réservés.
        </footer>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1) translate(-50%, -50%); opacity: 1; }
          50% { transform: scale(1.1) translate(-45%, -45%); opacity: 0.9; }
        }
        @keyframes ripple {
          0% { width: 20px; height: 20px; opacity: 0.5; }
          100% { width: 80px; height: 80px; opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}