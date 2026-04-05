import { create } from 'zustand';
import type { User, Tenant } from '@/types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  setAuth: (user: User, tenant: Tenant, token: string) => void;
  clearAuth: () => void;
  updateToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  accessToken: null,

  setAuth: (user, tenant, token) => set({ user, tenant, accessToken: token }),

  clearAuth: () => set({ user: null, tenant: null, accessToken: null }),

  updateToken: (token) => set({ accessToken: token }),
}));
