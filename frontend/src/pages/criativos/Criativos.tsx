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
  imagePrompt: string;
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

  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  const [results, setResults] = useState<Record<string, CampaignOutput> | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedImagePlatforms, setSelectedImagePlatforms] = useState<string[]>([]);
  // variants: Record<platform, string[]> — 5 images each
  const [variants, setVariants] = useState<Record<string, string[]> | null>(null);
  // picked: Record<platform, number[]> — up to 2 selected indices per platform
  const [picked, setPicked] = useState<Record<string, number[]>>({});
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');

  const [lightbox, setLightbox] = useState<string | null>(null);

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

  function handleReferenceImageFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setReferenceImages(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeReferenceImage(index: number) {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
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
      setSelectedImagePlatforms(Object.keys(data));
      setVariants(null);
      setPicked({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar');
    } finally {
      setLoading(false);
    }
  }

  function togglePick(platform: string, index: number) {
    setPicked(prev => {
      const current = prev[platform] ?? [];
      if (current.includes(index)) {
        return { ...prev, [platform]: current.filter(i => i !== index) };
      }
      if (current.length >= 2) return prev; // max 2
      return { ...prev, [platform]: [...current, index] };
    });
  }

  async function handleSaveCampaign() {
    if (!results || !saveName.trim()) return;
    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Build images map: platform → array of picked variants
      const images: Record<string, string[]> = {};
      if (variants) {
        Object.keys(variants).forEach(p => {
          const indices = picked[p] ?? [];
          if (indices.length > 0) images[p] = indices.map(i => variants[p][i]);
        });
      }

      const res = await fetch('http://localhost:3001/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: saveName.trim(),
          product: form.product,
          platforms: Object.keys(results),
          copies: results,
          images,
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

  async function handleGenerateImages() {
    if (!results) return;
    setImageError('');
    setImageLoading(true);
    setVariants(null);
    setPicked({});
    try {
      const copies: Record<string, CampaignOutput> = {};
      selectedImagePlatforms.forEach(p => { copies[p] = results[p]; });

      const res = await fetch('http://localhost:3001/campaign/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedImagePlatforms,
          copies,
          referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVariants(data); // Record<platform, string[]>
      // pre-select first variant for each platform
      const initial: Record<string, number[]> = {};
      selectedImagePlatforms.forEach(p => { initial[p] = [0]; });
      setPicked(initial);
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : 'Erro ao gerar imagens');
    } finally {
      setImageLoading(false);
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

            <div className="field">
              <label>Imagens de referência <span className="label-hint">(logo, cores, estilo…)</span></label>
              <div
                className="upload-area"
                onClick={() => document.getElementById('ref-image-input')?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleReferenceImageFiles(e.dataTransfer.files); }}
              >
                <input
                  id="ref-image-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => handleReferenceImageFiles(e.target.files)}
                />
                {referenceImages.length === 0 ? (
                  <p>Clique ou arraste imagens aqui</p>
                ) : (
                  <div className="upload-thumbnails">
                    {referenceImages.map((src, i) => (
                      <div key={i} className="upload-thumb">
                        <img src={src} alt={`ref-${i}`} />
                        <button
                          type="button"
                          className="thumb-remove"
                          onClick={e => { e.stopPropagation(); removeReferenceImage(i); }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

                <div className="image-gen-section">
                  <span className="image-gen-label">Gerar criativos para:</span>
                  <div className="platform-toggles">
                    {Object.keys(results).map(p => (
                      <button
                        key={p}
                        type="button"
                        className={`platform-pill ${selectedImagePlatforms.includes(p) ? 'active' : ''}`}
                        onClick={() =>
                          setSelectedImagePlatforms(prev =>
                            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                          )
                        }
                      >
                        {p.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  {imageError && <p className="error">{imageError}</p>}
                  <button
                    className={`btn-generate btn-generate-images ${imageLoading ? 'loading' : ''}`}
                    onClick={handleGenerateImages}
                    disabled={imageLoading || selectedImagePlatforms.length === 0}
                  >
                    {imageLoading ? 'Gerando criativos...' : '✦ Gerar Criativos'}
                  </button>
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
                    <div className="copy-block">
                      <label>Prompt para imagem</label>
                      <p className="image-prompt">{results[activeTab].imagePrompt}</p>
                    </div>
                    {variants && variants[activeTab] && (
                      <div className="copy-block">
                        <label>
                          Escolha até 2 criativos
                          <span className="label-hint"> ({(picked[activeTab] ?? []).length}/2 selecionados)</span>
                        </label>
                        <div className="variants-grid">
                          {variants[activeTab].map((src, i) => {
                            const isSelected = (picked[activeTab] ?? []).includes(i);
                            const isDisabled = !isSelected && (picked[activeTab] ?? []).length >= 2;
                            return (
                              <div
                                key={i}
                                className={`variant-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                onClick={() => !isDisabled && togglePick(activeTab, i)}
                              >
                                <img src={src} alt={`variante ${i + 1}`} />
                                {isSelected && <div className="variant-check">✓</div>}
                                <button
                                  className="variant-zoom"
                                  onClick={e => { e.stopPropagation(); setLightbox(src); }}
                                  title="Ver maior"
                                >⤢</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="lightbox-box" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox} alt="criativo" className="lightbox-img" />
          </div>
        </div>
      )}
    </Layout>
  );
}
