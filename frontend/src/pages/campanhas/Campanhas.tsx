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

interface PublishForm {
  platform: string;
  pageId: string;
  websiteUrl: string;
  dailyBudget: string;
  startTime: string;
  endTime: string;
  countries: string;
  ageMin: string;
  ageMax: string;
}

const defaultPublishForm: PublishForm = {
  platform: 'facebook',
  pageId: '',
  websiteUrl: '',
  dailyBudget: '2000',
  startTime: new Date().toISOString().slice(0, 10),
  endTime: '',
  countries: 'BR',
  ageMin: '18',
  ageMax: '65',
};

export default function Campanhas() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState('');

  const [publishTarget, setPublishTarget] = useState<Campaign | null>(null);
  const [publishForm, setPublishForm] = useState<PublishForm>(defaultPublishForm);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishResult, setPublishResult] = useState<Record<string, string> | null>(null);

  const [pages, setPages] = useState<{ id: string; name: string }[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  const [publishGoogleTarget, setPublishGoogleTarget] = useState<Campaign | null>(null);
  const [googleForm, setGoogleForm] = useState({ websiteUrl: '', dailyBudgetBRL: '20', startDate: new Date().toISOString().slice(0, 10), endDate: '', countries: 'BR' });
  const [publishingGoogle, setPublishingGoogle] = useState(false);
  const [googlePublishError, setGooglePublishError] = useState('');
  const [googlePublishResult, setGooglePublishResult] = useState<Record<string, string> | null>(null);

  const [strategyTarget, setStrategyTarget] = useState<Campaign | null>(null);
  const [strategyBudget, setStrategyBudget] = useState('');
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyResult, setStrategyResult] = useState<any | null>(null);
  const [strategyError, setStrategyError] = useState('');

  const [externalCreativeTarget, setExternalCreativeTarget] = useState<Campaign | null>(null);
  const [externalPlatform, setExternalPlatform] = useState('');
  const [externalImageType, setExternalImageType] = useState<'url' | 'file'>('url');
  const [externalImageUrl, setExternalImageUrl] = useState('');
  const [externalImageFile, setExternalImageFile] = useState<File | null>(null);
  const [externalSaving, setExternalSaving] = useState(false);
  const [externalError, setExternalError] = useState('');

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

  const META_PLATFORMS = ['facebook', 'instagram'];

  function metaPlatforms(platforms: string[]) {
    return platforms.filter(p => META_PLATFORMS.includes(p));
  }

  function openPublishGoogle(c: Campaign) {
    setPublishGoogleTarget(c);
    setGoogleForm({ websiteUrl: '', dailyBudgetBRL: '20', startDate: new Date().toISOString().slice(0, 10), endDate: '', countries: 'BR' });
    setGooglePublishError('');
    setGooglePublishResult(null);
  }

  async function handlePublishGoogle() {
    if (!publishGoogleTarget) return;
    setGooglePublishError('');
    setPublishingGoogle(true);
    try {
      const token = localStorage.getItem('token');
      const dailyBudgetMicros = Math.round(parseFloat(googleForm.dailyBudgetBRL) * 1_000_000);
      const res = await fetch('http://localhost:3001/google/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          campaignId: publishGoogleTarget.id,
          websiteUrl: googleForm.websiteUrl,
          dailyBudgetMicros,
          startDate: googleForm.startDate.replace(/-/g, ''),
          endDate: googleForm.endDate ? googleForm.endDate.replace(/-/g, '') : undefined,
          countries: googleForm.countries.split(',').map(c => c.trim().toUpperCase()),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGooglePublishResult(data);
    } catch (err: unknown) {
      setGooglePublishError(err instanceof Error ? err.message : 'Erro ao publicar');
    } finally {
      setPublishingGoogle(false);
    }
  }

  function openStrategy(c: Campaign) {
    setStrategyTarget(c);
    setStrategyBudget('');
    setStrategyResult(null);
    setStrategyError('');
  }

  async function handleGenerateStrategy() {
    if (!strategyTarget) return;
    setStrategyError('');
    setStrategyLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/campaigns/${strategyTarget.id}/strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ totalBudget: parseFloat(strategyBudget) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStrategyResult(data);
    } catch (err: unknown) {
      setStrategyError(err instanceof Error ? err.message : 'Erro ao gerar estratégia');
    } finally {
      setStrategyLoading(false);
    }
  }

  function openExternalCreative(c: Campaign) {
    setExternalCreativeTarget(c);
    setExternalPlatform(c.platforms[0]);
    setExternalImageType('url');
    setExternalImageUrl('');
    setExternalImageFile(null);
    setExternalError('');
  }

  async function handleAddExternalCreative() {
    if (!externalCreativeTarget) return;
    setExternalError('');
    setExternalSaving(true);
    try {
      let imageData = '';
      if (externalImageType === 'url') {
        if (!externalImageUrl.trim()) throw new Error('Informe a URL da imagem');
        imageData = externalImageUrl.trim();
      } else {
        if (!externalImageFile) throw new Error('Selecione um arquivo');
        imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
          reader.readAsDataURL(externalImageFile);
        });
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/campaigns/${externalCreativeTarget.id}/creative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform: externalPlatform, imageData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCampaigns(prev => prev.map(c => c.id === data.id ? data : c));
      if (selected?.id === data.id) setSelected(data);
      setExternalCreativeTarget(null);
    } catch (err: unknown) {
      setExternalError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setExternalSaving(false);
    }
  }

  async function openPublish(c: Campaign) {
    const available = metaPlatforms(c.platforms);
    setPublishTarget(c);
    setPublishForm({
      ...defaultPublishForm,
      platform: available[0] ?? 'facebook',
    });
    setPublishError('');
    setPublishResult(null);
    setPages([]);
    setLoadingPages(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/meta/pages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPages(data);
      if (data.length > 0) {
        setPublishForm(prev => ({ ...prev, pageId: data[0].id }));
      }
    } finally {
      setLoadingPages(false);
    }
  }

  async function handlePublish() {
    if (!publishTarget) return;
    setPublishError('');
    setPublishing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/meta/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          campaignId: publishTarget.id,
          platform: publishForm.platform,
          pageId: publishForm.pageId,
          websiteUrl: publishForm.websiteUrl,
          dailyBudget: parseInt(publishForm.dailyBudget),
          startTime: new Date(publishForm.startTime).toISOString(),
          endTime: publishForm.endTime ? new Date(publishForm.endTime).toISOString() : undefined,
          targeting: {
            countries: publishForm.countries.split(',').map(c => c.trim().toUpperCase()),
            ageMin: parseInt(publishForm.ageMin),
            ageMax: parseInt(publishForm.ageMax),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPublishResult(data);
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'Erro ao publicar');
    } finally {
      setPublishing(false);
    }
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
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de visualização */}
        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-scrollable">
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

              <div className="modal-actions">
                <button className="action-btn creative" onClick={() => { setSelected(null); openExternalCreative(selected); }}>
                  + Adicionar criativo
                </button>
                <button className="action-btn meta" onClick={() => { setSelected(null); openPublish(selected); }}>
                  <span className="meta-icon">f</span> Meta Ads
                </button>
                <button className="action-btn google" onClick={() => { setSelected(null); openPublishGoogle(selected); }}>
                  <span className="google-icon">G</span> Google Ads
                </button>
                <button className="action-btn strategy" onClick={() => { setSelected(null); openStrategy(selected); }}>
                  ✦ Gerar estratégia
                </button>
                <button className="action-btn danger" onClick={() => { handleDelete(selected.id); setSelected(null); }}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal publicar no Google Ads */}
        {publishGoogleTarget && (
          <div className="modal-overlay" onClick={() => setPublishGoogleTarget(null)}>
            <div className="modal publish-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-scrollable">
                <div className="modal-header">
                  <div>
                    <h2>Publicar no Google Ads</h2>
                    <p className="modal-product">{publishGoogleTarget.name}</p>
                  </div>
                  <button className="modal-close" onClick={() => setPublishGoogleTarget(null)}>✕</button>
                </div>

                {googlePublishResult ? (
                  <div className="publish-success">
                    <div className="publish-success-icon">✓</div>
                    <h3>Campanha criada no Google Ads!</h3>
                    <p>A campanha foi criada com status <strong>Pausada</strong>. Ative-a no Google Ads Manager quando estiver pronto.</p>
                    <div className="publish-ids">
                      <div className="publish-id-row"><span>Campaign ID</span><code>{googlePublishResult.googleCampaignId}</code></div>
                      <div className="publish-id-row"><span>Ad Group ID</span><code>{googlePublishResult.googleAdGroupId}</code></div>
                      <div className="publish-id-row"><span>Ad ID</span><code>{googlePublishResult.googleAdId}</code></div>
                    </div>
                    <button className="btn-publish" onClick={() => setPublishGoogleTarget(null)}>Fechar</button>
                  </div>
                ) : (
                  <>
                    <div className="publish-form">
                      <div className="field">
                        <label>URL de destino</label>
                        <input placeholder="https://seusite.com" value={googleForm.websiteUrl} onChange={e => setGoogleForm({ ...googleForm, websiteUrl: e.target.value })} />
                      </div>
                      <div className="publish-row">
                        <div className="field">
                          <label>Orçamento diário (R$)</label>
                          <input type="text" inputMode="decimal" placeholder="20" value={googleForm.dailyBudgetBRL} onChange={e => setGoogleForm({ ...googleForm, dailyBudgetBRL: e.target.value.replace(',', '.') })} />
                        </div>
                        <div className="field">
                          <label>Países <span className="label-hint">(ex: BR, US)</span></label>
                          <input placeholder="BR" value={googleForm.countries} onChange={e => setGoogleForm({ ...googleForm, countries: e.target.value })} />
                        </div>
                      </div>
                      <div className="publish-row">
                        <div className="field">
                          <label>Início</label>
                          <input type="date" value={googleForm.startDate} onChange={e => setGoogleForm({ ...googleForm, startDate: e.target.value })} />
                        </div>
                        <div className="field">
                          <label>Fim <span className="label-hint">(opcional)</span></label>
                          <input type="date" value={googleForm.endDate} onChange={e => setGoogleForm({ ...googleForm, endDate: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    {googlePublishError && <p className="publish-error">{googlePublishError}</p>}
                    <button className={`btn-publish btn-google ${publishingGoogle ? 'loading' : ''}`} onClick={handlePublishGoogle} disabled={publishingGoogle || !googleForm.websiteUrl}>
                      {publishingGoogle ? 'Publicando...' : 'Publicar no Google Ads'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de estratégia IA */}
        {strategyTarget && (
          <div className="modal-overlay" onClick={() => setStrategyTarget(null)}>
            <div className="modal strategy-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-scrollable">
              <div className="modal-header">
                <div>
                  <h2>✦ Estratégia com IA</h2>
                  <p className="modal-product">{strategyTarget.name}</p>
                </div>
                <button className="modal-close" onClick={() => setStrategyTarget(null)}>✕</button>
              </div>

              {!strategyResult ? (
                <div className="strategy-form">
                  <p className="strategy-desc">Informe seu orçamento total e a IA vai recomendar a melhor divisão entre Meta Ads e Google Ads para o seu produto e nicho.</p>
                  <div className="field">
                    <label>Orçamento total disponível (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 1500"
                      value={strategyBudget}
                      onChange={e => setStrategyBudget(e.target.value.replace(',', '.'))}
                    />
                  </div>
                  {strategyError && <p className="publish-error">{strategyError}</p>}
                  <button
                    className={`btn-publish btn-strategy ${strategyLoading ? 'loading' : ''}`}
                    onClick={handleGenerateStrategy}
                    disabled={strategyLoading || !strategyBudget}
                  >
                    {strategyLoading ? 'Analisando...' : '✦ Gerar estratégia'}
                  </button>
                </div>
              ) : (
                <div className="strategy-result">
                  <p className="strategy-summary">{strategyResult.summary}</p>

                  {strategyResult.warning && (
                    <div className="strategy-warning">⚠ {strategyResult.warning}</div>
                  )}

                  <div className="strategy-platforms">
                    {strategyResult.platforms.map((p: any) => (
                      <div key={p.platform} className="strategy-platform-card">
                        <div className="strategy-platform-header">
                          <span className="strategy-platform-name">{p.platform}</span>
                          <span className="strategy-platform-budget">
                            R$ {p.budget.toLocaleString('pt-BR')} <span className="strategy-pct">({p.percentage}%)</span>
                          </span>
                        </div>
                        <p className="strategy-rationale">{p.rationale}</p>
                        <div className="strategy-meta-row">
                          <span className="strategy-label">Objetivo:</span> {p.recommendedObjective}
                        </div>
                        <div className="strategy-meta-row">
                          <span className="strategy-label">Resultado esperado:</span> {p.expectedResults}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="strategy-tips">
                    <p className="strategy-tips-title">Dicas gerais</p>
                    <ul>
                      {strategyResult.generalTips.map((tip: string, i: number) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  <button className="btn-publish" style={{ background: '#1a1a1a' }} onClick={() => setStrategyResult(null)}>
                    Nova análise
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de criativo externo */}
        {externalCreativeTarget && (
          <div className="modal-overlay" onClick={() => setExternalCreativeTarget(null)}>
            <div className="modal publish-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-scrollable">
              <div className="modal-header">
                <div>
                  <h2>Adicionar criativo externo</h2>
                  <p className="modal-product">{externalCreativeTarget.name}</p>
                </div>
                <button className="modal-close" onClick={() => setExternalCreativeTarget(null)}>✕</button>
              </div>

              <div className="publish-form">
                <div className="field">
                  <label>Plataforma</label>
                  <div className="platform-toggle-group">
                    {externalCreativeTarget.platforms.map(p => (
                      <button
                        key={p}
                        type="button"
                        className={`platform-toggle-btn ${externalPlatform === p ? 'active' : ''}`}
                        onClick={() => setExternalPlatform(p)}
                      >
                        {p.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Tipo de criativo</label>
                  <div className="platform-toggle-group">
                    <button
                      type="button"
                      className={`platform-toggle-btn ${externalImageType === 'url' ? 'active' : ''}`}
                      onClick={() => setExternalImageType('url')}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      className={`platform-toggle-btn ${externalImageType === 'file' ? 'active' : ''}`}
                      onClick={() => setExternalImageType('file')}
                    >
                      Upload de arquivo
                    </button>
                  </div>
                </div>

                {externalImageType === 'url' ? (
                  <div className="field">
                    <label>URL da imagem</label>
                    <input
                      placeholder="https://..."
                      value={externalImageUrl}
                      onChange={e => setExternalImageUrl(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="field">
                    <label>Arquivo de imagem</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setExternalImageFile(e.target.files?.[0] ?? null)}
                    />
                    {externalImageFile && (
                      <p className="loading-text">{externalImageFile.name}</p>
                    )}
                  </div>
                )}
              </div>

              {externalError && <p className="publish-error">{externalError}</p>}

              <button
                className={`btn-publish ${externalSaving ? 'loading' : ''}`}
                style={{ background: '#1a1a1a' }}
                onClick={handleAddExternalCreative}
                disabled={externalSaving}
              >
                {externalSaving ? 'Salvando...' : 'Adicionar criativo'}
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de publicação no Meta */}
        {publishTarget && (
          <div className="modal-overlay" onClick={() => setPublishTarget(null)}>
            <div className="modal publish-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-scrollable">
              <div className="modal-header">
                <div>
                  <h2>Publicar no Meta Ads</h2>
                  <p className="modal-product">{publishTarget.name}</p>
                </div>
                <button className="modal-close" onClick={() => setPublishTarget(null)}>✕</button>
              </div>

              {publishResult ? (
                <div className="publish-success">
                  <div className="publish-success-icon">✓</div>
                  <h3>Anúncio criado com sucesso!</h3>
                  <p>O anúncio foi criado com status <strong>Pausado</strong>. Ative-o no Gerenciador de Anúncios do Meta quando estiver pronto.</p>
                  <div className="publish-ids">
                    <div className="publish-id-row"><span>Campaign ID</span><code>{publishResult.metaCampaignId}</code></div>
                    <div className="publish-id-row"><span>Ad Set ID</span><code>{publishResult.metaAdSetId}</code></div>
                    <div className="publish-id-row"><span>Ad ID</span><code>{publishResult.metaAdId}</code></div>
                  </div>
                  <button className="btn-publish" onClick={() => setPublishTarget(null)}>Fechar</button>
                </div>
              ) : (
                <>
                  <div className="publish-form">
                    <div className="publish-row">
                      <div className="field">
                        <label>Plataforma</label>
                        <div className="platform-toggle-group">
                          {metaPlatforms(publishTarget.platforms).map(p => (
                            <button
                              key={p}
                              type="button"
                              className={`platform-toggle-btn ${publishForm.platform === p ? 'active' : ''}`}
                              onClick={() => setPublishForm({ ...publishForm, platform: p })}
                            >
                              {p === 'facebook' ? 'Facebook' : 'Instagram'}
                            </button>
                          ))}
                          {metaPlatforms(publishTarget.platforms).length === 0 && (
                            <span className="no-meta-platforms">Nenhuma plataforma Meta nesta campanha</span>
                          )}
                        </div>
                      </div>
                      <div className="field">
                        <label>Orçamento diário (centavos)</label>
                        <input
                          type="number"
                          placeholder="2000 = R$20,00"
                          value={publishForm.dailyBudget}
                          onChange={e => setPublishForm({ ...publishForm, dailyBudget: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label>Página do Facebook</label>
                      {loadingPages ? (
                        <p className="loading-text">Buscando páginas...</p>
                      ) : pages.length > 0 ? (
                        <select
                          value={publishForm.pageId}
                          onChange={e => setPublishForm({ ...publishForm, pageId: e.target.value })}
                        >
                          {pages.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="publish-error">Nenhuma página encontrada. Crie uma Página no Facebook e vincule ao seu app.</p>
                      )}
                    </div>

                    <div className="field">
                      <label>URL de destino</label>
                      <input
                        placeholder="https://seusite.com"
                        value={publishForm.websiteUrl}
                        onChange={e => setPublishForm({ ...publishForm, websiteUrl: e.target.value })}
                      />
                    </div>

                    <div className="publish-row">
                      <div className="field">
                        <label>Início</label>
                        <input
                          type="date"
                          value={publishForm.startTime}
                          onChange={e => setPublishForm({ ...publishForm, startTime: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Fim <span className="label-hint">(opcional)</span></label>
                        <input
                          type="date"
                          value={publishForm.endTime}
                          onChange={e => setPublishForm({ ...publishForm, endTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="publish-row">
                      <div className="field">
                        <label>Países <span className="label-hint">(ex: BR, US)</span></label>
                        <input
                          placeholder="BR"
                          value={publishForm.countries}
                          onChange={e => setPublishForm({ ...publishForm, countries: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Idade mín.</label>
                        <input
                          type="number"
                          value={publishForm.ageMin}
                          onChange={e => setPublishForm({ ...publishForm, ageMin: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Idade máx.</label>
                        <input
                          type="number"
                          value={publishForm.ageMax}
                          onChange={e => setPublishForm({ ...publishForm, ageMax: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {publishError && <p className="publish-error">{publishError}</p>}

                  <button
                    className={`btn-publish ${publishing ? 'loading' : ''}`}
                    onClick={handlePublish}
                    disabled={publishing || !publishForm.pageId || !publishForm.websiteUrl}
                  >
                    {publishing ? 'Publicando...' : 'Publicar no Meta Ads'}
                  </button>
                </>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
