import { useState } from 'react';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { useCategories } from '../hooks/useData';
import { categoriesApi } from '../services/api';
import { Modal, Table, Tr, Td, EmptyState } from '../components/ui';
import type { Category } from '../types';

export function Categories() {
  const { data: categories, loading, refetch } = useCategories();
  const [showCreate, setShowCreate] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const resetForm = () => { setName(''); setDesc(''); };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      await categoriesApi.create({ name, description: desc });
      setShowCreate(false);
      resetForm();
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleUpdate = async () => {
    if (!editCat) return;
    setError('');
    try {
      await categoriesApi.update(editCat.id, { name, description: desc });
      setEditCat(null);
      resetForm();
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteCat) return;
    try {
      await categoriesApi.delete(deleteCat.id);
      setDeleteCat(null);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const openEdit = (cat: Category) => {
    setName(cat.name);
    setDesc(cat.description ?? '');
    setEditCat(cat);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-paper">Categories</h1>
          <p className="text-ash text-sm mt-1 font-mono">{categories?.length ?? 0} groups</p>
        </div>
        <button onClick={() => { resetForm(); setShowCreate(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Add Category
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded font-mono">
          {error}
        </div>
      )}

      <div className="card p-5">
        {!loading && categories?.length === 0 ? (
          <EmptyState icon={<Tags size={40} />} message="No categories yet. Create one to organize products." />
        ) : (
          <Table headers={['Name', 'Description', 'Products', 'Created', 'Actions']}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Td key={j}><div className="skeleton h-4 w-full" /></Td>
                  ))}
                </Tr>
              ))
            ) : categories?.map(cat => (
              <Tr key={cat.id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                      <Tags size={11} className="text-accent" />
                    </div>
                    <span className="text-paper font-medium text-sm">{cat.name}</span>
                  </div>
                </Td>
                <Td><span className="text-ash text-xs">{cat.description ?? '—'}</span></Td>
                <Td>
                  <span className="font-mono text-sm text-paper">{(cat as Category & { product_count?: number }).product_count ?? 0}</span>
                  <span className="text-ash text-xs"> items</span>
                </Td>
                <Td><span className="text-ash text-xs font-mono">{new Date(cat.created_at).toLocaleDateString()}</span></Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(cat)}
                      className="p-1.5 text-ash hover:text-paper hover:bg-ink-muted rounded transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteCat(cat)}
                      className="p-1.5 text-ash hover:text-danger hover:bg-danger/10 rounded transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showCreate || !!editCat} onClose={() => { setShowCreate(false); setEditCat(null); resetForm(); }}
             title={editCat ? 'Edit Category' : 'New Category'}>
        <div className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="e.g. Electronics" />
          </div>
          <div>
            <label className="label">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className="input" placeholder="Optional description..." />
          </div>
          <div className="flex gap-3 pt-2 border-t border-ink-muted">
            <button onClick={() => { setShowCreate(false); setEditCat(null); resetForm(); }} className="btn-ghost flex-1">Cancel</button>
            <button onClick={editCat ? handleUpdate : handleCreate} className="btn-primary flex-1">
              {editCat ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteCat} onClose={() => setDeleteCat(null)} title="Delete Category">
        <div className="space-y-4">
          <p className="text-ash text-sm">
            Delete <span className="text-paper font-semibold">{deleteCat?.name}</span>?
            Products in this category will be unassigned.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteCat(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
