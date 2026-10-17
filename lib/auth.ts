// lib/auth.ts
import { safeLocalStorage } from './storage';

export interface UserFromToken {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export const isAuthenticated = (): boolean => {
  return !!safeLocalStorage.getItem('token');
};

export const getToken = (): string | null => {
  return safeLocalStorage.getItem('token');
};

export const logout = (): void => {
  safeLocalStorage.removeItem('token');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const getUserFromToken = (): UserFromToken | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Décodage Base64Url standard
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
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

export const isAdmin = (): boolean => {
  const user = getUserFromToken();
  return user?.role === 'ADMIN';
};

export const requireAuth = (router: any) => {
  if (!isAuthenticated()) {
    router.push('/login');
    return false;
  }
  return true;
};

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