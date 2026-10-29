'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as apiRegister } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Wifi, Shield, Lock, Mail, KeyRound, ArrowRight, Star, Headphones, User, Phone } from 'lucide-react';

// ✅ isAdmin supprimé : tous les inscrits sont USER
const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Veuillez entrer un email valide'),
  phone: z.string().min(9, 'Le numéro de téléphone doit contenir au moins 9 chiffres'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
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
};

// Champs sombres (color-scheme dark évite le fond blanc natif du navigateur)
const inputClass =
  'w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm [color-scheme:dark]';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // ✅ Plus de role : le backend force USER
      await apiRegister({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      toast.success('Compte créé avec succès !');
      router.push('/login');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          'Erreur lors de la création du compte'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center py-2 px-3 relative overflow-hidden bg-[#0a0a0a]">
      {/* Image de fond */}
      <Image
        src="/videos/wifi-zone-poster.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Voile sombre + lueur ambrée */}
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(217,119,6,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(217,119,6,0.12)_0%,transparent_50%)]" />

      <div className="w-full max-w-md md:max-w-2xl relative z-10 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10"
        >
          {/* Header — compact sur ordinateur */}
          <div className="relative p-6 md:py-4 md:px-8 text-center md:text-left overflow-hidden border-b border-white/10 md:flex md:items-center md:gap-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-3 right-3 bg-white/10 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 border border-white/5"
            >
              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              HOTSPOT
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative w-16 h-16 md:w-12 md:h-12 mx-auto md:mx-0 mb-3 md:mb-0 shrink-0"
            >
              <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-pulse" />
              <div className="absolute inset-1.5 md:inset-1 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center shadow-2xl">
                <Wifi className="w-8 h-8 md:w-6 md:h-6 text-white" strokeWidth={2.5} />
              </div>
            </motion.div>

            <div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-0.5 tracking-tight"
              >
                MbeejFepal
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 text-xs font-medium"
              >
                Créez votre compte pour commencer
              </motion.p>
            </div>
          </div>

          {/* Form — dark theme */}
          <div className="p-6 md:px-8 md:py-5">
            <form className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-4 md:gap-y-3" onSubmit={handleSubmit(onSubmit)}>
              {/* Nom */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nom complet</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-amber-500" />
                  </div>
                  <input
                    {...formRegister('name')}
                    type="text"
                    className={inputClass}
                    placeholder="Mbacké Balla"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {errors.name.message}
                  </p>
                )}
              </motion.div>

              {/* Téléphone */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-xs font-semibold text-gray-300 mb-1">Téléphone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-amber-500" />
                  </div>
                  <input
                    {...formRegister('phone')}
                    type="tel"
                    className={inputClass}
                    placeholder="77 123 45 67"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {errors.phone.message}
                  </p>
                )}
              </motion.div>

              {/* Email */}
              <motion.div
                className="md:col-span-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-xs font-semibold text-gray-300 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-amber-500" />
                  </div>
                  <input
                    {...formRegister('email')}
                    type="email"
                    className={inputClass}
                    placeholder="exemple@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {errors.email.message}
                  </p>
                )}
              </motion.div>

              {/* Mot de passe */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-xs font-semibold text-gray-300 mb-1">Mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-amber-500" />
                  </div>
                  <input
                    {...formRegister('password')}
                    type="password"
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {errors.password.message}
                  </p>
                )}
              </motion.div>

              {/* Confirmation */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-amber-500" />
                  </div>
                  <input
                    {...formRegister('confirmPassword')}
                    type="password"
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {errors.confirmPassword.message}
                  </p>
                )}
              </motion.div>

              {/* Bouton */}
              <motion.div
                className="md:col-span-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#d97706] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#b45309] transition-all shadow-lg disabled:opacity-50 flex justify-center mt-2 md:mt-1"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Création...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Créer mon compte <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </motion.div>

              {/* Lien vers login */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center pt-2 md:pt-0 md:col-span-2"
              >
                <p className="text-xs text-gray-400">
                  Déjà un compte ?{' '}
                  <Link
                    href="/login"
                    className="text-amber-500 hover:text-amber-400 font-bold transition-colors"
                  >
                    Se connecter
                  </Link>
                </p>
              </motion.div>
            </form>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 pt-4 md:mt-4 md:pt-3 border-t border-white/10"
            >
              <div className="grid grid-cols-3 gap-1">
                {[
                  { icon: Shield, text: 'Sécurisé' },
                  { icon: Lock, text: 'Chiffré' },
                  { icon: Headphones, text: 'Support' }
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center gap-1 opacity-70">
                    <item.icon className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] text-gray-400 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="mt-4 md:mt-2 text-center text-gray-400 text-[10px] font-medium">
          © 2026 MbeejFepal
        </div>
      </div>
    </div>
  );
}