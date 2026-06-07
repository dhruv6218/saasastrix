// Central HTTP client for all backend API calls.
// All requests go through Vite proxy → /api → Express on port 3000.

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('astrix_token', token);
  else localStorage.removeItem('astrix_token');
}

export function getStoredToken(): string | null {
  return localStorage.getItem('astrix_token');
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit & { params?: Record<string, any> } = {}
): Promise<T> {
  const { params, ...fetchOpts } = options;

  let url = `/api${path}`;
  if (params) {
    const q = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (q) url += `?${q}`;
  }

  const token = authToken || getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOpts.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...fetchOpts, headers, credentials: 'include' });

  if (res.status === 401) {
    setAuthToken(null);
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const get = <T = any>(path: string, params?: Record<string, any>) =>
  apiRequest<T>(path, { method: 'GET', params });

export const post = <T = any>(path: string, body?: any) =>
  apiRequest<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

export const patch = <T = any>(path: string, body?: any) =>
  apiRequest<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });

export const del = <T = any>(path: string) =>
  apiRequest<T>(path, { method: 'DELETE' });
