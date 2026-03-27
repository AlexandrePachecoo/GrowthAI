import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import './Integracoes.css';

interface MetaStatus {
  connected: boolean;
  adAccountId: string | null;
  expiresAt: string | null;
}

interface GoogleStatus {
  connected: boolean;
  customerId: string | null;
}

interface AdAccount {
  id: string;
  name: string;
}

export default function Integracoes() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Meta state
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [metaLoadingStatus, setMetaLoadingStatus] = useState(true);
  const [metaLoadingAccounts, setMetaLoadingAccounts] = useState(false);
  const [metaConnectLoading, setMetaConnectLoading] = useState(false);
  const [metaDisconnectLoading, setMetaDisconnectLoading] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  // Google state
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [googleCustomers, setGoogleCustomers] = useState<AdAccount[]>([]);
  const [googleLoadingStatus, setGoogleLoadingStatus] = useState(true);
  const [googleLoadingCustomers, setGoogleLoadingCustomers] = useState(false);
  const [googleConnectLoading, setGoogleConnectLoading] = useState(false);
  const [googleDisconnectLoading, setGoogleDisconnectLoading] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchMetaStatus();
    fetchGoogleStatus();

    if (searchParams.get('meta_connected') === '1') {
      showToast('Meta Ads conectado com sucesso!');
      setSearchParams({});
    }
    if (searchParams.get('meta_error')) {
      showToast(`Erro Meta: ${searchParams.get('meta_error')}`);
      setSearchParams({});
    }
    if (searchParams.get('google_connected') === '1') {
      showToast('Google Ads conectado com sucesso!');
      setSearchParams({});
    }
    if (searchParams.get('google_error')) {
      showToast(`Erro Google: ${searchParams.get('google_error')}`);
      setSearchParams({});
    }
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  // ─── Meta ───────────────────────────────────────────────

  async function fetchMetaStatus() {
    setMetaLoadingStatus(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/meta/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMetaStatus(data);
      if (data.connected) fetchAdAccounts();
    } finally {
      setMetaLoadingStatus(false);
    }
  }

  async function fetchAdAccounts() {
    setMetaLoadingAccounts(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/meta/ad-accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAdAccounts(data);
    } finally {
      setMetaLoadingAccounts(false);
    }
  }

  async function handleMetaConnect() {
    setMetaConnectLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/meta/connect', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setMetaConnectLoading(false);
    }
  }

  async function handleMetaDisconnect() {
    setMetaDisconnectLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/meta/disconnect', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetaStatus({ connected: false, adAccountId: null, expiresAt: null });
      setAdAccounts([]);
      showToast('Meta Ads desconectado.');
    } finally {
      setMetaDisconnectLoading(false);
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
      setMetaStatus(prev => prev ? { ...prev, adAccountId: id } : prev);
      showToast('Conta de anúncio salva!');
    } finally {
      setSavingAccount(false);
    }
  }

  // ─── Google ─────────────────────────────────────────────

  async function fetchGoogleStatus() {
    setGoogleLoadingStatus(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/google/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGoogleStatus(data);
      if (data.connected) fetchGoogleCustomers();
    } catch {
      setGoogleStatus({ connected: false, customerId: null });
    } finally {
      setGoogleLoadingStatus(false);
    }
  }

  async function fetchGoogleCustomers() {
    setGoogleLoadingCustomers(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/google/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setGoogleCustomers(data);
      } else {
        setGoogleCustomers([]);
        if (data.error) showToast(`Erro Google: ${data.error}`);
      }
    } catch {
      setGoogleCustomers([]);
    } finally {
      setGoogleLoadingCustomers(false);
    }
  }

  async function handleGoogleConnect() {
    setGoogleConnectLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/google/connect', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setGoogleConnectLoading(false);
    }
  }

  async function handleGoogleDisconnect() {
    setGoogleDisconnectLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/google/disconnect', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoogleStatus({ connected: false, customerId: null });
      setGoogleCustomers([]);
      showToast('Google Ads desconectado.');
    } finally {
      setGoogleDisconnectLoading(false);
    }
  }

  async function handleSelectCustomer(id: string) {
    setSavingCustomer(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/google/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customerId: id }),
      });
      setGoogleStatus(prev => prev ? { ...prev, customerId: id } : prev);
      showToast('Conta Google Ads salva!');
    } finally {
      setSavingCustomer(false);
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
          {/* ─── Meta Ads ─── */}
          <div className="integration-card">
            <div className="integration-header">
              <div className="integration-logo meta-logo">f</div>
              <div>
                <h3>Meta Ads</h3>
                <p className="integration-desc">Facebook e Instagram Ads</p>
              </div>
              <div className={`integration-badge ${metaStatus?.connected ? 'connected' : 'disconnected'}`}>
                {metaLoadingStatus ? '...' : metaStatus?.connected ? 'Conectado' : 'Desconectado'}
              </div>
            </div>

            {!metaLoadingStatus && !metaStatus?.connected && (
              <button
                className={`btn-connect ${metaConnectLoading ? 'loading' : ''}`}
                onClick={handleMetaConnect}
                disabled={metaConnectLoading}
              >
                {metaConnectLoading ? 'Redirecionando...' : 'Conectar com Meta'}
              </button>
            )}

            {!metaLoadingStatus && metaStatus?.connected && (
              <div className="integration-details">
                {metaStatus.expiresAt && (
                  <p className="token-expiry">
                    Token expira em: {new Date(metaStatus.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                )}

                <div className="ad-accounts-section">
                  <label>Conta de anúncio ativa</label>
                  {metaLoadingAccounts ? (
                    <p className="loading-text">Carregando contas...</p>
                  ) : adAccounts.length === 0 ? (
                    <p className="loading-text">Nenhuma conta encontrada.</p>
                  ) : (
                    <div className="ad-accounts-list">
                      {adAccounts.map(acc => (
                        <button
                          key={acc.id}
                          className={`ad-account-item ${metaStatus.adAccountId === acc.id ? 'selected' : ''}`}
                          onClick={() => handleSelectAccount(acc.id)}
                          disabled={savingAccount}
                        >
                          <span className="account-name">{acc.name}</span>
                          <span className="account-id">{acc.id}</span>
                          {metaStatus.adAccountId === acc.id && <span className="account-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className={`btn-disconnect ${metaDisconnectLoading ? 'loading' : ''}`}
                  onClick={handleMetaDisconnect}
                  disabled={metaDisconnectLoading}
                >
                  {metaDisconnectLoading ? 'Desconectando...' : 'Desconectar'}
                </button>
              </div>
            )}
          </div>

          {/* ─── Google Ads ─── */}
          <div className="integration-card">
            <div className="integration-header">
              <div className="integration-logo google-logo">G</div>
              <div>
                <h3>Google Ads</h3>
                <p className="integration-desc">Search, Display e YouTube</p>
              </div>
              <div className={`integration-badge ${googleStatus?.connected ? 'connected' : 'disconnected'}`}>
                {googleLoadingStatus ? '...' : googleStatus?.connected ? 'Conectado' : 'Desconectado'}
              </div>
            </div>

            {!googleLoadingStatus && !googleStatus?.connected && (
              <button
                className={`btn-connect ${googleConnectLoading ? 'loading' : ''}`}
                onClick={handleGoogleConnect}
                disabled={googleConnectLoading}
              >
                {googleConnectLoading ? 'Redirecionando...' : 'Conectar com Google'}
              </button>
            )}

            {!googleLoadingStatus && googleStatus?.connected && (
              <div className="integration-details">
                <div className="ad-accounts-section">
                  <label>Conta Google Ads ativa</label>
                  {googleLoadingCustomers ? (
                    <p className="loading-text">Carregando contas...</p>
                  ) : googleCustomers.length === 0 ? (
                    <p className="loading-text">Nenhuma conta encontrada.</p>
                  ) : (
                    <div className="ad-accounts-list">
                      {googleCustomers.map(acc => (
                        <button
                          key={acc.id}
                          className={`ad-account-item ${googleStatus.customerId === acc.id ? 'selected' : ''}`}
                          onClick={() => handleSelectCustomer(acc.id)}
                          disabled={savingCustomer}
                        >
                          <span className="account-name">{acc.name}</span>
                          <span className="account-id">{acc.id}</span>
                          {googleStatus.customerId === acc.id && <span className="account-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className={`btn-disconnect ${googleDisconnectLoading ? 'loading' : ''}`}
                  onClick={handleGoogleDisconnect}
                  disabled={googleDisconnectLoading}
                >
                  {googleDisconnectLoading ? 'Desconectando...' : 'Desconectar'}
                </button>
              </div>
            )}
          </div>

          {/* ─── TikTok Ads ─── */}
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
