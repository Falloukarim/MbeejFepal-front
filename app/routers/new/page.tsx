'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createRouter } from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, Copy, Terminal } from 'lucide-react';

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
    formState: { errors },
  } = useForm<RouterForm>({
    resolver: zodResolver(routerSchema),
    defaultValues: { name: '' },
  });

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

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nouveau routeur</h1>
        <p className="text-gray-600 mt-2">Ajoutez un nouveau point d'accès Wi-Fi</p>
      </div>

      <div className="max-w-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl p-8 border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du routeur
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                  placeholder="Ex: Routeur du salon"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#d97706] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#b45309] transition-all shadow-lg disabled:opacity-50 flex justify-center"
              >
                {isLoading ? 'Création...' : 'Créer le routeur'}
              </button>
            </form>

            {command && (
              <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-amber-500" />
                  Commande d'installation
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Copiez cette commande et exécutez-la sur votre routeur MikroTik :
                </p>
                <pre className="bg-black/50 text-amber-400 p-4 rounded-xl overflow-x-auto text-sm mb-4 font-mono border border-white/5">
                  {command}
                </pre>
                
                <button
                  onClick={copyCommand}
                  className={`w-full font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                    copied
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {copied ? (
                    <><Check className="w-5 h-5" /> Commande copiée !</>
                  ) : (
                    <><Copy className="w-5 h-5" /> Copier la commande</>
                  )}
                </button>
                
                {copied && (
                  <div className="mt-4 text-sm text-center text-gray-400 bg-black/30 p-3 rounded-xl border border-white/5">
                    Tapez ensuite <span className="font-mono font-bold text-amber-500">/import monwifi</span> pour exécuter le fichier
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}