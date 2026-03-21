import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import './Integracoes.css';

interface MetaStatus {
  connected: boolean;
  adAccountId: string | null;
  expiresAt: string | null;
}

interface AdAccount {
  id: string;
  name: string;
}

export default function Integracoes() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchStatus();

    if (searchParams.get('meta_connected') === '1') {
      showToast('Meta Ads conectado com sucesso!');
      setSearchParams({});
    }
    if (searchParams.get('meta_error')) {
      showToast(`Erro: ${searchParams.get('meta_error')}`);
      setSearchParams({});
    }
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/meta/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStatus(data);
      if (data.connected) fetchAdAccounts();
    } finally {
      setLoadingStatus(false);
    }
  }

  async function fetchAdAccounts() {
    setLoadingAccounts(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/meta/ad-accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAdAccounts(data);
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function handleConnect() {
    setConnectLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/meta/connect', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setConnectLoading(false);
    }
  }

  async function handleDisconnect() {
    setDisconnectLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/meta/disconnect', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus({ connected: false, adAccountId: null, expiresAt: null });
      setAdAccounts([]);
      showToast('Meta Ads desconectado.');
    } finally {
      setDisconnectLoading(false);
    }
  }

  async function handleSelectAccount(id: string) {
    setSavingAccount(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/meta/ad-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adAccountId: id }),
      });
      setStatus(prev => prev ? { ...prev, adAccountId: id } : prev);
      showToast('Conta de anúncio salva!');
    } finally {
      setSavingAccount(false);
    }
  }

  return (
    <Layout>
      <div className="integracoes">
        <div className="page-header">
          <div>
            <h1>Integrações</h1>
            <p className="page-subtitle">Conecte suas plataformas de anúncios</p>
          </div>
        </div>

        {toast && <div className="toast">{toast}</div>}

        <div className="integrations-grid">
          <div className="integration-card">
            <div className="integration-header">
              <div className="integration-logo meta-logo">f</div>
              <div>
                <h3>Meta Ads</h3>
                <p className="integration-desc">Facebook e Instagram Ads</p>
              </div>
              <div className={`integration-badge ${status?.connected ? 'connected' : 'disconnected'}`}>
                {loadingStatus ? '...' : status?.connected ? 'Conectado' : 'Desconectado'}
              </div>
            </div>

            {!loadingStatus && !status?.connected && (
              <button
                className={`btn-connect ${connectLoading ? 'loading' : ''}`}
                onClick={handleConnect}
                disabled={connectLoading}
              >
                {connectLoading ? 'Redirecionando...' : 'Conectar com Meta'}
              </button>
            )}

            {!loadingStatus && status?.connected && (
              <div className="integration-details">
                {status.expiresAt && (
                  <p className="token-expiry">
                    Token expira em: {new Date(status.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                )}

                <div className="ad-accounts-section">
                  <label>Conta de anúncio ativa</label>
                  {loadingAccounts ? (
                    <p className="loading-text">Carregando contas...</p>
                  ) : adAccounts.length === 0 ? (
                    <p className="loading-text">Nenhuma conta encontrada.</p>
                  ) : (
                    <div className="ad-accounts-list">
                      {adAccounts.map(acc => (
                        <button
                          key={acc.id}
                          className={`ad-account-item ${status.adAccountId === acc.id ? 'selected' : ''}`}
                          onClick={() => handleSelectAccount(acc.id)}
                          disabled={savingAccount}
                        >
                          <span className="account-name">{acc.name}</span>
                          <span className="account-id">{acc.id}</span>
                          {status.adAccountId === acc.id && <span className="account-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className={`btn-disconnect ${disconnectLoading ? 'loading' : ''}`}
                  onClick={handleDisconnect}
                  disabled={disconnectLoading}
                >
                  {disconnectLoading ? 'Desconectando...' : 'Desconectar'}
                </button>
              </div>
            )}
          </div>

          <div className="integration-card coming-soon">
            <div className="integration-header">
              <div className="integration-logo google-logo">G</div>
              <div>
                <h3>Google Ads</h3>
                <p className="integration-desc">Search, Display e YouTube</p>
              </div>
              <div className="integration-badge soon">Em breve</div>
            </div>
          </div>

          <div className="integration-card coming-soon">
            <div className="integration-header">
              <div className="integration-logo tiktok-logo">T</div>
              <div>
                <h3>TikTok Ads</h3>
                <p className="integration-desc">TikTok for Business</p>
              </div>
              <div className="integration-badge soon">Em breve</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
