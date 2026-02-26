const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function fetchApi<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options;

  let url = `${API_URL}/api${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'خطأ في الاتصال' }));
    throw new Error(error.message || error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  register: (data: { email: string; password: string; name: string; companyName: string; companySlug: string }) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => fetchApi('/auth/logout', { method: 'POST' }),

  me: () => fetchApi('/auth/me'),

  // Company
  getCompany: () => fetchApi('/company'),
  updateCompany: (data: any) =>
    fetchApi('/company', { method: 'PATCH', body: JSON.stringify(data) }),

  // Products
  getProducts: (page = 1) =>
    fetchApi('/products', { params: { page: String(page) } }),
  getProduct: (id: string) => fetchApi(`/products/${id}`),
  createProduct: (data: any) =>
    fetchApi('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    fetchApi(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    fetchApi(`/products/${id}`, { method: 'DELETE' }),

  // Product Config
  getProductConfig: (productId: string) => fetchApi(`/product-config/${productId}`),
  upsertProductConfig: (productId: string, data: any) =>
    fetchApi(`/product-config/${productId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Assets
  uploadAsset: async (productId: string, type: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/assets/upload?productId=${productId}&type=${type}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return res.json();
  },
  getAssets: (productId: string) => fetchApi(`/assets/product/${productId}`),
  deleteAsset: (id: string) => fetchApi(`/assets/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: (page = 1) => fetchApi('/users', { params: { page: String(page) } }),
  createUser: (data: any) =>
    fetchApi('/users', { method: 'POST', body: JSON.stringify(data) }),

  // API Tokens
  getTokens: () => fetchApi('/api-tokens'),
  createToken: (data: { name: string; scopesJson: string[] }) =>
    fetchApi('/api-tokens', { method: 'POST', body: JSON.stringify(data) }),
  revokeToken: (id: string) => fetchApi(`/api-tokens/${id}`, { method: 'DELETE' }),

  // Analytics
  getDashboardStats: () => fetchApi('/analytics/dashboard'),
  getSessionsByDay: (from?: string, to?: string) =>
    fetchApi('/analytics/sessions-by-day', { params: { ...(from && { from }), ...(to && { to }) } }),
  getTopProducts: () => fetchApi('/analytics/top-products'),
  getEventBreakdown: () => fetchApi('/analytics/events'),

  // Billing
  getInvoices: () => fetchApi('/billing/invoices'),
  getCurrentUsage: () => fetchApi('/billing/current'),

  // Platform Admin
  getPlatformStats: () => fetchApi('/platform/stats'),
  getPlatformCompanies: (page = 1) =>
    fetchApi('/platform/companies', { params: { page: String(page) } }),
  getPlatformCompany: (id: string) => fetchApi(`/platform/companies/${id}`),
  updateCompanyStatus: (id: string, status: string) =>
    fetchApi(`/platform/companies/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getPlans: () => fetchApi('/platform/plans'),
};
