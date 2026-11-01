'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createRouter } from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, Copy, Terminal, ChevronLeft, Wifi, CheckCircle2, ArrowRight, Router as RouterIcon } from 'lucide-react';

const routerSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
});

type RouterForm = z.infer<typeof routerSchema>;

export default function NewRouterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [command, setCommand] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RouterForm>({
    resolver: zodResolver(routerSchema),
    defaultValues: { name: '' },
  });

  const nameValue = watch('name') || '';
  const step = command ? 2 : 1;

  const onSubmit = async (data: RouterForm) => {
    setIsLoading(true);
    try {
      const response = await createRouter(data.name);
      setCommand(response.command);
      toast.success('Routeur créé avec succès !');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCommand = () => {
    if (command) {
      navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const installSteps = [
    { title: 'Ouvrez le terminal', desc: 'Dans Winbox ou WebFig, cliquez sur « New Terminal ».' },
    { title: 'Collez la commande', desc: 'Collez la commande copiée puis validez avec Entrée.' },
    { title: 'Lancez l\'import', desc: null as string | null },
  ];

  return (
    <Layout>
      <style>{`
        @keyframes nr-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .nr-rise { animation: nr-rise .45s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      <div className="max-w-xl mx-auto px-4 pt-4 pb-10">
        {/* Retour */}
        <Link href="/routers" className="inline-flex items-center gap-1 -ml-1 mb-3 text-sm font-bold text-gray-400 active:opacity-70 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Routeurs
        </Link>

        {/* En-tête */}
        <header className="mb-5">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-amber-500 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider mb-3">
            <Wifi className="w-3.5 h-3.5" /> NOUVEAU ROUTEUR
          </div>
          <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-white">Nouveau routeur</h1>
          <p className="text-sm text-gray-400 mt-1">Ajoutez un nouveau point d'accès Wi-Fi</p>
        </header>

        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-3 mb-5" aria-label={`Étape ${step} sur 2`}>
          {[
            { n: 1, label: 'Nom' },
            { n: 2, label: 'Installation' },
          ].map((s, i) => {
            const done = step > s.n;
            const current = step === s.n;
            return (
              <div key={s.n} className="flex items-center gap-3 flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold transition-all ${
                      done
                        ? 'bg-green-500 text-white'
                        : current
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                        : 'bg-white/5 border border-white/10 text-gray-500'
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" strokeWidth={3.5} /> : s.n}
                  </span>
                  <span className={`text-sm font-bold ${current || done ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
                </div>
                {i === 0 && (
                  <div className="h-0.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full bg-gradient-to-r from-green-500 to-amber-500 transition-all duration-700 ${step > 1 ? 'w-full' : 'w-0'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ───────── ÉTAPE 1 : NOM ───────── */}
        {!command && (
          <section className="nr-rise relative overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 p-5 sm:p-6 shadow-2xl">
            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-5" noValidate>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <RouterIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-white leading-tight">Nommez votre routeur</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Choisissez un nom facile à reconnaître</p>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Nom du routeur
                </label>
                <input
                  id="name"
                  {...register('name')}
                  type="text"
                  autoComplete="off"
                  autoFocus
                  aria-invalid={!!errors.name}
                  className={`w-full h-14 px-4 bg-white/5 border text-white text-base placeholder-gray-500 rounded-2xl outline-none transition-all focus:ring-2 ${
                    errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-white/10 focus:ring-amber-500'
                  }`}
                  placeholder="Ex: Routeur du salon"
                />
                <div className="flex items-start justify-between gap-3 mt-2 min-h-5">
                  {errors.name ? (
                    <p className="text-sm text-red-400">{errors.name.message}</p>
                  ) : (
                    <p className="text-xs text-gray-500">3 caractères minimum</p>
                  )}
                  <span className={`text-xs tabular-nums shrink-0 ${nameValue.trim().length >= 3 ? 'text-green-400' : 'text-gray-600'}`}>
                    {nameValue.trim().length}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-base shadow-xl shadow-amber-600/25 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    Créer le routeur <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        {/* ───────── ÉTAPE 2 : INSTALLATION ───────── */}
        {command && (
          <div className="space-y-4">
            <section className="nr-rise relative overflow-hidden rounded-[28px] p-5 border border-green-500/25 bg-gradient-to-br from-green-500/15 via-gray-900 to-black shadow-xl">
              <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-green-500/15 blur-3xl pointer-events-none" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-400 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-white leading-tight">Routeur créé !</h2>
                  <p className="text-sm text-gray-400 truncate">« {nameValue.trim()} » est prêt à être installé.</p>
                </div>
              </div>
            </section>

            {/* Commande */}
            <section className="nr-rise rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 overflow-hidden shadow-2xl" style={{ animationDelay: '70ms' }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-amber-500" /> Commande d'installation
                </h3>
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </span>
              </div>
              <div className="p-4">
                <pre className="bg-black/60 text-amber-400 p-4 rounded-2xl overflow-x-auto text-[13px] leading-relaxed font-mono border border-white/5 whitespace-pre-wrap break-all">
                  {command}
                </pre>
                <button
                  onClick={copyCommand}
                  className={`mt-3 w-full h-14 rounded-2xl font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                    copied
                      ? 'bg-green-500 text-white shadow-xl shadow-green-600/25'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-600/25'
                  }`}
                >
                  {copied ? (
                    <><Check className="w-5 h-5" /> Commande copiée !</>
                  ) : (
                    <><Copy className="w-5 h-5" /> Copier la commande</>
                  )}
                </button>
              </div>
            </section>

            {/* Guide pas à pas */}
            <section className="nr-rise rounded-[28px] bg-white/5 border border-white/10 p-5" style={{ animationDelay: '140ms' }}>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-4">Comment l'installer</h3>
              <ol className="space-y-4">
                {installSteps.map((s, i) => (
                  <li key={s.title} className="flex gap-3.5">
                    <span className="w-8 h-8 shrink-0 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center text-sm font-extrabold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="font-bold text-white leading-snug">{s.title}</p>
                      {s.desc ? (
                        <p className="text-sm text-gray-400 mt-0.5">{s.desc}</p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-0.5">
                          Tapez <span className="font-mono font-bold text-amber-500 bg-black/40 px-1.5 py-0.5 rounded-md">/import monwifi</span> pour exécuter le fichier.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <button
              onClick={() => router.push('/routers')}
              className="nr-rise w-full h-14 rounded-2xl bg-white text-black font-bold text-base shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ animationDelay: '200ms' }}
            >
              Terminer <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}