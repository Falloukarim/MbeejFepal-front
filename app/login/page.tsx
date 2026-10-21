'use client';

import { useEffect, useState } from 'react';
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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
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
    <div className="min-h-screen flex items-center justify-center py-2 px-3 relative overflow-hidden bg-[#f8fafc]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(200,200,210,0.3)_0%,_transparent_60%),_radial-gradient(ellipse_at_bottom_left,_rgba(180,180,200,0.3)_0%,_transparent_60%)]" />

      <div className="w-full max-w-sm relative z-10 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10"
        >
          {/* Header */}
          <div className="relative p-6 text-center overflow-hidden border-b border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-3 right-3 bg-white/10 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 border border-white/5"
            >
              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              PRO
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative w-16 h-16 mx-auto mb-3"
            >
              <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-pulse" />
              <div className="absolute inset-1.5 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center shadow-2xl">
                <Wifi className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
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
              className="text-gray-400 text-xs font-medium"
            >
              Connexion à votre espace
            </motion.p>
          </div>

          {/* Form */}
          <div className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-xs font-semibold text-gray-300 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-amber-500" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm"
                    placeholder="exemple@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {errors.email.message}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-300">Mot de passe</label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-amber-500 hover:text-amber-400 font-semibold transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-amber-500" />
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {errors.password.message}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#d97706] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#b45309] transition-all shadow-lg disabled:opacity-50 flex justify-center mt-2"
                >
                  {isLoading ? 'Connexion...' : (
                    <span className="flex items-center justify-center gap-2">
                      Se connecter <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center pt-2"
              >
                <p className="text-xs text-gray-400">
                  Pas encore de compte ?{' '}
                  <Link href="/register" className="text-amber-500 hover:text-amber-400 font-bold transition-colors">
                    Créer un compte
                  </Link>
                </p>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-6 pt-4 border-t border-white/10"
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

        <div className="mt-4 text-center text-gray-500 text-[10px] font-medium">
          © 2026 MbeejFepal
        </div>
      </div>
    </div>
  );
}