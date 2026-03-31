import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCampaign } from '../contexts/CampaignContext';
import { useUser } from '../contexts/UserContext';
import ProfileModal from './ProfileModal';
import './Sidebar.css';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '▦' },
  { label: 'Criativos', path: '/criativos', icon: '✦' },
  { label: 'Campanhas', path: '/campanhas', icon: '◈' },
  { label: 'Integrações', path: '/integracoes', icon: '⇌' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { campaigns, selectedCampaign, setSelectedCampaign } = useCampaign();
  const { profile } = useUser();

  const displayName = profile?.name ?? 'Usuário';
  const initials = getInitials(displayName);

  function selectCampaign(c: typeof campaigns[0]) {
    setSelectedCampaign(c);
    setOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  function openModal() {
    setProfileOpen(false);
    setModalOpen(true);
  }

  // Fecha popup ao clicar fora
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <>
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
          <div className="campaign-selector" onClick={() => setOpen(o => !o)}>
            <span className="cs-name">
              {selectedCampaign ? selectedCampaign.name : 'Selecionar campanha'}
            </span>
            <span className="cs-arrow">{open ? '▴' : '▾'}</span>

            {open && campaigns.length > 0 && (
              <div className="cs-dropdown" onClick={e => e.stopPropagation()}>
                {campaigns.map(c => (
                  <button
                    key={c.id}
                    className={`cs-option ${selectedCampaign?.id === c.id ? 'active' : ''}`}
                    onClick={() => selectCampaign(c)}
                  >
                    <span className="cs-dot" />
                    <span className="cs-option-name">{c.name}</span>
                    {c.platforms.length > 0 && (
                      <span className="cs-platforms">{c.platforms.join(', ')}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {open && campaigns.length === 0 && (
              <div className="cs-dropdown cs-empty">
                <span>Nenhuma campanha criada</span>
              </div>
            )}
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

        {/* Área do usuário */}
        <div className="sidebar-user-wrap" ref={profileRef}>
          {profileOpen && !collapsed && (
            <div className="profile-popup">
              <div className="profile-popup-header">
                <div className="profile-popup-avatar">{initials}</div>
                <div className="profile-popup-info">
                  <p className="profile-popup-name">{displayName}</p>
                  <p className="profile-popup-email">{profile?.email ?? ''}</p>
                </div>
              </div>
              <div className="profile-popup-divider" />
              <button className="profile-popup-action" onClick={openModal}>
                <span>✎</span> Editar perfil
              </button>
              <div className="profile-popup-divider" />
              <button className="profile-popup-action profile-logout" onClick={handleLogout}>
                <span>⎋</span> Sair
              </button>
            </div>
          )}

          <div
            className="sidebar-user"
            onClick={() => setProfileOpen(o => !o)}
            title={collapsed ? displayName : undefined}
          >
            <div className="user-avatar">{initials}</div>
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-role">Conta</span>
              </div>
            )}
            {!collapsed && (
              <span className="user-chevron">{profileOpen ? '▴' : '▾'}</span>
            )}
          </div>
        </div>
      </aside>

      {modalOpen && <ProfileModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
