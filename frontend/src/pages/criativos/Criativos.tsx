import { useState } from 'react';
import Layout from '../../components/Layout';
import './Criativos.css';

const platforms = ['instagram', 'facebook', 'google_ads', 'tiktok', 'linkedin'];
const objectives = ['conversion', 'awareness', 'engagement', 'traffic'];
const tones = ['casual', 'inspirational', 'formal', 'urgent'];

interface CampaignOutput {
  headline: string;
  bodyText: string;
  cta: string;
  hashtags: string[];
  imagePrompt: string;
}

export default function Criativos() {
  const [form, setForm] = useState({
    product: '',
    description: '',
    targetAudience: '',
    objective: 'conversion',
    platform: 'instagram',
    tone: 'casual',
  });
  const [result, setResult] = useState<CampaignOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar');
    } finally {
      setLoading(false);
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

            <div className="field-row">
              <div className="field">
                <label>Plataforma</label>
                <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                  {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Objetivo</label>
                <select value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })}>
                  {objectives.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Tom</label>
                <select value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })}>
                  {tones.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Gerando...' : '✦ Gerar com IA'}
            </button>
          </div>

          <div className="result-card">
            <h3>Resultado</h3>
            {!result && !loading && (
              <div className="empty-state">
                <span>✦</span>
                <p>Preencha os dados e clique em gerar</p>
              </div>
            )}
            {loading && (
              <div className="empty-state">
                <p>Gerando sua copy...</p>
              </div>
            )}
            {result && (
              <div className="copy-result">
                <div className="copy-block">
                  <label>Headline</label>
                  <p>{result.headline}</p>
                </div>
                <div className="copy-block">
                  <label>Texto</label>
                  <p>{result.bodyText}</p>
                </div>
                <div className="copy-block">
                  <label>CTA</label>
                  <p>{result.cta}</p>
                </div>
                <div className="copy-block">
                  <label>Hashtags</label>
                  <p className="hashtags">{result.hashtags.join(' ')}</p>
                </div>
                <div className="copy-block">
                  <label>Prompt para imagem</label>
                  <p className="image-prompt">{result.imagePrompt}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
