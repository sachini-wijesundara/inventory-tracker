import axios from 'axios';
import type {
  Product, Category, StockMovement, InventoryStats,
  PaginatedResponse, ApiResponse, ProductFormData, StockMovementFormData
} from '../types';

const api = axios.create({ baseURL: '/api' });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Products
export const productsApi = {
  getAll: (params?: {
    page?: number; limit?: number; search?: string;
    category_id?: string; status?: string; low_stock?: boolean;
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
};
