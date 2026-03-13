'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    if (isAuthenticated()) {
      // Rediriger vers le tableau de bord
      router.push('/dashboard');
    } else {
      // Rediriger vers la page de connexion
      router.push('/login');
    }
  }, [router]);

  // Afficher un loader pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-black to-gray-800 rounded-2xl mb-4 shadow-xl animate-float">
          <span className="text-4xl text-amber-500">📡</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">MbeejFepal</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  );
}