import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tenant } from '@/types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, tenant: Tenant, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateToken: (accessToken: string, refreshToken?: string) => void;
  updateTenant: (tenant: Tenant) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, tenant, accessToken, refreshToken) =>
        set({ user, tenant, accessToken, refreshToken }),

      clearAuth: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'snifrbid_session=; path=/; max-age=0; Secure; SameSite=Lax';
        }
        set({ user: null, tenant: null, accessToken: null, refreshToken: null });
      },

      updateToken: (accessToken, refreshToken) =>
        set((s) => ({ accessToken, refreshToken: refreshToken ?? s.refreshToken })),

      updateTenant: (tenant) => set({ tenant }),
    }),
    { name: 'snifrbid_auth' },
  ),
);
