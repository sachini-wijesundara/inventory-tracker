import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Pencil, Trash2, ArrowLeftRight, Package } from 'lucide-react';
import { useProducts, useCategories } from '../hooks/useData';
import { productsApi, movementsApi } from '../services/api';
import { Modal, Table, Tr, Td, StockBadge, StatusBadge, SkeletonRow, Pagination, EmptyState } from '../components/ui';
import { ProductForm } from '../components/ProductForm';
import { StockMovementForm } from '../components/StockMovementForm';
import type { Product, ProductFormData, StockMovementFormData } from '../types';

export function Products() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('low_stock') === 'true');
  const [outOfStockOnly, setOutOfStockOnly] = useState(searchParams.get('out_of_stock') === 'true');

  useEffect(() => {
    setLowStockOnly(searchParams.get('low_stock') === 'true');
    setOutOfStockOnly(searchParams.get('out_of_stock') === 'true');
    setPage(1);
  }, [searchParams]);

  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [moveProduct, setMoveProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');

  const { data, loading, refetch } = useProducts({
    page, limit: 12, search: search || undefined,
    category_id: categoryFilter || undefined,
    status: statusFilter || undefined,
    low_stock: lowStockOnly || undefined,
    out_of_stock: outOfStockOnly || undefined,
  });

  const { data: categories } = useCategories();

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleCreate = async (formData: ProductFormData) => {
    setError('');
    try {
      await productsApi.create(formData);
      setShowCreate(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const handleUpdate = async (formData: ProductFormData) => {
    if (!editProduct) return;
    setError('');
    try {
      await productsApi.update(editProduct.id, formData);
      setEditProduct(null);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      await productsApi.delete(deleteProduct.id);
      setDeleteProduct(null);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleMovement = async (data: StockMovementFormData) => {
    setError('');
    try {
      await movementsApi.create(data);
      setMoveProduct(null);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record movement');
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-paper">Products</h1>
          <p className="text-ash text-sm mt-1 font-mono">{data?.total ?? 0} items total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded font-mono">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={14} className="text-ash flex-shrink-0" />
          <input
            value={search} onChange={handleSearch}
            className="input py-1.5 text-xs" placeholder="Search name, SKU, description..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-ash" />
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="input py-1.5 text-xs w-36">
            <option value="">All categories</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input py-1.5 text-xs w-32">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => { setLowStockOnly(!lowStockOnly); setOutOfStockOnly(false); setPage(1); }}
            className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${lowStockOnly ? 'bg-warn' : 'bg-ink-muted border border-ash-dim/40'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-paper mt-0.5 transition-transform ${lowStockOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-ash text-xs font-mono">Low stock only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => { setOutOfStockOnly(!outOfStockOnly); setLowStockOnly(false); setPage(1); }}
            className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${outOfStockOnly ? 'bg-danger' : 'bg-ink-muted border border-ash-dim/40'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-paper mt-0.5 transition-transform ${outOfStockOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-ash text-xs font-mono">Out of stock only</span>
        </label>
      </div>

      {/* Table */}
      <div className="card p-5">
        {data?.data.length === 0 && !loading ? (
          <EmptyState icon={<Package size={40} />} message="No products found. Add your first product!" />
        ) : (
          <>
            <Table headers={['Product', 'SKU', 'Category', 'Quantity', 'Price', 'Status', 'Actions']}
                   empty={!loading && data?.data.length === 0}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                : data?.data.map(p => (
                  <Tr key={p.id}>
                    <Td>
                      <div>
                        <p className="text-paper text-sm font-medium">{p.name}</p>
                        {p.description && <p className="text-ash text-xs mt-0.5 truncate max-w-48">{p.description}</p>}
                      </div>
                    </Td>
                    <Td><span className="font-mono text-ash-light text-xs">{p.sku}</span></Td>
                    <Td><span className="text-ash text-xs">{p.category_name ?? '—'}</span></Td>
                    <Td>
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-mono font-semibold text-sm ${p.quantity === 0 ? 'text-danger' : p.quantity <= p.min_quantity ? 'text-warn' : 'text-paper'}`}>
                          {p.quantity} <span className="text-ash font-normal text-xs">{p.unit}</span>
                        </span>
                        <StockBadge quantity={p.quantity} minQuantity={p.min_quantity} />
                      </div>
                    </Td>
                    <Td><span className="font-mono text-paper text-sm">{fmt(p.price)}</span></Td>
                    <Td><StatusBadge status={p.status} /></Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setMoveProduct(p)} title="Stock movement"
                          className="p-1.5 text-ash hover:text-accent hover:bg-accent/10 rounded transition-colors">
                          <ArrowLeftRight size={13} />
                        </button>
                        <button onClick={() => setEditProduct(p)} title="Edit"
                          className="p-1.5 text-ash hover:text-paper hover:bg-ink-muted rounded transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteProduct(p)} title="Delete"
                          className="p-1.5 text-ash hover:text-danger hover:bg-danger/10 rounded transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))
              }
            </Table>
            <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
          </>
        )}
      </div>

      {/* Modals */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Product">
        <ProductForm categories={categories ?? []} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product">
        {editProduct && (
          <ProductForm product={editProduct} categories={categories ?? []} onSubmit={handleUpdate} onCancel={() => setEditProduct(null)} />
        )}
      </Modal>

      <Modal open={!!moveProduct} onClose={() => setMoveProduct(null)} title="Record Stock Movement">
        {moveProduct && (
          <StockMovementForm products={data?.data ?? []} defaultProductId={moveProduct.id} onSubmit={handleMovement} onCancel={() => setMoveProduct(null)} />
        )}
      </Modal>

      <Modal open={!!deleteProduct} onClose={() => setDeleteProduct(null)} title="Delete Product">
        <div className="space-y-4">
          <p className="text-ash text-sm">
            Are you sure you want to delete <span className="text-paper font-semibold">{deleteProduct?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteProduct(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
