'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createRouter } from '@/lib/api';
import toast from 'react-hot-toast';

const routerSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
});

type RouterForm = z.infer<typeof routerSchema>;

export default function NewRouterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [command, setCommand] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RouterForm>({
    resolver: zodResolver(routerSchema),
    defaultValues: {
      name: '',
    },
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
      toast.success('Commande copiée dans le presse-papiers !');
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nouveau routeur</h1>
        <p className="text-gray-600 mt-2">Ajoutez un nouveau point d'accès Wi-Fi</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nom du routeur */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom du routeur
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                placeholder="Ex: Routeur du salon"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Bouton de création */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-black to-gray-800 text-white font-semibold py-2 px-4 rounded-lg hover:from-gray-800 hover:to-black transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Création...
                </div>
              ) : (
                'Créer le routeur'
              )}
            </button>
          </form>

          {/* Commande d'installation */}
          {command && (
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Commande d'installation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Copiez cette commande et exécutez-la sur votre routeur MikroTik :
              </p>
              <pre className="bg-black text-white p-4 rounded-lg overflow-x-auto text-sm mb-4 font-mono">
                {command}
              </pre>
              <button
                onClick={copyCommand}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg"
              >
                📋 Copier la commande
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}