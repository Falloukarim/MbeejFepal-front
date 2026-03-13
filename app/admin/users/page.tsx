'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { getUsers, updateUserRole, type User } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      console.log('📦 Données utilisateurs brutes:', JSON.stringify(data, null, 2));
      
      // Transformation robuste des données du backend
      const adaptedUsers: User[] = Array.isArray(data) 
        ? data.map((item: any) => {
            console.log('🔄 Transformation item:', item);
            
            return {
              id: item.ID || item.id || '',
              name: item.Name || item.name || 'Nom non défini',
              email: item.Email || item.email || 'Email non défini',
              phone: item.Phone || item.phone || 'Téléphone non défini',
              role: (item.Role || item.role || 'USER') as 'ADMIN' | 'USER',
              is_active: item.IsActive !== undefined ? item.IsActive : (item.is_active || false),
              created_at: item.CreatedAt || item.created_at || new Date().toISOString()
            };
          })
          .filter(user => user.id) // Ne garder que ceux avec un ID valide
        : [];
      
      console.log('✅ Utilisateurs après transformation:', adaptedUsers);
      setUsers(adaptedUsers);
      
      if (adaptedUsers.length === 0) {
        toast('Aucun utilisateur trouvé', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, currentRole: 'ADMIN' | 'USER') => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Voulez-vous vraiment changer le rôle de cet utilisateur en ${newRole} ?`)) return;

    try {
      await updateUserRole(userId, newRole);
      toast.success('Rôle mis à jour avec succès');
      loadUsers();
    } catch (error) {
      console.error('❌ Erreur mise à jour rôle:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p className="text-gray-600 mt-2">Administration des comptes</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-semibold text-gray-900">Liste des utilisateurs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, index) => {
                // Générer une clé unique
                const key = user?.id ? `user-${user.id}` : `user-index-${index}`;
                
                return (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.id ? (
                        <button
                          onClick={() => handleRoleChange(user.id, user.role)}
                          className="text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors"
                        >
                          Changer le rôle
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">ID invalide</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-lg">📭 Aucun utilisateur trouvé</p>
            <p className="text-sm mt-2">Les utilisateurs apparaîtront ici une fois inscrits.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}