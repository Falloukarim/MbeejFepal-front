'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register } from '@/lib/api';
import toast from 'react-hot-toast';

// Définir le schéma
const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Veuillez entrer un email valide'),
  phone: z.string().min(9, 'Le numéro de téléphone doit contenir au moins 9 chiffres'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
  isAdmin: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  isAdmin: boolean;
};

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      isAdmin: false,
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.isAdmin ? 'ADMIN' : 'USER',
      });
      toast.success('Compte créé avec succès !');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-4 sm:py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
         style={{
           background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 50%, #fde68a 100%)'
         }}>
      {/* Effets de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 bottom-0"
             style={{
               background: 'radial-gradient(circle at 0% 0%, rgba(217,119,6,0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(217,119,6,0.08) 0%, transparent 50%)'
             }} />
        <div className="absolute inset-0"
             style={{
               background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"none\"><path d=\"M0 0 L100 100 M100 0 L0 100\" stroke=\"%23d97706\" stroke-width=\"0.5\" opacity=\"0.05\"/></svg>')",
               backgroundSize: '50px 50px'
             }} />
      </div>

      <div className="w-full max-w-md relative z-10 my-auto">
        {/* Carte principale */}
        <div className="rounded-[32px] shadow-2xl overflow-hidden bg-white/95 backdrop-blur-[20px] border border-[rgba(217,119,6,0.2)] animate-[slideUp_0.8s_cubic-bezier(0.16,1,0.3,1)]">
          
          {/* Header avec animation WiFi */}
          <div className="bg-gradient-to-r from-black via-gray-900 to-gray-800 p-6 sm:p-8 text-center relative overflow-hidden border-b-3 border-[#d97706]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(217,119,6,0.2)_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(217,119,6,0.08)_0px,rgba(217,119,6,0.08)_1px,transparent_1px,transparent_20px)]"></div>
            
            {/* Animation WiFi */}
            <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <div className="relative z-10">
                <i className="bi bi-wifi text-5xl bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] bg-clip-text text-transparent animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_20px_rgba(217,119,6,0.7)]"
                   style={{ 
                     WebkitTextFillColor: 'transparent',
                     display: 'block',
                     lineHeight: 1
                   }}></i>
              </div>
              
              {/* Vagues WiFi */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-12 h-12 border-2 border-[#d97706] rounded-full opacity-30 animate-[ripple_2s_linear_infinite]"></div>
                <div className="absolute w-16 h-16 border-2 border-[#d97706] rounded-full opacity-20 animate-[ripple_2s_linear_infinite_0.5s]"></div>
                <div className="absolute w-20 h-20 border-2 border-[#d97706] rounded-full opacity-10 animate-[ripple_2s_linear_infinite_1s]"></div>
              </div>
            </div>

            {/* Badge */}
            <div className="bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide inline-block mb-2 shadow-md uppercase">
              <i className="bi bi-star-fill mr-1"></i> INSCRIPTION
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">MbeejFepal</h2>
            <p className="text-white/75 text-sm">Créez votre compte pour commencer</p>
          </div>

          {/* Corps de la carte */}
          <div className="p-6 sm:p-8">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <input
                  {...formRegister('name')}
                  type="text"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d97706] focus:border-transparent outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Jean Dupont"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-circle-fill text-xs"></i>
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...formRegister('email')}
                  type="email"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d97706] focus:border-transparent outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="jean@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-circle-fill text-xs"></i>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  {...formRegister('phone')}
                  type="tel"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d97706] focus:border-transparent outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="77 123 45 67"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-circle-fill text-xs"></i>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  {...formRegister('password')}
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

              {/* Confirmation mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  {...formRegister('confirmPassword')}
                  type="password"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d97706] focus:border-transparent outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-circle-fill text-xs"></i>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#92400e] text-white font-semibold py-2.5 px-6 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mt-2"
              >
                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Création...
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Créer mon compte
                    <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
                  </span>
                )}
              </button>
            </form>

            {/* Lien vers connexion */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link 
                  href="/login" 
                  className="text-[#d97706] hover:text-[#b45309] font-medium transition-colors inline-flex items-center gap-1 group"
                >
                  Se connecter
                  <i className="bi bi-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                </Link>
              </p>
            </div>

            {/* Badges de sécurité */}
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
          2026 MbeejFepal. Tous droits réservés.
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
          0%, 100% { 
            transform: scale(1); 
            opacity: 1;
            filter: drop-shadow(0 0 15px rgba(217,119,6,0.5));
          }
          50% { 
            transform: scale(1.1); 
            opacity: 0.9;
            filter: drop-shadow(0 0 25px rgba(217,119,6,0.8));
          }
        }

        @keyframes ripple {
          0% {
            width: 30px;
            height: 30px;
            opacity: 0.5;
            border-color: #d97706;
          }
          100% {
            width: 80px;
            height: 80px;
            opacity: 0;
            border-color: #d97706;
          }
        }

        .border-b-3 {
          border-bottom-width: 3px;
        }
      `}</style>
    </div>
  );
}