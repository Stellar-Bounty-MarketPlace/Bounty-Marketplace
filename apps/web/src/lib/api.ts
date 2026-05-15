import axios, { type AxiosInstance, type AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT from localStorage
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken });
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);

        if (original.headers) {
          original.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return apiClient(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);

// Typed API methods
export const api = {
  bounties: {
    list: (params?: Record<string, unknown>) => apiClient.get('/bounties', { params }),
    get: (id: string) => apiClient.get(`/bounties/${id}`),
    create: (data: unknown) => apiClient.post('/bounties', data),
    assign: (id: string, contributorId: string) =>
      apiClient.patch(`/bounties/${id}/assign`, { contributorId }),
    submit: (id: string) => apiClient.patch(`/bounties/${id}/submit`),
    approve: (id: string) => apiClient.patch(`/bounties/${id}/approve`),
    cancel: (id: string) => apiClient.patch(`/bounties/${id}/cancel`),
    dispute: (id: string, data: { reason: string; evidence?: string }) =>
      apiClient.post(`/bounties/${id}/dispute`, data),
  },
  contributors: {
    search: (q: string) => apiClient.get('/contributors/search', { params: { q } }),
    get: (username: string) => apiClient.get(`/contributors/${username}`),
    sync: (id: string) => apiClient.post(`/contributors/${id}/sync`),
  },
  ai: {
    matches: (bountyId: string) => apiClient.get(`/ai/matches/${bountyId}`),
    classify: (data: { title: string; body: string }) => apiClient.post('/ai/classify', data),
  },
  analytics: {
    ecosystem: () => apiClient.get('/analytics/ecosystem'),
    timeseries: (days?: number) => apiClient.get('/analytics/timeseries', { params: { days } }),
    activity: (limit?: number) => apiClient.get('/analytics/activity', { params: { limit } }),
  },
  reputation: {
    leaderboard: (limit?: number) => apiClient.get('/reputation/leaderboard', { params: { limit } }),
    rate: (data: { bountyId: string; contributorId: string; score: number }) =>
      apiClient.post('/reputation/rate', data),
  },
  auth: {
    me: () => apiClient.get('/auth/me'),
    logout: () => apiClient.post('/auth/logout'),
  },
};
