'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '@/lib/api';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Veuillez entrer un email valide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await login(data.email, data.password);
      localStorage.setItem('token', response.token);
      toast.success('Connexion réussie !');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data || 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-4 sm:py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
         style={{
           background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 50%, #fde68a 100%)' // Fond plus jaune
         }}>
      {/* Effets de fond - plus prononcés */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 bottom-0"
             style={{
               background: 'radial-gradient(circle at 0% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.08) 0%, transparent 50%)' // Opacité augmentée
             }} />
        <div className="absolute inset-0"
             style={{
               background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"none\"><path d=\"M0 0 L100 100 M100 0 L0 100\" stroke=\"%23d97706\" stroke-width=\"0.5\" opacity=\"0.05\"/></svg>')", // Orange plus foncé
               backgroundSize: '50px 50px'
             }} />
      </div>

      <div className="w-full max-w-md relative z-10 my-auto">
        {/* Carte principale */}
        <div className="rounded-[32px] shadow-2xl overflow-hidden bg-white/95 backdrop-blur-[20px] border border-[rgba(217,119,6,0.2)] animate-[slideUp_0.8s_cubic-bezier(0.16,1,0.3,1)]"> {/* Bordure plus foncée */}
          
          {/* Header avec jaune plus intense */}
          <div className="bg-gradient-to-r from-black via-gray-900 to-gray-800 p-6 sm:p-8 text-center relative overflow-hidden border-b-3 border-[#d97706]"> {/* Bordure orange foncé */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(217,119,6,0.2)_0%,transparent_50%)]"></div> {/* Orange plus foncé */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(217,119,6,0.08)_0px,rgba(217,119,6,0.08)_1px,transparent_1px,transparent_20px)]"></div> {/* Orange plus foncé */}
            
            {/* Animation Wifi - orange plus intense */}
            <div className="relative w-16 h-16 mx-auto mb-3">
              <i className="bi bi-wifi text-4xl bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] bg-clip-text text-transparent animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_20px_rgba(217,119,6,0.5)]"
                 style={{ WebkitTextFillColor: 'transparent' }}></i>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-2 border-[rgba(217,119,6,0.4)] rounded-full animate-[ripple_2s_linear_infinite]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-2 border-[rgba(217,119,6,0.4)] rounded-full animate-[ripple_2s_linear_infinite_0.5s]"></div>
            </div>

            {/* Badge - orange plus intense */}
            <div className="bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide inline-block mb-2 shadow-md uppercase">
              <i className="bi bi-star-fill mr-1"></i> ADMIN
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">MbeejFepal</h2>
            <p className="text-white/75 text-sm">Connectez-vous à votre espace</p>
          </div>

          {/* Corps de la carte */}
          <div className="p-6 sm:p-8">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Champ Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d97706] focus:border-transparent outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="votre@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-circle-fill text-xs"></i>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Champ Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d97706] focus:border-transparent outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-circle-fill text-xs"></i>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Bouton de connexion - orange plus intense */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white font-semibold py-2.5 px-6 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mt-2"
              >
                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Connexion...
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Se connecter
                    <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
                  </span>
                )}
              </button>
            </form>

            {/* Lien d'inscription */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link 
                  href="/register" 
                  className="text-[#d97706] hover:text-[#b45309] font-medium transition-colors inline-flex items-center gap-1 group"
                >
                  Créer un compte
                  <i className="bi bi-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                </Link>
              </p>
            </div>

            {/* Badges de sécurité - orange plus intense */}
            <div className="mt-4 pt-4 border-t-2 border-[rgba(217,119,6,0.3)]">
              <div className="flex flex-wrap justify-center gap-2">
                <span className="flex items-center gap-1 text-gray-600 text-xs px-2 py-1 rounded-lg hover:bg-[rgba(217,119,6,0.1)] hover:text-[#d97706] transition-all">
                  <i className="bi bi-shield-lock-fill text-[#d97706] text-xs"></i>
                  Sécurisé
                </span>
                <span className="flex items-center gap-1 text-gray-600 text-xs px-2 py-1 rounded-lg hover:bg-[rgba(217,119,6,0.1)] hover:text-[#d97706] transition-all">
                  <i className="bi bi-incognito text-[#d97706] text-xs"></i>
                  Privé
                </span>
                <span className="flex items-center gap-1 text-gray-600 text-xs px-2 py-1 rounded-lg hover:bg-[rgba(217,119,6,0.1)] hover:text-[#d97706] transition-all">
                  <i className="bi bi-headset text-[#d97706] text-xs"></i>
                  Support 24/7
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-3 text-center text-gray-500 text-xs">
          <i className="bi bi-c-circle me-1"></i>
                MbeejFepal
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }

        @keyframes ripple {
          0% { width: 100%; height: 100%; opacity: 0.5; }
          100% { width: 200%; height: 200%; opacity: 0; }
        }

        .border-b-3 {
          border-bottom-width: 3px;
        }
      `}</style>
    </div>
  );
}