// lib/api.ts
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { safeLocalStorage } from './storage';

// ==========================================
// TYPES
// ==========================================
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
  connection_status?: 'online' | 'offline' | 'never_connected';
  status_display?: string;
}

export interface HotspotProfile {
  id: number;
  router_id: number;
  profile_name: string;
  duration_minutes: number;
  price: number;
  currency: string;
  bandwidth_limit: string | null;
  max_devices: number; // ✅ NOUVEAU
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  zone_code: string | null;
  users_id: string;
  router_id: number;
  hotspot_id: number;
  mac_address: string;
  ip_address: string | null;
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

export interface SubscriptionPlan {
  id: number;
  level: 'level1' | 'level2';
  name: string;
  base_price: number;
  included_routers: number;
  extra_router_price: number;
  is_active: boolean;
}

export interface Subscription {
  id: number;
  user_id: string;
  plan_id: number;
  plan: SubscriptionPlan;
  status: 'pending' | 'active' | 'past_due' | 'expired' | 'cancelled';
  router_count: number;
  monthly_amount: number;
  started_at: string;
  expires_at: string;
  next_billing_at: string;
}

export interface SubscriptionStatus {
  active: boolean;
  subscription?: Subscription;
  router_count: number;
  router_limit: number;
  can_add_router: boolean;
  suggested_plan?: SubscriptionPlan;
}

export interface LoginResponse { token: string; }
export interface RegisterData { name: string; email: string; phone: string; password: string; role?: 'ADMIN' | 'USER'; }
export interface ApiError { message: string; statusCode?: number; }

// ==========================================
// AXIOS SETUP
// ==========================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur requête : on utilise safeLocalStorage
api.interceptors.request.use(
  (config) => {
    const token = safeLocalStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur réponse : on utilise safeLocalStorage
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      safeLocalStorage.removeItem('token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        toast.error('Session expirée, veuillez vous reconnecter');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 402) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/subscription')) {
        toast.error('Un abonnement actif est requis.');
        window.location.href = '/subscription';
      }
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } else if (error.response?.status === 403) {
      const data = error.response.data as any;
      if (data?.error === 'plan_limit_reached') {
         toast.error(data.message || 'Limite de routeurs atteinte.');
      } else {
         toast.error('Accès non autorisé');
      }
    } else if (error.response?.status === 500) {
      toast.error('Erreur serveur. Veuillez réessayer plus tard.');
    }
    return Promise.reject(error);
  }
);

// ==========================================
// AUTHENTIFICATION
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
// ROUTEURS
// ==========================================
export const getRouters = async () => {
  const response = await api.get<Router[]>('/routers');
  return response.data;
};

export const getRouter = async (id: number) => {
  const response = await api.get<Router>(`/routers/${id}`);
  return response.data;
};

export const getMonitoringRouters = async () => {
  const response = await api.get<any[]>('/monitoring/routers');
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
// PROFILS (FORFAITS)
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
// WALLET & TRANSACTIONS
// ==========================================
export const getWallet = async () => {
  const response = await api.get<Wallet>('/api/wallet');
  return response.data;
};

export const getTransactions = async () => {
  const response = await api.get<Transaction[]>('/api/wallet/transactions');
  return response.data;
};

export const getMySessions = async () => {
  const response = await api.get<Session[]>('/api/sessions');
  return response.data || [];
};

// ==========================================
// ADMINISTRATION
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

// ==========================================
// ABONNEMENTS (SUBSCRIPTIONS)
// ==========================================
export const getSubscriptionPlans = async () => {
  const response = await api.get<SubscriptionPlan[]>('/api/subscription/plans');
  return response.data;
};

export const getSubscriptionStatus = async () => {
  const response = await api.get<SubscriptionStatus>('/api/subscription/status');
  return response.data;
};

export const chooseSubscription = async (planId: number) => {
  const response = await api.post<{ subscription: Subscription; invoice: any; paydunya_url: string }>(
    '/api/subscription/choose',
    { plan_id: planId }
  );
  return response.data;
};

export const upgradeToLevel2 = async () => {
  await api.post('/api/subscription/upgrade');
};

export default api;