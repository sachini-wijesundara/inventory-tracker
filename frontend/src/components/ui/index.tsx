import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

// Modal
export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ink-soft border border-ink-muted rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-muted">
          <h2 className="font-display font-bold text-paper text-base">{title}</h2>
          <button onClick={onClose} className="text-ash hover:text-paper transition-colors text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// Stat card
export function StatCard({ label, value, sub, accent, to }: {
  label: string; value: string | number; sub?: string; accent?: boolean; to?: string;
}) {
  const content = (
    <>
      <p className="text-ash text-xs font-display font-semibold uppercase tracking-widest mb-1">{label}</p>
      <p className={clsx('font-display font-bold text-2xl', accent ? 'text-accent' : 'text-paper')}>{value}</p>
      {sub && <p className="text-ash text-xs mt-1 font-mono">{sub}</p>}
    </>
  );

  const className = clsx(
    'card p-5 animate-fade-up block',
    accent && 'border-accent/30 bg-accent/5',
    to && 'hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer group'
  );

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }
  return <div className={className}>{content}</div>;
}

// Table
export function Table({ headers, children, empty }: {
  headers: string[]; children: ReactNode; empty?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-muted">
            {headers.map(h => (
              <th key={h} className="text-left text-ash text-xs font-display font-semibold uppercase tracking-widest py-3 px-4 first:pl-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={headers.length} className="py-12 text-center text-ash font-mono text-sm">
                No records found
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

// Table row
export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={clsx('border-b border-ink-muted/50 hover:bg-ink-muted/30 transition-colors', className)}>
      {children}
    </tr>
  );
}

// Table cell
export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={clsx('py-3 px-4 first:pl-0', className)}>{children}</td>;
}

// Stock badge
export function StockBadge({ quantity, minQuantity }: { quantity: number; minQuantity: number }) {
  if (quantity === 0) return <span className="badge-out">Out of stock</span>;
  if (quantity <= minQuantity) return <span className="badge-low">Low stock</span>;
  return <span className="badge-active">In stock</span>;
}

// Status badge
export function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    active: 'badge-active',
    inactive: 'badge-inactive',
    discontinued: 'badge-discontinued',
  };
  return <span className={cls[status] || 'badge-inactive'}>{status}</span>;
}

// Skeleton loader
export function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-ink-muted/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4 first:pl-0">
          <div className="skeleton h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Pagination
export function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2 mt-4 justify-end">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30">← Prev</button>
      <span className="text-ash font-mono text-xs">{page} / {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30">Next →</button>
    </div>
  );
}

// Empty state
export function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-ash/40 mb-3">{icon}</div>
      <p className="text-ash font-mono text-sm">{message}</p>
    </div>
  );
}
