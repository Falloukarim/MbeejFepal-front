import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const routerSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
});

type RouterFormData = z.infer<typeof routerSchema>;

interface RouterFormProps {
  onSubmit: (data: RouterFormData) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: Partial<RouterFormData>;
}

export default function RouterForm({
  onSubmit,
  isLoading = false,
  defaultValues = {},
}: RouterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RouterFormData>({
    resolver: zodResolver(routerSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Nom du routeur"
        placeholder="Ex: Routeur du salon"
        error={errors.name?.message}
        {...register('name')}
      />

      <Button
        type="submit"
        isLoading={isLoading}
        fullWidth
      >
        {defaultValues.name ? 'Mettre à jour' : 'Créer le routeur'}
      </Button>
    </form>
  );
}