import { Outlet, NavLink } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';

const navItems = [
  { to: '/', label: 'Feed', icon: '📱' },
  { to: '/create', label: 'Create', icon: '✨' },
  { to: '/analytics', label: 'Insights', icon: '📊' },
  { to: '/subscription', label: 'Plan', icon: '⭐' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Layout() {
  useTelegram();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <main style={{ flex: 1, padding: '16px', paddingBottom: '80px' }}>
        <Outlet />
      </main>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          zIndex: 100,
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              fontSize: '10px',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '4px 12px',
              borderRadius: '8px',
              background: isActive ? 'var(--bg-card)' : 'transparent',
            })}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
