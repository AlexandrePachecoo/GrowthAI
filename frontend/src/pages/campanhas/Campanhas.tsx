import Layout from '../../components/Layout';
import './Campanhas.css';

const campanhas = [
  { id: 1, name: 'Campanha A', platform: 'Instagram', status: 'ativa', ctr: '2,4%', cpc: 'R$0,50', gasto: 'R$40', orcamento: 'R$800' },
  { id: 2, name: 'Campanha B', platform: 'Google Ads', status: 'ativa', ctr: '1,8%', cpc: 'R$0,70', gasto: 'R$35', orcamento: 'R$700' },
  { id: 3, name: 'Campanha C', platform: 'Meta Ads', status: 'pausada', ctr: '1,2%', cpc: 'R$0,90', gasto: 'R$25', orcamento: 'R$500' },
];

export default function Campanhas() {
  return (
    <Layout>
      <div className="campanhas">
        <div className="page-header">
          <div>
            <h1>Campanhas</h1>
            <p className="page-subtitle">Gerencie suas campanhas ativas</p>
          </div>
          <button className="btn-new">+ Nova Campanha</button>
        </div>

        <div className="campaigns-table">
          <div className="table-header">
            <span>Nome</span>
            <span>Plataforma</span>
            <span>Status</span>
            <span>CTR</span>
            <span>CPC</span>
            <span>Gasto</span>
            <span>Orçamento</span>
            <span>Ações</span>
          </div>

          {campanhas.map(c => (
            <div key={c.id} className="table-row">
              <span className="campaign-name">{c.name}</span>
              <span className="platform-badge">{c.platform}</span>
              <span className={`status-badge ${c.status}`}>{c.status}</span>
              <span>{c.ctr}</span>
              <span>{c.cpc}</span>
              <span>{c.gasto}</span>
              <span>{c.orcamento}</span>
              <div className="actions">
                <button className="action-btn">✎</button>
                <button className="action-btn danger">✕</button>
              </div>
            </div>
          ))}
        </div>

        <div className="insight-card">
          <div className="insight-icon">✦</div>
          <div>
            <p className="insight-title">Insight da IA · GrowthAi</p>
            <p className="insight-text">
              A <strong>Campanha C</strong> está pausada há 2 dias. Com base no histórico, reativá-la às 18h pode aumentar o CTR em até 15%.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
