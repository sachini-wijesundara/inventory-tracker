import axios from 'axios';
import type {
  Product, Category, StockMovement, InventoryStats, AuthUser, CsvImportResult,
  PaginatedResponse, ApiResponse, ProductFormData, StockMovementFormData, StockTrendPoint
} from '../types';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stockwise_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'An error occurred';
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('stockwise_token');
      localStorage.removeItem('stockwise_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(new Error(message));
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: AuthUser }>>('/auth/login', { email, password })
      .then(r => r.data.data),

  me: () =>
    api.get<ApiResponse<AuthUser>>('/auth/me').then(r => r.data.data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }).then(r => r.data),
};

// Products
export const productsApi = {
  getAll: (params?: {
    page?: number; limit?: number; search?: string;
    category_id?: string; status?: string; low_stock?: boolean; out_of_stock?: boolean;
  }) => api.get<PaginatedResponse<Product>>('/products', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Product>>(`/products/${id}`).then(r => r.data.data),

  getStats: () =>
    api.get<ApiResponse<InventoryStats>>('/products/stats').then(r => r.data.data),

  create: (data: ProductFormData) =>
    api.post<ApiResponse<Product>>('/products', data).then(r => r.data),

  update: (id: string, data: Partial<ProductFormData>) =>
    api.patch<ApiResponse<Product>>(`/products/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/products/${id}`).then(r => r.data),

  exportCsv: async () => {
    const res = await api.get('/products/export/csv', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importCsv: (csv: string) =>
    api.post<ApiResponse<CsvImportResult>>('/products/import/csv', { csv }).then(r => r.data),
};

// Categories
export const categoriesApi = {
  getAll: () =>
    api.get<ApiResponse<Category[]>>('/categories').then(r => r.data.data),

  create: (data: { name: string; description?: string }) =>
    api.post<ApiResponse<Category>>('/categories', data).then(r => r.data),

  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<ApiResponse<Category>>(`/categories/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/categories/${id}`).then(r => r.data),
};

// Stock Movements
export const movementsApi = {
  getAll: (params?: { page?: number; limit?: number; product_id?: string }) =>
    api.get<PaginatedResponse<StockMovement>>('/movements', { params }).then(r => r.data),

  create: (data: StockMovementFormData) =>
    api.post<ApiResponse<StockMovement>>('/movements', data).then(r => r.data),

  getTrends: (days = 30) =>
    api.get<ApiResponse<StockTrendPoint[]>>('/movements/trends', { params: { days } }).then(r => r.data.data),
};