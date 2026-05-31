import { useState, useEffect, useCallback } from 'react';
import { productsApi, categoriesApi, movementsApi } from '../services/api';
import type { Product, Category, StockMovement, InventoryStats, PaginatedResponse } from '../types';

// Generic fetch hook
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Products hook
export function useProducts(params?: {
  page?: number; limit?: number; search?: string;
  category_id?: string; status?: string; low_stock?: boolean; out_of_stock?: boolean;
}) {
  return useFetch<PaginatedResponse<Product>>(
    () => productsApi.getAll(params),
    [params?.page, params?.limit, params?.search, params?.category_id, params?.status, params?.low_stock, params?.out_of_stock]
  );
}

// Stats hook
export function useStats() {
  return useFetch<InventoryStats>(() => productsApi.getStats(), []);
}

// Categories hook
export function useCategories() {
  return useFetch<Category[]>(() => categoriesApi.getAll(), []);
}

// Movements hook
export function useMovements(params?: { page?: number; limit?: number; product_id?: string }) {
  return useFetch<PaginatedResponse<StockMovement>>(
    () => movementsApi.getAll(params),
    [params?.page, params?.limit, params?.product_id]
  );
}
