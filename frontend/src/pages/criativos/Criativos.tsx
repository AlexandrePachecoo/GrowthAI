import { useState } from 'react';
import Layout from '../../components/Layout';
import './Criativos.css';

const PLATFORMS = ['instagram', 'facebook', 'google_ads', 'tiktok', 'linkedin'];

const OBJECTIVES: { value: string; label: string }[] = [
  { value: 'conversion', label: 'Conversão' },
  { value: 'awareness', label: 'Reconhecimento' },
  { value: 'engagement', label: 'Engajamento' },
  { value: 'traffic', label: 'Tráfego' },
];

const TONES: { value: string; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'inspirational', label: 'Inspiracional' },
  { value: 'formal', label: 'Formal' },
  { value: 'urgent', label: 'Urgente' },
];

interface CampaignOutput {
  headline: string;
  bodyText: string;
  cta: string;
  hashtags: string[];
}

export default function Criativos() {
  const [form, setForm] = useState({
    product: '',
    description: '',
    targetAudience: '',
    objective: 'conversion',
    platforms: ['instagram'] as string[],
    tone: 'casual',
  });

  const [results, setResults] = useState<Record<string, CampaignOutput> | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  function togglePlatform(p: string) {
    setForm(prev => {
      const has = prev.platforms.includes(p);
      const next = has ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p];
      return { ...prev, platforms: next.length ? next : [p] };
    });
  }

  async function handleGenerate() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data);
      setActiveTab(Object.keys(data)[0]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCampaign() {
    if (!results || !saveName.trim()) return;
    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: saveName.trim(),
          product: form.product,
          platforms: Object.keys(results),
          copies: results,
          images: {},
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch {
      // silently fail
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <Layout>
      <div className="criativos">
        <div className="page-header">
          <h1>Criativos</h1>
          <p className="page-subtitle">Gere copies e criativos com IA</p>
        </div>

        <div className="criativos-grid">
          <div className="form-card">
            <h3>Dados da campanha</h3>

            <div className="field">
              <label>Produto / Serviço</label>
              <input placeholder="Ex: DraftKings App" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
            </div>

            <div className="field">
              <label>Descrição</label>
              <textarea placeholder="Descreva seu produto..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>

            <div className="field">
              <label>Público-alvo</label>
              <input placeholder="Ex: Homens 25-40 anos" value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })} />
            </div>

            <div className="field">
              <label>Plataformas</label>
              <div className="platform-toggles">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`platform-pill ${form.platforms.includes(p) ? 'active' : ''}`}
                    onClick={() => togglePlatform(p)}
                  >
                    {p.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Objetivo</label>
              <div className="option-group">
                {OBJECTIVES.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    className={`option-pill ${form.objective === o.value ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, objective: o.value })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Tom</label>
              <div className="option-group">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`option-pill ${form.tone === t.value ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, tone: t.value })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            <button className={`btn-generate ${loading ? 'loading' : ''}`} onClick={handleGenerate} disabled={loading}>
              {loading ? 'Gerando...' : '✦ Gerar com IA'}
            </button>
          </div>

          <div className="result-card">
            <h3>Resultado</h3>

            {!results && !loading && (
              <div className="empty-state">
                <span>✦</span>
                <p>Preencha os dados e clique em gerar</p>
              </div>
            )}
            {loading && (
              <div className="empty-state">
                <p>Gerando suas copies...</p>
              </div>
            )}

            {results && (
              <>
                <div className="result-tabs">
                  {Object.keys(results).map(p => (
                    <button
                      key={p}
                      className={`result-tab ${activeTab === p ? 'active' : ''}`}
                      onClick={() => setActiveTab(p)}
                    >
                      {p.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="maintenance-notice">
                  <span className="maintenance-icon">🚧</span>
                  <p>A geração de criativos visuais está em manutenção. Em breve estará disponível novamente.</p>
                </div>

                <div className="maintenance-notice" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <span className="maintenance-icon">🖼️</span>
                  <p style={{ color: '#15803d' }}>Você pode adicionar criativos feitos fora do site direto nas suas campanhas salvas. Acesse <strong>Campanhas</strong> e clique em <strong>+ Criativo</strong>.</p>
                </div>

                <div className="save-section">
                  <input
                    className="save-input"
                    placeholder="Nome da campanha..."
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                  />
                  <button
                    className={`btn-save ${savedOk ? 'saved' : saveLoading ? 'loading' : ''}`}
                    onClick={handleSaveCampaign}
                    disabled={saveLoading || !saveName.trim()}
                  >
                    {savedOk ? '✓ Salvo' : saveLoading ? 'Salvando...' : 'Salvar campanha'}
                  </button>
                </div>

                {results[activeTab] && (
                  <div className="copy-result">
                    <div className="copy-block">
                      <label>Headline</label>
                      <p>{results[activeTab].headline}</p>
                    </div>
                    <div className="copy-block">
                      <label>Texto</label>
                      <p>{results[activeTab].bodyText}</p>
                    </div>
                    <div className="copy-block">
                      <label>CTA</label>
                      <p>{results[activeTab].cta}</p>
                    </div>
                    <div className="copy-block">
                      <label>Hashtags</label>
                      <p className="hashtags">{results[activeTab].hashtags.join(' ')}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
