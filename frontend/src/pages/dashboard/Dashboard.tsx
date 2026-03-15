import { useState } from 'react';
import Layout from '../../components/Layout';
import './Dashboard.css';

const chartData: Record<string, number[]> = {
  ctr:      [30, 45, 40, 60, 50, 75, 55, 80, 70],
  cpc:      [80, 70, 75, 60, 65, 50, 60, 45, 55],
  gasto:    [20, 35, 45, 55, 60, 70, 65, 80, 75],
  orcamento:[10, 15, 12, 18, 14, 20, 16, 22, 18],
};

const metrics = [
  { key: 'ctr',       label: 'CTR',         value: '2,4%',    change: '↑ +0,3% hoje', type: 'positive' },
  { key: 'cpc',       label: 'CPC Médio',   value: 'R$0,50',  change: '↓ -R$0,05',    type: 'negative' },
  { key: 'gasto',     label: 'Gasto Total', value: 'R$100',   change: 'estável',       type: 'neutral'  },
  { key: 'orcamento', label: 'Orçamento',   value: 'R$2.000', change: '5% usado',      type: 'neutral'  },
];

const periods = ['Hoje', 'Semana', 'Últimos 30 dias', 'Últimos 90 dias'];

const platforms = [
  { name: 'Google Ads', initial: 'G', cls: 'google', pct: 45 },
  { name: 'Meta Ads',   initial: 'M', cls: 'meta',   pct: 35 },
  { name: 'TikTok Ads', initial: 'T', cls: 'tiktok', pct: 20 },
];

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

export default function Dashboard() {
  const [activeMetric, setActiveMetric] = useState('ctr');
  const [activePeriod, setActivePeriod] = useState('Semana');
  const { line, area, pts } = buildPath(chartData[activeMetric] ?? chartData.ctr);

  return (
    <Layout>
      <div className="dashboard">
        <div className="main-card">

          {/* Métricas como cards dentro do quadro */}
          <div className="metrics-row">
            {metrics.map(m => (
              <button
                key={m.key}
                className={`metric-card ${activeMetric === m.key ? 'active' : ''}`}
                onClick={() => setActiveMetric(m.key)}
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
                <h3>Cliques ao longo do dia</h3>
                <span className="live-badge">● ao vivo</span>
              </div>
              <div className="chart-area">
                <div className="y-axis">
                  {['500','400','300','200','100'].map(v => <span key={v}>{v}</span>)}
                </div>
                <div className="chart-inner">
                  <svg viewBox="0 0 500 100" preserveAspectRatio="none" className="line-svg">
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5B6AF5" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#5B6AF5" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={area} fill="url(#grad)" />
                    <path d={line} fill="none" stroke="#5B6AF5" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    {pts.map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="3.5" fill="#5B6AF5" stroke="#fff" strokeWidth="1.5" />
                    ))}
                  </svg>
                  <div className="x-axis">
                    {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => <span key={d}>{d}</span>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="vertical-divider" />

            {/* Plataformas + campanhas */}
            <div className="side-section">
              <div className="section-header">
                <span className="section-icon">◈</span>
                <h3>Por plataforma</h3>
              </div>
              {platforms.map(p => (
                <div key={p.name} className="platform-row">
                  <div className={`plat-icon ${p.cls}`}>{p.initial}</div>
                  <div className="plat-info">
                    <div className="plat-top">
                      <span>{p.name}</span>
                      <span className="plat-pct">{p.pct}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="card-divider" style={{ margin: '1rem 0' }} />

              <div className="section-header">
                <span className="section-icon">✦</span>
                <h3>Campanhas</h3>
              </div>
              {[['Campanha A','blue'],['Campanha B','green'],['Campanha C','red']].map(([name, color]) => (
                <div key={name} className="campaign-row">
                  <span className={`dot ${color}`} />{name}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Insight */}
        <div className="insight-card">
          <div className="insight-dot">✦</div>
          <div>
            <p className="insight-label">Insight da IA · GrowthAi</p>
            <p className="insight-body">
              O <strong>CTR da Campanha A</strong> subiu 0,3% nas últimas 3 horas. Considere
              aumentar o orçamento em <strong>+20%</strong> para maximizar o alcance antes das
              18h — horário de pico do seu público-alvo.
            </p>
          </div>
        </div>

      </div>
    </Layout>
  );
}
