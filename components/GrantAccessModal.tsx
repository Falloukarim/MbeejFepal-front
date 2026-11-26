'use client';

import { useState } from 'react';
import { grantAccessByMAC } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Wifi, KeyRound } from 'lucide-react';

interface Props {
  routerId: number;
  profiles: { id: number; profile_name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GrantAccessModal({ routerId, profiles, isOpen, onClose, onSuccess }: Props) {
  const [mac, setMac] = useState('');
  const [profileId, setProfileId] = useState<number>(profiles[0]?.id ?? 0);
  const [customDuration, setCustomDuration] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await grantAccessByMAC(routerId, {
        mac_address: mac,
        profile_id: profileId,
        duration_minutes: customDuration,
      });
      toast.success('Accès accordé avec succès !');
      setMac('');
      setCustomDuration(0);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-amber-500" /> Accès direct
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Donnez un accès Internet à un appareil précis sans paiement.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Adresse MAC de l'appareil
            </label>
            <input
              type="text"
              value={mac}
              onChange={e => setMac(e.target.value)}
              placeholder="AA:BB:CC:DD:EE:FF"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-mono"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Format : AA:BB:CC:DD:EE:FF (séparateurs - ou : acceptés)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Forfait à appliquer
            </label>
            <select
              value={profileId}
              onChange={e => setProfileId(parseInt(e.target.value))}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none [&>option]:bg-gray-900"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.profile_name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="relative">
              <input
                type="number"
                value={customDuration || ''}
                onChange={e => setCustomDuration(parseInt(e.target.value) || 0)}
                placeholder="Durée du profil par défaut"
                min={0}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">minutes</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? 'Octroi...' : 'Donner accès'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}