'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Wifi, Shield, Lock, Mail, KeyRound, ArrowRight, Star, Headphones, User, Phone } from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  },);

  const {
    register: formRegister,
    handleSubmit,
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center py-2 px-3 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(200,200,210,0.3)_0%,_transparent_60%),_radial-gradient(ellipse_at_bottom_left,_rgba(180,180,200,0.3)_0%,_transparent_60%)]" />
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cccccc' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-4xl relative z-10 my-auto">
        {/* Carte principale - Deux colonnes plus petite */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl shadow-2xl overflow-hidden bg-white/95 backdrop-blur-lg border border-amber-300/30 grid grid-cols-1 md:grid-cols-2"
        >
          {/* Colonne gauche - Branding plus compact */}
          <div className="relative bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 p-5 text-center md:text-left flex flex-col justify-between min-h-[450px]">
            {/* Effets de lumière */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,180,100,0.25)_0%,_transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,_rgba(255,160,80,0.25)_0%,_transparent_70%)]" />
            
            {/* Badge Premium */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-3 right-3 bg-gradient-to-r from-amber-700 to-amber-800 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1"
            >
              <Star className="w-2.5 h-2.5 fill-current" />
              HOTSPOT
            </motion.div>

            {/* Logo WiFi plus petit */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative w-16 h-16 mx-auto md:mx-0 mb-3 mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full opacity-30 animate-pulse" />
              <div className="absolute inset-1.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-full flex items-center justify-center shadow-2xl border-2 border-amber-400/50">
                <Wifi className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <motion.div
                animate={{ scale: [1, 1.6, 2.2], opacity: [0.5, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 border-2 border-amber-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 2.2, 2.8], opacity: [0.4, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 border-2 border-amber-600 rounded-full"
              />
            </motion.div>

            {/* Texte de branding plus compact */}
            <div className="relative z-10">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-1 tracking-tight"
              >
                MbeejFepal
              </motion.h1>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg font-bold text-amber-300 mb-2"
              >
            
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/80 text-xs leading-relaxed"
              >
                Rejoignez la communauté pour profiter de nos services 
              </motion.p>
            </div>

            {/* Points forts plus compacts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2 mt-4 mb-4"
            >
              {[
                { icon: Shield, text: 'Connexion sécurisée' },
                { icon: Lock, text: 'Données chiffrées' },
                { icon: Headphones, text: 'Support 24/7' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-white/90">
                  <div className="bg-amber-700/50 p-1.5 rounded-lg">
                    <item.icon className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <span className="text-xs">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Colonne droite - Formulaire plus compact */}
          <div className="p-5 bg-white/95 backdrop-blur-lg overflow-y-auto max-h-[450px]">
            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
              {/* Nom */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Nom complet
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-amber-600" />
                  </div>
                  <input
                    {...formRegister('name')}
                    type="text"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-700 focus:border-transparent outline-none transition-all duration-200 bg-white text-sm"
                    placeholder="mbacké balla"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {errors.name.message}
                  </p>
                )}
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-amber-600" />
                  </div>
                  <input
                    {...formRegister('email')}
                    type="email"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-700 focus:border-transparent outline-none transition-all duration-200 bg-white text-sm"
                    placeholder="abdoulkarim@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {errors.email.message}
                  </p>
                )}
              </motion.div>

              {/* Téléphone */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-amber-600" />
                  </div>
                  <input
                    {...formRegister('phone')}
                    type="tel"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-700 focus:border-transparent outline-none transition-all duration-200 bg-white text-sm"
                    placeholder="77 123 45 67"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {errors.phone.message}
                  </p>
                )}
              </motion.div>

              {/* Mot de passe */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-amber-600" />
                  </div>
                  <input
                    {...formRegister('password')}
                    type="password"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-700 focus:border-transparent outline-none transition-all duration-200 bg-white text-sm"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {errors.password.message}
                  </p>
                )}
              </motion.div>

              {/* Confirmation mot de passe */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-amber-600" />
                  </div>
                  <input
                    {...formRegister('confirmPassword')}
                    type="password"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-700 focus:border-transparent outline-none transition-all duration-200 bg-white text-sm"
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </motion.div>

              {/* Bouton de soumission */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white font-bold py-2.5 px-4 rounded-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group text-sm mt-1"
                >
                  <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Création...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </motion.div>

              {/* Lien vers connexion */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center"
              >
                <p className="text-xs text-amber-700">
                  Déjà un compte ?{' '}
                  <Link 
                    href="/login" 
                    className="text-amber-600 hover:text-amber-800 font-bold inline-flex items-center gap-1 group transition-colors"
                  >
                    Se connecter
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
              </motion.div>
            </form>

            {/* Badges de sécurité */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-3 pt-3 border-t border-amber-200"
            >
              <div className="grid grid-cols-3 gap-1">
                {[
                  { icon: Shield, text: 'Sécurisé', color: 'text-amber-700' },
                  { icon: Lock, text: 'Chiffré', color: 'text-amber-800' },
                  { icon: Headphones, text: 'Support', color: 'text-amber-900' }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-amber-100 transition-all cursor-default"
                  >
                    <item.icon className={`w-3 h-3 ${item.color}`} />
                    <span className="text-[9px] text-amber-900 font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-2 text-center text-gray-500 text-[10px] font-medium"
        >
          © 2026 MbeejFepal. Tous droits réservés.
        </motion.div>
      </div>
    </div>
  );
}