export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface StockTrendPoint {
  date: string;
  stock_in: number;
  stock_out: number;
  net: number;
}

export interface CsvImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
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
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  note?: string;
  created_at: string;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  category_id?: string;
  quantity: number;
  min_quantity: number;
  price: number;
  unit: string;
  status?: 'active' | 'inactive' | 'discontinued';
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface CreateStockMovementDto {
  product_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  note?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  status?: string;
  low_stock?: string;
  out_of_stock?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
