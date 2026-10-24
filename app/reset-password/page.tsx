'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPassword } from '@/lib/api';
import toast from 'react-hot-toast';
import { KeyRound, CheckCircle2, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// 1. Validation du formulaire
const schema = z.object({
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
});

type Form = z.infer<typeof schema>;

// 2. Le composant interne qui lit le token dans l'URL
function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      await resetPassword(token, data.password);
      setDone(true);
      toast.success('Mot de passe modifié avec succès !');
      setTimeout(() => router.push('/login'), 2500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lien invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  // Si le token est absent de l'URL
  if (!token) {
    return (
      <div className="text-center py-6">
        <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Lien invalide</h2>
        <p className="text-gray-400 text-sm mb-6">Le jeton de réinitialisation est manquant dans l'URL.</p>
        <Link href="/forgot-password" className="inline-flex items-center gap-2 bg-[#d97706] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#b45309] transition">
          Refaire une demande
        </Link>
      </div>
    );
  }

  // Page de succès
  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Mot de passe modifié</h2>
        <p className="text-gray-400 text-sm">Redirection vers la page de connexion...</p>
        <div className="mt-6 w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
      </motion.div>
    );
  }

  // Formulaire
  return (
    <>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Nouveau mot de passe</h1>
        <p className="text-gray-400 text-sm mt-1">Saisissez votre nouveau mot de passe sécurisé.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Mot de passe</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition"
            />
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Confirmation</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <input
              {...register('confirm')}
              type="password"
              placeholder="••••••••"
              className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition"
            />
          </div>
          {errors.confirm && <p className="text-xs text-red-400 mt-1">{errors.confirm.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#d97706] text-white font-bold py-3.5 rounded-xl hover:bg-[#b45309] transition-all shadow-lg flex justify-center items-center gap-2 mt-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Enregistrer le mot de passe'
          )}
        </button>

        <div className="text-center pt-2">
          <Link href="/login" className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Retour à la connexion
          </Link>
        </div>
      </form>
    </>
  );
}

// 3. Le composant principal avec le Suspense (OBLIGATOIRE pour useSearchParams)
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0a0a]">
      {/* Décors de fond */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(217,119,6,0.15)_0%,transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md relative z-10 bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-[32px] p-8 shadow-2xl"
      >
        <Suspense fallback={<div className="text-center text-white">Chargement...</div>}>
          <ResetForm />
        </Suspense>
      </motion.div>
    </div>
  );
}