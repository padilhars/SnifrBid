import axios from 'axios';

// Lazy import para evitar problemas de inicialização em SSR
function getAuthStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/stores/authStore').useAuthStore;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  timeout: 30000,
  withCredentials: true, // envia cookies HttpOnly automaticamente
});

// Injeta access token em todo request
api.interceptors.request.use((config) => {
  try {
    const token = getAuthStore().getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // store pode não estar inicializada ainda (SSR)
  }
  return config;
});

// Refresh automático em 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post<{ accessToken: string }>(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        getAuthStore().getState().updateToken(data.accessToken);
        return api(original);
      } catch {
        getAuthStore().getState().clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);
