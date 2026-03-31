import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useCampaign } from '../../contexts/CampaignContext';
import './Dashboard.css';

const periods = ['Hoje', 'Semana', 'Últimos 30 dias', 'Últimos 90 dias'];

const PLATFORM_MAP: Record<string, { initial: string; cls: string; label: string }> = {
  meta:      { initial: 'M', cls: 'meta',   label: 'Meta Ads'   },
  facebook:  { initial: 'M', cls: 'meta',   label: 'Meta Ads'   },
  instagram: { initial: 'M', cls: 'meta',   label: 'Meta Ads'   },
  google:    { initial: 'G', cls: 'google', label: 'Google Ads' },
  tiktok:    { initial: 'T', cls: 'tiktok', label: 'TikTok Ads' },
};

const PERIOD_X_LABELS: Record<string, string[]> = {
  'Hoje':           ['00h','03h','06h','09h','12h','15h','18h','21h','23h'],
  'Semana':         ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
  'Últimos 30 dias':['S1','S2','S3','S4','S5','S6','S7','S8','S9'],
  'Últimos 90 dias':['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set'],
};

function buildPath(data: number[]) {
  const W = 500, H = 100, pad = 6;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i): [number, number] => [
    (i / (data.length - 1)) * (W - pad * 2) + pad,
    H - ((v - min) / (max - min || 1)) * (H - pad * 2) - pad,
  ]);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  return { line, area, pts };
}

const EMPTY_CHART = Array(9).fill(50);

const metrics = [
  { key: 'ctr',   label: 'CTR',         value: '—',  change: 'sem dados', type: 'neutral' },
  { key: 'cpc',   label: 'CPC Médio',   value: '—',  change: 'sem dados', type: 'neutral' },
  { key: 'gasto', label: 'Gasto Total', value: 'R$0', change: 'sem dados', type: 'neutral' },
  { key: 'cliques', label: 'Cliques',   value: '0',  change: 'sem dados', type: 'neutral' },
];

const dotColors = ['blue', 'green', 'red', 'purple'];

export default function Dashboard() {
  const [activeMetric, setActiveMetric] = useState('ctr');
  const [activePeriod, setActivePeriod] = useState('Semana');
  const { selectedCampaign, campaigns } = useCampaign();
  const navigate = useNavigate();

  const { line, area, pts } = buildPath(EMPTY_CHART);
  const xLabels = PERIOD_X_LABELS[activePeriod] ?? PERIOD_X_LABELS['Semana'];

  // Plataformas da campanha selecionada (apenas para exibição)
  const platforms = (() => {
    if (!selectedCampaign) return [];
    const seen = new Set<string>();
    const active: { label: string; initial: string; cls: string }[] = [];
    for (const p of selectedCampaign.platforms) {
      const info = PLATFORM_MAP[p.toLowerCase()];
      if (info && !seen.has(info.label)) {
        seen.add(info.label);
        active.push(info);
      }
    }
    return active.map(p => ({ ...p, pct: Math.round(100 / active.length) }));
  })();

  const hasCampaign = !!selectedCampaign;

  return (
    <Layout>
      <div className="dashboard">
        <div className="main-card">

          {/* Métricas */}
          <div className="metrics-row">
            {metrics.map(m => (
              <button
                key={m.key}
                className={`metric-card ${activeMetric === m.key ? 'active' : ''} ${!hasCampaign ? 'empty' : ''}`}
                onClick={() => setActiveMetric(m.key)}
                disabled={!hasCampaign}
              >
                <span className="metric-label">{m.label}</span>
                <span className="metric-value">{m.value}</span>
                <span className={`metric-change ${m.type}`}>{m.change}</span>
              </button>
            ))}
          </div>

          <div className="card-divider" />

          {/* Tabs de período */}
          <div className="period-row">
            {periods.map(p => (
              <button
                key={p}
                className={`period-tab ${activePeriod === p ? 'active' : ''}`}
                onClick={() => setActivePeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="card-divider" />

          {/* Gráfico + plataformas */}
          <div className="dash-content">
            <div className="chart-section">
              <div className="section-header">
                <span className="section-icon">▦</span>
                <h3>
                  {metrics.find(m => m.key === activeMetric)?.label ?? 'Métrica'} ao longo do período
                  {selectedCampaign && (
                    <span className="chart-campaign-name"> · {selectedCampaign.name}</span>
                  )}
                </h3>
                {!hasCampaign && <span className="no-data-badge">sem dados</span>}
              </div>

              {hasCampaign ? (
                <div className="chart-empty-state">
                  <span>▦</span>
                  <p>Lance sua campanha para ver métricas reais aqui.</p>
                </div>
              ) : (
                <div className="chart-area chart-muted">
                  <div className="y-axis">
                    {['','','','',''].map((_, i) => <span key={i}>—</span>)}
                  </div>
                  <div className="chart-inner">
                    <svg viewBox="0 0 500 100" preserveAspectRatio="none" className="line-svg muted">
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e0e0e0" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#e0e0e0" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={area} fill="url(#grad)" />
                      <path d={line} fill="none" stroke="#e0e0e0" strokeWidth="2" strokeDasharray="6 4" />
                      {pts.map(([x, y], i) => (
                        <circle key={i} cx={x} cy={y} r="3" fill="#e0e0e0" />
                      ))}
                    </svg>
                    <div className="x-axis muted">
                      {xLabels.map(d => <span key={d}>{d}</span>)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="vertical-divider" />

            <div className="side-section">
              {platforms.length > 0 && (
                <>
                  <div className="section-header">
                    <span className="section-icon">◈</span>
                    <h3>Plataformas da campanha</h3>
                  </div>
                  {platforms.map(p => (
                    <div key={p.label} className="platform-row">
                      <div className={`plat-icon ${p.cls}`}>{p.initial}</div>
                      <div className="plat-info">
                        <div className="plat-top">
                          <span>{p.label}</span>
                          <span className="plat-pct plat-connected">conectado</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill bar-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="card-divider" style={{ margin: '1rem 0' }} />
                </>
              )}

              <div className="section-header">
                <span className="section-icon">✦</span>
                <h3>Campanhas</h3>
              </div>
              {campaigns.length > 0 ? campaigns.map((c, i) => (
                <div key={c.id} className={`campaign-row ${selectedCampaign?.id === c.id ? 'selected' : ''}`}>
                  <span className={`dot ${dotColors[i % dotColors.length]}`} />
                  {c.name}
                </div>
              )) : (
                <div className="no-campaigns-hint">
                  <p>Nenhuma campanha criada ainda.</p>
                  <button className="create-campaign-btn" onClick={() => navigate('/criativos')}>
                    Criar campanha
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Estado vazio — sem campanha */}
        {!hasCampaign && (
          <div className="insight-card insight-empty">
            <div className="insight-dot" style={{ background: '#e0e0e0' }}>◈</div>
            <div>
              <p className="insight-label" style={{ color: '#bbb' }}>Aguardando dados</p>
              <p className="insight-body">
                Crie e publique uma campanha para começar a ver métricas de performance aqui.
              </p>
            </div>
          </div>
        )}

        {/* Estado com campanha mas sem dados publicados */}
        {hasCampaign && (
          <div className="insight-card">
            <div className="insight-dot">✦</div>
            <div>
              <p className="insight-label">Insight da IA · GrowthAi</p>
              <p className="insight-body">
                A campanha <strong>{selectedCampaign.name}</strong> está configurada.
                Publique-a no Meta Ads ou Google Ads para começar a receber dados reais de performance.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
