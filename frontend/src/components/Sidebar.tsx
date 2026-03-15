import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '▦' },
  { label: 'Criativos', path: '/criativos', icon: '✦' },
  { label: 'Campanhas', path: '/campanhas', icon: '◈' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        {!collapsed && (
          <div className="sidebar-logo">
            <span className="logo-icon">✦</span>
            <span>growthAi</span>
          </div>
        )}
        <button className="toggle-btn" onClick={onToggle}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {!collapsed && (
        <div className="workspace">
          GrowthAi <span>▾</span>
        </div>
      )}

      <nav>
        {!collapsed && <p className="nav-label">Menu</p>}
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && item.label}
          </NavLink>
        ))}

        {!collapsed && <p className="nav-label">Configurar</p>}
        <NavLink
          to="/gerenciamento"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title={collapsed ? 'Gerenciamento' : undefined}
        >
          <span className="nav-icon">⚙</span>
          {!collapsed && 'Gerenciamento'}
        </NavLink>
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">JD</div>
        {!collapsed && <span>João Dias</span>}
      </div>
    </aside>
  );
}
