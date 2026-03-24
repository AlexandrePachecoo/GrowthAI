import { useRef, useState } from 'react';
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

const PRESET_PALETTES: { name: string; colors: string[] }[] = [
  { name: 'Oceano',    colors: ['#0F172A', '#3B82F6', '#FFFFFF'] },
  { name: 'Roxo',      colors: ['#1E1B4B', '#7C3AED', '#F5F3FF'] },
  { name: 'Esmeralda', colors: ['#052E16', '#10B981', '#ECFDF5'] },
  { name: 'Fogo',      colors: ['#1C0A00', '#F97316', '#FFF7ED'] },
  { name: 'Rosa',      colors: ['#1A0010', '#EC4899', '#FDF2F8'] },
];

interface CampaignOutput {
  headline: string;
  bodyText: string;
  cta: string;
  hashtags: string[];
}

function isValidHex(v: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(v);
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
  const [saveError, setSaveError] = useState('');

  // Creative state
  const [creativeFormat, setCreativeFormat] = useState<'variants' | 'carousel'>('variants');
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [palette, setPalette] = useState<string[]>(PRESET_PALETTES[0].colors);
  const [hexInputs, setHexInputs] = useState<string[]>(PRESET_PALETTES[0].colors);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [creativeImages, setCreativeImages] = useState<string[]>([]);
  const [creativeLoading, setCreativeLoading] = useState(false);
  const [creativeError, setCreativeError] = useState('');
  const [creativeActiveIdx, setCreativeActiveIdx] = useState(0);
  const [selectedImageIdxs, setSelectedImageIdxs] = useState<Set<number>>(new Set());

  const logoInputRef = useRef<HTMLInputElement>(null);

  function togglePlatform(p: string) {
    setForm(prev => {
      const has = prev.platforms.includes(p);
      const next = has ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p];
      return { ...prev, platforms: next.length ? next : [p] };
    });
  }

  function selectPreset(idx: number) {
    setSelectedPreset(idx);
    setPalette(PRESET_PALETTES[idx].colors);
    setHexInputs(PRESET_PALETTES[idx].colors);
  }

  function updateHexInput(idx: number, raw: string) {
    const val = raw.startsWith('#') ? raw : `#${raw}`;
    setHexInputs(prev => prev.map((c, i) => (i === idx ? val : c)));
    if (isValidHex(val)) {
      setPalette(prev => prev.map((c, i) => (i === idx ? val : c)));
      setSelectedPreset(-1);
    }
  }

  function toggleImageSelection(idx: number) {
    setSelectedImageIdxs(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function selectAllImages() {
    setSelectedImageIdxs(new Set(creativeImages.map((_, i) => i)));
  }

  function deselectAllImages() {
    setSelectedImageIdxs(new Set());
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
      setCreativeImages([]);
      setSelectedImageIdxs(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCampaign() {
    if (!results || !saveName.trim()) return;
    setSaveLoading(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('token');

      const platform = activeTab || Object.keys(results)[0];
      const selectedImgs = creativeImages.filter((_, i) => selectedImageIdxs.has(i));
      const images = selectedImgs.length ? { [platform]: selectedImgs } : {};

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleGenerateCreatives() {
    if (!results) return;
    setCreativeError('');
    setCreativeLoading(true);
    setCreativeImages([]);
    setSelectedImageIdxs(new Set());
    try {
      const platform = activeTab || Object.keys(results)[0];
      const res = await fetch('http://localhost:3001/campaign/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: [platform],
          copies: results,
          format: creativeFormat,
          userLogo: logoBase64 || undefined,
          userPalette: palette,
          product: {
            name: form.product,
            description: form.description,
            audience: form.targetAudience,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const imgs: string[] = [];
      for (const plat of Object.keys(data)) {
        const entry = data[plat];
        if (Array.isArray(entry)) imgs.push(...entry);
        else if (typeof entry === 'string') imgs.push(entry);
        else if (entry && typeof entry === 'object') imgs.push(...Object.values(entry) as string[]);
      }
      setCreativeImages(imgs);
      setCreativeActiveIdx(0);
      // Select all by default
      setSelectedImageIdxs(new Set(imgs.map((_, i) => i)));
    } catch (err: unknown) {
      setCreativeError(err instanceof Error ? err.message : 'Erro ao gerar criativos');
    } finally {
      setCreativeLoading(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoBase64(reader.result as string);
    reader.readAsDataURL(file);
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

                <div className="creative-section">
                  <h4>Gerar Criativos Visuais</h4>

                  <div className="field">
                    <label>Formato</label>
                    <div className="option-group">
                      <button
                        type="button"
                        className={`option-pill ${creativeFormat === 'variants' ? 'active' : ''}`}
                        onClick={() => setCreativeFormat('variants')}
                      >
                        Variantes (5 imagens)
                      </button>
                      <button
                        type="button"
                        className={`option-pill ${creativeFormat === 'carousel' ? 'active' : ''}`}
                        onClick={() => setCreativeFormat('carousel')}
                      >
                        Carrosel (4 slides)
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label>Paleta de cores</label>
                    <div className="palette-presets-row">
                      {PRESET_PALETTES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`palette-preset-btn ${selectedPreset === idx ? 'active' : ''}`}
                          onClick={() => selectPreset(idx)}
                          title={preset.name}
                        >
                          {preset.colors.map((c, ci) => (
                            <span key={ci} className="preset-dot" style={{ background: c }} />
                          ))}
                          <span className="preset-name">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                    <div className="palette-hex-row">
                      {palette.map((color, idx) => (
                        <div key={idx} className="palette-hex-item">
                          <span className="palette-hex-swatch" style={{ background: isValidHex(hexInputs[idx]) ? hexInputs[idx] : color }} />
                          <input
                            className={`palette-hex-input ${!isValidHex(hexInputs[idx]) ? 'invalid' : ''}`}
                            value={hexInputs[idx]}
                            onChange={e => updateHexInput(idx, e.target.value)}
                            maxLength={7}
                            spellCheck={false}
                            placeholder="#000000"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label>Logo (opcional)</label>
                    <div className="upload-row">
                      <button type="button" className="btn-upload" onClick={() => logoInputRef.current?.click()}>
                        {logoBase64 ? '✓ Logo carregado' : 'Carregar logo'}
                      </button>
                      {logoBase64 && (
                        <button type="button" className="btn-remove" onClick={() => setLogoBase64('')}>
                          Remover
                        </button>
                      )}
                      <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                    </div>
                  </div>

                  {creativeError && <p className="error">{creativeError}</p>}

                  <button
                    className={`btn-generate ${creativeLoading ? 'loading' : ''}`}
                    onClick={handleGenerateCreatives}
                    disabled={creativeLoading}
                  >
                    {creativeLoading ? 'Gerando criativos...' : '✦ Gerar criativos visuais'}
                  </button>

                  {creativeImages.length > 0 && (
                    <div className="creative-results">
                      <div className="creative-select-bar">
                        <span className="creative-select-label">
                          {selectedImageIdxs.size} de {creativeImages.length} selecionada{creativeImages.length > 1 ? 's' : ''}
                        </span>
                        <button type="button" className="btn-select-text" onClick={selectAllImages}>Todas</button>
                        <button type="button" className="btn-select-text" onClick={deselectAllImages}>Nenhuma</button>
                      </div>

                      <div className="creative-thumbs">
                        {creativeImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`creative-thumb ${creativeActiveIdx === idx ? 'active' : ''} ${selectedImageIdxs.has(idx) ? 'selected' : ''}`}
                            onClick={() => setCreativeActiveIdx(idx)}
                          >
                            <img src={img} alt={`Criativo ${idx + 1}`} />
                            <span
                              className={`thumb-checkbox ${selectedImageIdxs.has(idx) ? 'checked' : ''}`}
                              onClick={e => { e.stopPropagation(); toggleImageSelection(idx); }}
                            >
                              {selectedImageIdxs.has(idx) ? '✓' : ''}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="creative-preview">
                        <img src={creativeImages[creativeActiveIdx]} alt="Criativo selecionado" />
                        <a
                          className="btn-download"
                          href={creativeImages[creativeActiveIdx]}
                          download={`criativo-${creativeActiveIdx + 1}.png`}
                        >
                          Baixar imagem
                        </a>
                      </div>
                    </div>
                  )}
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
                {saveError && <p className="error">{saveError}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
