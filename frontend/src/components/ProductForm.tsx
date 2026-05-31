import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Product, Category, ProductFormData } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Must be >= 0'),
  min_quantity: z.coerce.number().min(0, 'Must be >= 0'),
  price: z.coerce.number().min(0, 'Must be >= 0'),
  unit: z.string().min(1, 'Unit is required'),
  status: z.enum(['active', 'inactive', 'discontinued']),
});

interface Props {
  product?: Product;
  categories: Category[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, categories, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name: product.name, sku: product.sku, description: product.description,
      category_id: product.category_id, quantity: product.quantity,
      min_quantity: product.min_quantity, price: product.price,
      unit: product.unit, status: product.status,
    } : { status: 'active', unit: 'pcs', quantity: 0, min_quantity: 0, price: 0 }
  });

  const field = (name: keyof ProductFormData) => errors[name]?.message as string | undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Product Name *</label>
          <input {...register('name')} className="input" placeholder="e.g. USB-C Hub" />
          {field('name') && <p className="text-danger text-xs mt-1">{field('name')}</p>}
        </div>
        <div>
          <label className="label">SKU *</label>
          <input {...register('sku')} className="input font-mono" placeholder="e.g. ELEC-001" />
          {field('sku') && <p className="text-danger text-xs mt-1">{field('sku')}</p>}
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea {...register('description')} className="input resize-none" rows={2} placeholder="Optional description..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select {...register('category_id')} className="input">
            <option value="">— None —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Quantity *</label>
          <input {...register('quantity')} type="number" min="0" className="input" />
          {field('quantity') && <p className="text-danger text-xs mt-1">{field('quantity')}</p>}
        </div>
        <div>
          <label className="label">Min Qty</label>
          <input {...register('min_quantity')} type="number" min="0" className="input" />
        </div>
        <div>
          <label className="label">Unit</label>
          <select {...register('unit')} className="input">
            {['pcs', 'kg', 'g', 'l', 'ml', 'box', 'ream', 'set', 'pair', 'roll'].map(u =>
              <option key={u} value={u}>{u}</option>
            )}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Price (USD) *</label>
        <input {...register('price')} type="number" min="0" step="0.01" className="input" placeholder="0.00" />
        {field('price') && <p className="text-danger text-xs mt-1">{field('price')}</p>}
      </div>

      <div className="flex gap-3 pt-2 border-t border-ink-muted">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
          {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
