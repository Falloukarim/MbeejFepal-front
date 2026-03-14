'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Wifi, Shield, Lock, Mail, KeyRound, ArrowRight, Star, Headphones } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Veuillez entrer un email valide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center py-2 px-3 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Background Pattern - Gris très clair pour rester dans les tons blancs */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(200,200,210,0.3)_0%,_transparent_60%),_radial-gradient(ellipse_at_bottom_left,_rgba(180,180,200,0.3)_0%,_transparent_60%)]" />
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cccccc' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-sm relative z-10 my-auto">
        {/* Carte principale - Plus compacte pour mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl shadow-2xl overflow-hidden bg-white/95 backdrop-blur-lg border border-amber-300/30"
        >
          {/* Header avec orange très foncé - moins de rouge */}
          <div className="relative bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 p-6 text-center overflow-hidden">
            {/* Effets de lumière - Plus chauds et moins rouges */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,180,100,0.25)_0%,_transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,_rgba(255,160,80,0.25)_0%,_transparent_70%)]" />
            
            {/* Badge Premium - Plus sombre */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-3 right-3 bg-gradient-to-r from-amber-700 to-amber-800 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1"
            >
              <Star className="w-2.5 h-2.5 fill-current" />
              HOTSPOT
            </motion.div>

            {/* Logo WiFi - Plus sombre */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative w-16 h-16 mx-auto mb-3"
            >
              {/* Cercle de fond - Plus sombre */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full opacity-30 animate-pulse" />
              
              {/* Cercle principal - Plus sombre */}
              <div className="absolute inset-1.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-full flex items-center justify-center shadow-2xl border-2 border-amber-400/50">
                <Wifi className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              
              {/* Ondes WiFi - Plus subtiles */}
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
              className="text-white/80 text-xs font-medium"
            >
              Connexion sécurisée
            </motion.p>
          </div>

          {/* Corps de la carte - Padding réduit pour mobile */}
          <div className="p-5">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Champ Email avec icône - Plus compact */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-amber-600" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all duration-200 bg-white text-sm"
                    placeholder="exemple@email.com"
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1 text-xs text-red-600 flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    {errors.email.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Champ Mot de passe avec icône - Plus compact */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
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
                    {...register('password')}
                    type="password"
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all duration-200 bg-white text-sm"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1 text-xs text-red-600 flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    {errors.password.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Bouton de connexion - Orange très foncé */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white font-bold py-3 px-4 rounded-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group text-sm"
                >
                  <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Se connecter
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </motion.div>

              {/* Lien d'inscription - Plus compact */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center"
              >
                <p className="text-xs text-amber-700">
                  Pas encore de compte ?{' '}
                  <Link 
                    href="/register" 
                    className="text-amber-600 hover:text-amber-800 font-bold inline-flex items-center gap-1 group transition-colors"
                  >
                    Créer un compte
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
              </motion.div>
            </form>

            {/* Badges de sécurité - Plus compacts et denses */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-4 pt-4 border-t border-amber-200"
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
                    className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-amber-100 transition-all cursor-default"
                  >
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className="text-[10px] text-amber-900 font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Copyright - Plus compact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-3 text-center text-gray-500 text-[10px] font-medium"
        >
          © 2024 MbeejFepal
        </motion.div>
      </div>
    </div>
  );
}