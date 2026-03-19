import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import './Campanhas.css';

interface CopyData {
  headline: string;
  bodyText: string;
  cta: string;
  hashtags: string[];
}

interface Campaign {
  id: string;
  name: string;
  product: string;
  platforms: string[];
  copies: Record<string, CopyData>;
  images: Record<string, string | string[]>;
  created_at: string;
}

export default function Campanhas() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCampaigns(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3001/campaigns/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function openCampaign(c: Campaign) {
    setSelected(c);
    setActiveTab(c.platforms[0]);
  }

  return (
    <Layout>
      <div className="campanhas">
        <div className="page-header">
          <div>
            <h1>Campanhas</h1>
            <p className="page-subtitle">Suas campanhas salvas</p>
          </div>
        </div>

        {loading && <p className="loading-text">Carregando...</p>}

        {!loading && campaigns.length === 0 && (
          <div className="empty-campaigns">
            <span>✦</span>
            <p>Nenhuma campanha salva ainda. Gere criativos e salve uma campanha.</p>
          </div>
        )}

        {!loading && campaigns.length > 0 && (
          <div className="campaigns-table">
            <div className="table-header">
              <span>Nome</span>
              <span>Produto</span>
              <span>Plataformas</span>
              <span>Data</span>
              <span>Ações</span>
            </div>
            {campaigns.map(c => (
              <div key={c.id} className="table-row" onClick={() => openCampaign(c)}>
                <span className="campaign-name">{c.name}</span>
                <span className="campaign-product">{c.product}</span>
                <div className="platforms-list">
                  {c.platforms.map(p => (
                    <span key={p} className="platform-badge">{p.replace('_', ' ')}</span>
                  ))}
                </div>
                <span className="campaign-date">
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </span>
                <div className="actions" onClick={e => e.stopPropagation()}>
                  <button className="action-btn" onClick={() => openCampaign(c)}>Ver</button>
                  <button className="action-btn danger" onClick={() => handleDelete(c.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{selected.name}</h2>
                  <p className="modal-product">{selected.product}</p>
                </div>
                <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
              </div>

              <div className="modal-tabs">
                {selected.platforms.map(p => (
                  <button
                    key={p}
                    className={`result-tab ${activeTab === p ? 'active' : ''}`}
                    onClick={() => setActiveTab(p)}
                  >
                    {p.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {selected.copies[activeTab] && (
                <div className="modal-content">
                  {selected.images[activeTab] && (
                    <div className="modal-images">
                      {(Array.isArray(selected.images[activeTab])
                        ? selected.images[activeTab] as string[]
                        : [selected.images[activeTab] as string]
                      ).map((src, i) => (
                        <img key={i} src={src} alt={`criativo ${i + 1}`} className="modal-image" />
                      ))}
                    </div>
                  )}
                  <div className="modal-copy">
                    <div className="copy-block">
                      <label>Headline</label>
                      <p>{selected.copies[activeTab].headline}</p>
                    </div>
                    <div className="copy-block">
                      <label>Texto</label>
                      <p>{selected.copies[activeTab].bodyText}</p>
                    </div>
                    <div className="copy-block">
                      <label>CTA</label>
                      <p>{selected.copies[activeTab].cta}</p>
                    </div>
                    <div className="copy-block">
                      <label>Hashtags</label>
                      <p className="hashtags">{selected.copies[activeTab].hashtags?.join(' ')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
