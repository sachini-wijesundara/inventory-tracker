import { useState } from 'react';
import { Plus, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from 'lucide-react';
import { useMovements, useProducts } from '../hooks/useData';
import { movementsApi } from '../services/api';
import { Modal, Table, Tr, Td, SkeletonRow, Pagination } from '../components/ui';
import { StockMovementForm } from '../components/StockMovementForm';
import type { StockMovementFormData } from '../types';
import { formatDistanceToNow } from 'date-fns';

export function Movements() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  const { data, loading, refetch } = useMovements({ page });
  const { data: productsData } = useProducts({ limit: 200 });

  const handleCreate = async (formData: StockMovementFormData) => {
    setError('');
    try {
      await movementsApi.create(formData);
      setShowCreate(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const typeIcon = (type: string) => {
    if (type === 'in') return <ArrowDownToLine size={12} className="text-success" />;
    if (type === 'out') return <ArrowUpFromLine size={12} className="text-danger" />;
    return <SlidersHorizontal size={12} className="text-accent" />;
  };

  const typeBg: Record<string, string> = {
    in: 'bg-success/15 text-success border-success/20',
    out: 'bg-danger/15 text-danger border-danger/20',
    adjustment: 'bg-accent/15 text-accent border-accent/20',
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-paper">Stock Log</h1>
          <p className="text-ash text-sm mt-1 font-mono">{data?.total ?? 0} movements total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Record Movement
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded font-mono">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {(['in', 'out', 'adjustment'] as const).map(type => {
          const count = data?.data.filter(m => m.type === type).length ?? 0;
          return (
            <div key={type} className={`card p-4 border ${typeBg[type]}`}>
              <div className="flex items-center gap-2 mb-1">
                {typeIcon(type)}
                <span className={`text-xs font-display font-semibold uppercase tracking-widest ${typeBg[type].split(' ')[1]}`}>{type}</span>
              </div>
              <p className="font-display font-bold text-xl text-paper">{count}</p>
              <p className="text-ash text-xs font-mono">on this page</p>
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <Table headers={['Type', 'Product', 'SKU', 'Qty Change', 'Note', 'Time']}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            : data?.data.map(m => (
              <Tr key={m.id}>
                <Td>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono font-semibold ${typeBg[m.type]}`}>
                    {typeIcon(m.type)}
                    {m.type.toUpperCase()}
                  </div>
                </Td>
                <Td><span className="text-paper text-sm">{m.product_name}</span></Td>
                <Td><span className="font-mono text-ash text-xs">{m.product_sku}</span></Td>
                <Td>
                  <span className={`font-mono font-bold text-sm ${
                    m.type === 'in' ? 'text-success' : m.type === 'out' ? 'text-danger' : 'text-accent'
                  }`}>
                    {m.type === 'out' ? '−' : m.type === 'in' ? '+' : '='}{m.quantity}
                  </span>
                </Td>
                <Td><span className="text-ash text-xs">{m.note ?? '—'}</span></Td>
                <Td>
                  <span className="text-ash text-xs font-mono" title={new Date(m.created_at).toLocaleString()}>
                    {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                  </span>
                </Td>
              </Tr>
            ))
          }
        </Table>
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Record Stock Movement">
        <StockMovementForm
          products={productsData?.data ?? []}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
