const API_BASE = '/api';

async function request(path: string, options?: RequestInit) {
  const session = await import('./supabase').then((m) => m.supabase.auth.getSession());
  const token = session.data.session?.access_token;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

interface TelegramAuthResponse {
  access_token: string;
  refresh_token: string;
  profile: Record<string, unknown>;
  is_new_user: boolean;
}

export const api = {
  auth: {
    telegram: (initData: string) =>
      request('/auth/telegram', { method: 'POST', body: JSON.stringify({ initData }) }) as Promise<TelegramAuthResponse>,
  },
  content: {
    feed: (params?: { category?: string; vibe?: string; cursor?: string; limit?: number }) => {
      const search = new URLSearchParams();
      if (params?.category) search.set('category', params.category);
      if (params?.vibe) search.set('vibe', params.vibe);
      if (params?.cursor) search.set('cursor', params.cursor);
      if (params?.limit) search.set('limit', String(params.limit));
      const qs = search.toString();
      return request(`/content/feed${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request(`/content/${id}`),
    generate: (params: { prompt: string; aspectRatio?: string; vibe?: string; imageUrls?: string[] }) =>
      request('/content/generate', { method: 'POST', body: JSON.stringify(params) }),
  },
  subscription: {
    plans: () => request('/subscription/plans'),
    my: () => request('/subscription/my'),
    checkout: (planId: string) =>
      request('/subscription/checkout', { method: 'POST', body: JSON.stringify({ planId }) }),
  },
};
