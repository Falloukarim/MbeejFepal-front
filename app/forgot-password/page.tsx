'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPassword } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Wifi,
  Shield,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Star,
  Headphones,
  CheckCircle2,
} from 'lucide-react';

const schema = z.object({
  email: z.string().email('Veuillez entrer un email valide'),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (error: any) {
      // Le backend renvoie toujours 200 (anti-énumération)
      // On affiche tout de même le message générique
      toast.error(
        error.response?.data?.message ||
          'Erreur lors de la demande. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center py-2 px-3 relative overflow-hidden bg-[#f8fafc]">
      {/* Background Pattern — identique à login/register */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(200,200,210,0.3)_0%,_transparent_60%),_radial-gradient(ellipse_at_bottom_left,_rgba(180,180,200,0.3)_0%,_transparent_60%)]" />

      <div className="w-full max-w-sm relative z-10 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10"
        >
          {/* Header — identique à login */}
          <div className="relative p-6 text-center overflow-hidden border-b border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-3 right-3 bg-white/10 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 border border-white/5"
            >
              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              RESET
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
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
              {sent ? 'Vérifiez votre boîte mail' : 'Mot de passe oublié ?'}
            </motion.p>
          </div>

          {/* Contenu */}
          <div className="p-6">
            {sent ? (
              // ✅ Message de confirmation
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">Email envoyé</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Si un compte existe avec cet email, vous recevrez un lien de
                    réinitialisation valable <strong className="text-gray-300">1 heure</strong>.
                  </p>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Vérifiez également vos spams si vous ne recevez rien dans les
                  5 minutes.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm mt-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </motion.div>
            ) : (
              // ✅ Formulaire
              <>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-gray-400 mb-4 leading-relaxed"
                >
                  Entrez l'email associé à votre compte. Nous vous enverrons un
                  lien pour réinitialiser votre mot de passe.
                </motion.p>

                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-amber-500" />
                      </div>
                      <input
                        {...register('email')}
                        type="email"
                        autoComplete="email"
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#d97706] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#b45309] transition-all shadow-lg disabled:opacity-50 flex justify-center mt-2"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Envoi...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Envoyer le lien <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-center pt-2"
                  >
                    <Link
                      href="/login"
                      className="text-xs text-gray-400 hover:text-gray-300 inline-flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Retour à la connexion
                    </Link>
                  </motion.div>
                </form>
              </>
            )}

            {/* Badges sécurité */}
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
                  { icon: Headphones, text: 'Support' },
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