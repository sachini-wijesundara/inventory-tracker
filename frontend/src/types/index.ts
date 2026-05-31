export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  quantity: number;
  min_quantity: number;
  price: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  note?: string;
  created_at: string;
}

export interface InventoryStats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  totalCategories: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export type ProductFormData = {
  name: string;
  sku: string;
  description?: string;
  category_id?: string;
  quantity: number;
  min_quantity: number;
  price: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
};

export type StockMovementFormData = {
  product_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  note?: string;
};
