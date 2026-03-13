'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { getUsers, updateUserRole, type User } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PromoteAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.filter(u => u.role !== 'ADMIN')); // Montrer seulement les non-admins
    } catch (error) {
      toast.error('Erreur chargement utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    if (!confirm('Promouvoir cet utilisateur en administrateur ?')) return;
    try {
      await updateUserRole(userId, 'ADMIN');
      toast.success('Utilisateur promu admin');
      loadUsers();
    } catch (error) {
      toast.error('Erreur lors de la promotion');
    }
  };

  if (loading) return <Layout>Chargement...</Layout>;

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-8">Promouvoir des admins</h1>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Nom</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Téléphone</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.phone}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => promoteToAdmin(user.id)}
                    className="text-amber-600 hover:text-amber-700"
                  >
                    Promouvoir admin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}