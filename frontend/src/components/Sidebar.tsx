import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ArrowLeftRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/categories', icon: Tags, label: 'Categories' },
  { to: '/movements', icon: ArrowLeftRight, label: 'Stock Log' },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-ink-soft border border-ink-muted p-2 rounded"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} className="text-paper" /> : <Menu size={18} className="text-paper" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-56 bg-ink-soft border-r border-ink-muted z-40',
        'flex flex-col transition-transform duration-200',
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="px-5 py-6 border-b border-ink-muted">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent rounded flex items-center justify-center">
              <Package size={14} className="text-ink" />
            </div>
            <span className="font-display font-bold text-paper text-base tracking-tight">Stockwise</span>
          </div>
          <p className="text-ash text-xs mt-1.5 font-mono">Inventory Manager</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2">
          <p className="text-ash text-[10px] font-display font-semibold uppercase tracking-widest px-3 mb-2">Navigation</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 mb-0.5',
                isActive
                  ? 'bg-accent/10 text-accent font-medium border border-accent/20'
                  : 'text-ash-light hover:bg-ink-muted hover:text-paper'
              )}
            >
              <Icon size={15} />
              <span className="font-sans">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-ink-muted">
          <p className="text-ash text-[11px] font-mono">v1.0.0 • Built with NestJS + React</p>
        </div>
      </aside>
    </>
  );
}
