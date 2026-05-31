import { Package, AlertTriangle, TrendingDown, DollarSign, Tags, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStats, useProducts, useMovements } from '../hooks/useData';
import { StatCard, Table, Tr, Td, StockBadge, SkeletonRow } from '../components/ui';
import { formatDistanceToNow } from 'date-fns';

export function Dashboard() {
  const { data: stats, loading: statsLoading } = useStats();
  const { data: lowStock, loading: lowLoading } = useProducts({ low_stock: true, limit: 5 });
  const { data: movements } = useMovements({ limit: 5 });

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-paper">Dashboard</h1>
        <p className="text-ash text-sm mt-1 font-mono">Inventory overview & alerts</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5"><div className="skeleton h-4 w-20 mb-2" /><div className="skeleton h-7 w-12" /></div>
          ))
        ) : stats ? (
          <>
            <StatCard label="Products" value={stats.totalProducts} sub="active items" accent />
            <StatCard label="Low Stock" value={stats.lowStock} sub="need attention" />
            <StatCard label="Out of Stock" value={stats.outOfStock} sub="zero quantity" />
            <StatCard label="Total Value" value={fmt(stats.totalValue)} sub="inventory worth" />
            <StatCard label="Categories" value={stats.totalCategories} sub="product groups" />
          </>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-warn" />
              <h2 className="font-display font-semibold text-paper text-sm">Low Stock Alerts</h2>
            </div>
            <Link to="/products?low_stock=true" className="text-accent text-xs font-mono flex items-center gap-1 hover:underline">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <Table headers={['Product', 'SKU', 'Qty', 'Status']} empty={!lowLoading && lowStock?.data.length === 0}>
            {lowLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
              : lowStock?.data.map(p => (
                <Tr key={p.id}>
                  <Td><span className="text-paper text-xs font-medium">{p.name}</span></Td>
                  <Td><span className="font-mono text-ash text-xs">{p.sku}</span></Td>
                  <Td>
                    <span className={`font-mono font-semibold text-xs ${p.quantity === 0 ? 'text-danger' : 'text-warn'}`}>
                      {p.quantity}
                    </span>
                    <span className="text-ash text-xs"> / {p.min_quantity}</span>
                  </Td>
                  <Td><StockBadge quantity={p.quantity} minQuantity={p.min_quantity} /></Td>
                </Tr>
              ))
            }
          </Table>
        </div>

        {/* Recent movements */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown size={15} className="text-accent" />
              <h2 className="font-display font-semibold text-paper text-sm">Recent Movements</h2>
            </div>
            <Link to="/movements" className="text-accent text-xs font-mono flex items-center gap-1 hover:underline">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {movements?.data.length === 0 ? (
            <p className="text-ash text-sm font-mono py-8 text-center">No movements yet</p>
          ) : (
            <div className="space-y-2">
              {movements?.data.slice(0, 6).map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-ink-muted/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      m.type === 'in' ? 'bg-success/15 text-success' :
                      m.type === 'out' ? 'bg-danger/15 text-danger' :
                      'bg-accent/15 text-accent'
                    }`}>
                      {m.type.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-paper text-xs font-medium">{m.product_name}</p>
                      <p className="text-ash text-[10px] font-mono">{m.product_sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-paper font-mono font-semibold text-sm">{m.type === 'out' ? '-' : '+'}{m.quantity}</p>
                    <p className="text-ash text-[10px] font-mono">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: '/products', icon: Package, label: 'Manage Products', desc: 'Add, edit, remove items' },
          { to: '/categories', icon: Tags, label: 'Categories', desc: 'Organize product groups' },
          { to: '/movements', icon: TrendingDown, label: 'Stock Log', desc: 'Track all movements' },
          { to: '/products', icon: DollarSign, label: 'Stock Value', desc: 'Monitor inventory worth' },
        ].map(({ to, icon: Icon, label, desc }) => (
          <Link key={label} to={to} className="card p-4 hover:border-accent/30 hover:bg-accent/5 transition-all group">
            <Icon size={18} className="text-ash group-hover:text-accent transition-colors mb-2" />
            <p className="text-paper text-sm font-display font-semibold">{label}</p>
            <p className="text-ash text-xs mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
