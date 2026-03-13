import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Types pour les réponses API
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'USER';
  is_active: boolean;
  created_at: string;
}

export interface Router {
  id: number;
  name: string;
  config_token: string;
  is_active: boolean;
  last_seen: string | null;
  created_at: string;
}

export interface HotspotProfile {
  id: number;
  router_id: number;
  profile_name: string;
  duration_minutes: number;
  price: number;
  currency: string;
  bandwidth_limit: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Dans lib/api.ts, remplace l'interface Wallet par :

export interface Wallet {
  id: number;          
  user_id: string;      
  balance: number;
  currency: string;
  created_at?: string;  
  updated_at?: string;  
}
export interface Transaction {
  id: number;
  wallet_id: number;
  session_id: number | null;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | 'COMMISSION';
  description: string;
  created_at: string;
}

export interface Session {
  id: number;
  router_id: number;
  profile_id: number;
  mac_address: string;
  state: 'CREATED' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  created_at: string;
  expires_at: string;
}

export interface Payment {
  id: number;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  provider_tx_id: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        toast.error('Session expirée, veuillez vous reconnecter');
        window.location.href = '/login';
      }
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } else if (error.response?.status === 403) {
      toast.error('Accès non autorisé');
    } else if (error.response?.status === 500) {
      toast.error('Erreur serveur. Veuillez réessayer plus tard.');
    }
    return Promise.reject(error);
  }
);

// ==========================================
// Authentification
// ==========================================
export const register = async (data: RegisterData) => {
  const response = await api.post<User>('/register', data);
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await api.post<LoginResponse>('/login', { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get<User>('/me');
  return response.data;
};

// ==========================================
// Routeurs
// ==========================================
export const getRouters = async () => {
  const response = await api.get<Router[]>('/routers');
  console.log('📡 Routeurs reçus:', response.data);
  return response.data;
};
export const getRouter = async (id: number) => {
  const response = await api.get<Router>(`/routers/${id}`);
  return response.data;
};

export const createRouter = async (name: string) => {
  const response = await api.post<{ id: number; name: string; config_token: string; command: string }>('/routers', { name });
  return response.data;
};

export const deleteRouter = async (id: number) => {
  await api.delete(`/routers/${id}`);
};

// ==========================================
// Profils (forfaits)
// ==========================================
export const getProfiles = async (routerId?: number) => {
  const url = routerId ? `/routers/${routerId}/profiles` : '/profiles';
  const response = await api.get<HotspotProfile[]>(url);
  return response.data;
};

export const getProfile = async (id: number) => {
  const response = await api.get<HotspotProfile>(`/profiles/${id}`);
  return response.data;
};

export const createProfile = async (data: Omit<HotspotProfile, 'id' | 'created_at' | 'updated_at'>) => {
  const response = await api.post<HotspotProfile>('/profiles', data);
  return response.data;
};

export const updateProfile = async (id: number, data: Partial<HotspotProfile>) => {
  const response = await api.put<HotspotProfile>(`/profiles/${id}`, data);
  return response.data;
};

export const deleteProfile = async (id: number) => {
  await api.delete(`/profiles/${id}`);
};

// ==========================================
// Wallet et transactions
// ==========================================
export const getWallet = async () => {
  const response = await api.get<Wallet>('/api/wallet');
  return response.data;
};

export const getTransactions = async () => {
  const response = await api.get<Transaction[]>('/api/wallet/transactions');
  return response.data;
};

// ==========================================
// Sessions
// ==========================================
export const getMySessions = async () => {
  const response = await api.get<Session[]>('/api/sessions');
  return response.data || [];;
};

// ==========================================
// Administration
// ==========================================
export const getUsers = async () => {
  const response = await api.get<User[]>('/admin/users');
  return response.data;
};

export const updateUserRole = async (id: string, role: 'ADMIN' | 'USER') => {
  const response = await api.put<User>(`/admin/users/${id}/role`, { role });
  return response.data;
};

export const getAllWallets = async () => {
  const response = await api.get<Wallet[]>('/admin/wallets');
  return response.data;
};

export const getAllTransactions = async () => {
  const response = await api.get<Transaction[]>('/admin/transactions');
  return response.data;
};

export const getAllPayments = async () => {
  const response = await api.get<Payment[]>('/admin/payments');
  return response.data;
};


export default api;