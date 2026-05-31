import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Product, StockMovementFormData } from '../types';

const schema = z.object({
  product_id: z.string().min(1, 'Select a product'),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  note: z.string().optional(),
});

interface Props {
  products: Product[];
  defaultProductId?: string;
  onSubmit: (data: StockMovementFormData) => Promise<void>;
  onCancel: () => void;
}

export function StockMovementForm({ products, defaultProductId, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<StockMovementFormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'in', product_id: defaultProductId ?? '' },
  });

  const type = watch('type');
  const productId = watch('product_id');
  const selectedProduct = products.find(p => p.id === productId);

  const typeColors: Record<string, string> = {
    in: 'border-success/40 bg-success/5',
    out: 'border-danger/40 bg-danger/5',
    adjustment: 'border-accent/40 bg-accent/5',
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Product *</label>
        <select {...register('product_id')} className="input">
          <option value="">— Select product —</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {p.quantity} {p.unit}</option>
          ))}
        </select>
        {errors.product_id && <p className="text-danger text-xs mt-1">{errors.product_id.message}</p>}
      </div>

      {selectedProduct && (
        <div className="bg-ink-muted rounded p-3 text-xs font-mono">
          <span className="text-ash">Current stock: </span>
          <span className={`font-semibold ${selectedProduct.quantity === 0 ? 'text-danger' : selectedProduct.quantity <= selectedProduct.min_quantity ? 'text-warn' : 'text-success'}`}>
            {selectedProduct.quantity} {selectedProduct.unit}
          </span>
          <span className="text-ash"> (min: {selectedProduct.min_quantity})</span>
        </div>
      )}

      <div>
        <label className="label">Movement Type *</label>
        <div className="grid grid-cols-3 gap-2">
          {(['in', 'out', 'adjustment'] as const).map(t => (
            <label key={t} className={`flex items-center gap-2 p-3 rounded border cursor-pointer transition-all ${
              type === t ? typeColors[t] : 'border-ash-dim/30 hover:border-ash-dim/60'
            }`}>
              <input type="radio" {...register('type')} value={t} className="hidden" />
              <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                type === t ? (t === 'in' ? 'border-success bg-success' : t === 'out' ? 'border-danger bg-danger' : 'border-accent bg-accent') : 'border-ash-dim'
              }`} />
              <span className={`text-xs font-display font-semibold uppercase ${
                type === t ? (t === 'in' ? 'text-success' : t === 'out' ? 'text-danger' : 'text-accent') : 'text-ash'
              }`}>{t}</span>
            </label>
          ))}
        </div>
        <p className="text-ash text-xs mt-1 font-mono">
          {type === 'in' && '+ Adds to current stock'}
          {type === 'out' && '– Removes from current stock'}
          {type === 'adjustment' && '= Sets exact quantity'}
        </p>
      </div>

      <div>
        <label className="label">Quantity *</label>
        <input {...register('quantity')} type="number" min="1" className="input" placeholder="0" />
        {errors.quantity && <p className="text-danger text-xs mt-1">{errors.quantity.message}</p>}
      </div>

      <div>
        <label className="label">Note</label>
        <input {...register('note')} className="input" placeholder="e.g. Purchase order #1234, damaged goods..." />
      </div>

      <div className="flex gap-3 pt-2 border-t border-ink-muted">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
          {isSubmitting ? 'Saving...' : 'Record Movement'}
        </button>
      </div>
    </form>
  );
}
