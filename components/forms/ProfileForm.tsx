import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Router } from '@/lib/api';

// CORRECTION: Supprimer required_error et utiliser .min(1) à la place
const profileSchema = z.object({
  router_id: z.number().min(1, 'Veuillez sélectionner un routeur'), // ← modifié ici
  profile_name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  duration_minutes: z.number().min(1, 'La durée doit être positive'),
  price: z.number().min(1, 'Le prix doit être positif'),
  currency: z.enum(['XOF', 'EUR', 'USD']),
  bandwidth_limit: z.string().optional(),
  is_active: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  onSubmit: (data: ProfileFormData) => Promise<void>;
  routers: Router[];
  isLoading?: boolean;
  defaultValues?: Partial<ProfileFormData>;
}

export default function ProfileForm({
  onSubmit,
  routers,
  isLoading = false,
  defaultValues = {},
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      router_id: 0, // ← Ajouter une valeur par défaut pour éviter les problèmes
      currency: 'XOF',
      is_active: true,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Sélection du routeur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Routeur associé
        </label>
        <select
          {...register('router_id', { valueAsNumber: true })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-white"
        >
          <option value="">Sélectionnez un routeur</option>
          {routers.map((router) => (
            <option key={router.id} value={router.id}>
              {router.name} {router.is_active ? '' : '(inactif)'}
            </option>
          ))}
        </select>
        {errors.router_id && (
          <p className="mt-1 text-sm text-red-600">{errors.router_id.message}</p>
        )}
      </div>

      {/* Nom du forfait */}
      <Input
        label="Nom du forfait"
        placeholder="Ex: Forfait Premium"
        error={errors.profile_name?.message}
        {...register('profile_name')}
      />

      {/* Durée et prix */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Durée (minutes)"
          type="number"
          min="1"
          error={errors.duration_minutes?.message}
          {...register('duration_minutes', { valueAsNumber: true })}
        />

        <Input
          label="Prix"
          type="number"
          step="1"
          min="1"
          error={errors.price?.message}
          {...register('price', { valueAsNumber: true })}
        />
      </div>

      {/* Devise */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Devise
        </label>
        <select
          {...register('currency')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-white"
        >
          <option value="XOF">FCFA (XOF)</option>
          <option value="EUR">Euro (EUR)</option>
          <option value="USD">Dollar (USD)</option>
        </select>
      </div>

      {/* Limite de débit */}
      <Input
        label="Limite de débit (optionnel)"
        placeholder="Ex: 10Mbps"
        error={errors.bandwidth_limit?.message}
        {...register('bandwidth_limit')}
      />

      {/* Option active */}
      <div className="flex items-center">
        <input
          {...register('is_active')}
          type="checkbox"
          className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
        />
        <label className="ml-2 text-sm text-gray-700">
          Forfait actif
        </label>
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        fullWidth
      >
        {defaultValues.profile_name ? 'Mettre à jour' : 'Créer le forfait'}
      </Button>
    </form>
  );
}