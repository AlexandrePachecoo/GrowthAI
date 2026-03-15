import { useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css';

const titles: Record<string, { icon: string; label: string }> = {
  '/dashboard': { icon: '▦', label: 'Dashboard' },
  '/criativos': { icon: '✦', label: 'Criativos' },
  '/campanhas': { icon: '◈', label: 'Campanhas' },
  '/gerenciamento': { icon: '⚙', label: 'Gerenciamento' },
};

export default function Layout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const page = titles[location.pathname] ?? { icon: '▦', label: 'Dashboard' };

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`layout-main ${collapsed ? 'expanded' : ''}`}>
        <div className="topbar">
          <div className="topbar-title">
            <span>{page.icon}</span>
            {page.label}
          </div>
          <div className="topbar-actions">
            <button className="topbar-icon">?</button>
            <button className="topbar-icon">🔔</button>
            <div className="topbar-avatar">JD</div>
          </div>
        </div>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
