
export interface UserFromToken {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

// Vérifie si l'utilisateur est authentifié
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

// Récupère le token JWT
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Déconnexion
export const logout = (): void => {
  localStorage.removeItem('token');
  // Optionnel : rediriger vers la page de login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Extrait les informations de l'utilisateur depuis le token JWT
export const getUserFromToken = (): UserFromToken | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    // Le token JWT est composé de 3 parties séparées par des points
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Décoder la partie payload (deuxième partie)
    const payload = JSON.parse(atob(parts[1]));
    
    return {
      id: payload.sub || payload.id || '',
      email: payload.email || '',
      role: payload.role || 'USER',
    };
  } catch (error) {
    console.error('Erreur lors du décodage du token:', error);
    return null;
  }
};

// Vérifie si l'utilisateur est admin
export const isAdmin = (): boolean => {
  const user = getUserFromToken();
  return user?.role === 'ADMIN';
};

// Middleware de protection des routes (à utiliser dans les pages)
export const requireAuth = (router: any) => {
  if (!isAuthenticated()) {
    router.push('/login');
    return false;
  }
  return true;
};

// Middleware pour les routes admin
export const requireAdmin = (router: any) => {
  if (!isAuthenticated()) {
    router.push('/login');
    return false;
  }
  if (!isAdmin()) {
    router.push('/dashboard');
    return false;
  }
  return true;
};