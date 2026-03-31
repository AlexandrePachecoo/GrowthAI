import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import './ProfileModal.css';

interface Props {
  onClose: () => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

type Status = { type: 'success' | 'error'; msg: string } | null;

export default function ProfileModal({ onClose }: Props) {
  const { profile, setProfile } = useUser();

  const [name, setName] = useState(profile?.name ?? '');
  const [nameStatus, setNameStatus] = useState<Status>(null);
  const [nameSaving, setNameSaving] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<Status>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const [passStatus, setPassStatus] = useState<Status>(null);
  const [passSaving, setPassSaving] = useState(false);

  // Fechar com Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSaveName() {
    if (!name.trim()) { setNameStatus({ type: 'error', msg: 'Digite um nome.' }); return; }
    setNameSaving(true);
    setNameStatus(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/profile/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar');
      setProfile(data);
      setNameStatus({ type: 'success', msg: 'Nome atualizado com sucesso.' });
    } catch (err: unknown) {
      setNameStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Erro ao salvar' });
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangeEmail() {
    if (!newEmail.trim()) { setEmailStatus({ type: 'error', msg: 'Digite o novo e-mail.' }); return; }
    setEmailSaving(true);
    setEmailStatus(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/profile/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao solicitar alteração');
      setEmailStatus({ type: 'success', msg: 'E-mail de confirmação enviado. Verifique sua caixa de entrada.' });
      setNewEmail('');
    } catch (err: unknown) {
      setEmailStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Erro ao solicitar alteração' });
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleResetPassword() {
    setPassSaving(true);
    setPassStatus(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/profile/change-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar e-mail');
      setPassStatus({ type: 'success', msg: 'Link de redefinição enviado. Verifique seu e-mail.' });
    } catch (err: unknown) {
      setPassStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Erro ao enviar e-mail' });
    } finally {
      setPassSaving(false);
    }
  }

  const displayName = profile?.name ?? 'Usuário';
  const initials = getInitials(displayName);

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-card" onClick={e => e.stopPropagation()}>

        <button className="pm-close" onClick={onClose}>✕</button>

        {/* Cabeçalho */}
        <div className="pm-header">
          <div className="pm-avatar">{initials}</div>
          <div>
            <h2 className="pm-title">{displayName}</h2>
            <p className="pm-subtitle">{profile?.email ?? ''}</p>
          </div>
        </div>

        <div className="pm-divider" />

        {/* Nome */}
        <div className="pm-section">
          <h3 className="pm-section-title">Nome</h3>
          <div className="pm-row">
            <input
              className="pm-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome completo"
            />
            <button
              className="pm-btn pm-btn-primary"
              onClick={handleSaveName}
              disabled={nameSaving}
            >
              {nameSaving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
          {nameStatus && (
            <p className={`pm-status ${nameStatus.type}`}>{nameStatus.msg}</p>
          )}
        </div>

        <div className="pm-divider" />

        {/* E-mail */}
        <div className="pm-section">
          <h3 className="pm-section-title">Alterar e-mail</h3>
          <p className="pm-hint">
            E-mail atual: <strong>{profile?.email ?? '—'}</strong>
          </p>
          <div className="pm-row">
            <input
              className="pm-input"
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Novo e-mail"
            />
            <button
              className="pm-btn pm-btn-primary"
              onClick={handleChangeEmail}
              disabled={emailSaving}
            >
              {emailSaving ? 'Enviando…' : 'Confirmar'}
            </button>
          </div>
          {emailStatus && (
            <p className={`pm-status ${emailStatus.type}`}>{emailStatus.msg}</p>
          )}
        </div>

        <div className="pm-divider" />

        {/* Senha */}
        <div className="pm-section">
          <h3 className="pm-section-title">Senha</h3>
          <p className="pm-hint">
            Um link de redefinição será enviado para <strong>{profile?.email ?? 'seu e-mail'}</strong>.
          </p>
          <button
            className="pm-btn pm-btn-outline"
            onClick={handleResetPassword}
            disabled={passSaving}
          >
            {passSaving ? 'Enviando…' : 'Enviar link de redefinição'}
          </button>
          {passStatus && (
            <p className={`pm-status ${passStatus.type}`}>{passStatus.msg}</p>
          )}
        </div>

      </div>
    </div>
  );
}
