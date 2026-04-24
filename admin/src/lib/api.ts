const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
  }
}

const getToken = () => localStorage.getItem('leadhangover_token');

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('leadhangover_token');
    if (location.pathname !== '/login') location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }
  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;
  if (!res.ok) {
    const d = data as Record<string, string> | null;
    throw new ApiError(res.status, d?.message || d?.error || 'Request failed', data);
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(p: string) => apiFetch<T>(p),
  post: <T = unknown>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T = unknown>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = unknown>(p: string) => apiFetch<T>(p, { method: 'DELETE' }),
};
