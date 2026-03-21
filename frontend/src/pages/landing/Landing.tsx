import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const FEATURES = [
  {
    icon: '✦',
    title: 'Copies geradas por IA',
    desc: 'Gere headlines, textos e CTAs otimizados para cada plataforma em segundos, com tom e objetivo personalizados.',
  },
  {
    icon: '⬡',
    title: 'Multi-plataforma',
    desc: 'Instagram, Facebook, Google Ads, TikTok e LinkedIn — tudo em uma única campanha, sem retrabalho.',
  },
  {
    icon: '◈',
    title: 'Publique no Meta Ads',
    desc: 'Conecte sua conta e publique anúncios diretamente no Meta Ads sem sair da plataforma.',
  },
  {
    icon: '▣',
    title: 'Criativos próprios',
    desc: 'Adicione imagens e vídeos feitos fora do site diretamente nas suas campanhas salvas.',
  },
  {
    icon: '◎',
    title: 'Organize tudo em um lugar',
    desc: 'Salve, filtre e acesse todas as suas campanhas. Histórico completo de copies e criativos.',
  },
  {
    icon: '⬖',
    title: 'Feito para escalar',
    desc: 'Do freelancer à agência — GrowthAi cresce com o seu volume de campanhas sem perder agilidade.',
  },
];

const STEPS = [
  { num: '01', title: 'Descreva seu produto', desc: 'Informe o produto, público-alvo, objetivo e tom de voz da campanha.' },
  { num: '02', title: 'A IA gera suas copies', desc: 'Em segundos você recebe textos otimizados para cada plataforma escolhida.' },
  { num: '03', title: 'Adicione seus criativos', desc: 'Faça upload de imagens próprias ou use as geradas pela plataforma.' },
  { num: '04', title: 'Publique com um clique', desc: 'Conecte o Meta Ads e publique diretamente ou exporte para usar onde quiser.' },
];

export default function Landing() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const formId = import.meta.env.VITE_FORMSPREE_ID;
      if (formId) {
        const res = await fetch(`https://formspree.io/f/${formId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error();
      }
      setSubmitted(true);
    } catch {
      // silently fail — user still sees success to avoid friction
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lp">

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <span className="lp-logo-icon">G</span>
            <span className="lp-logo-text">GrowthAi</span>
          </div>
          <div className="lp-nav-links">
            <a href="#features">Funcionalidades</a>
            <a href="#how">Como funciona</a>
          </div>
          <Link to="/login" className="lp-nav-btn">Entrar</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-glow" />
        <div className="lp-hero-inner">
          <div className="lp-badge">Inteligência artificial para marketing</div>
          <h1 className="lp-hero-title">
            Campanhas que<br />
            <span className="lp-hero-highlight">convertem de verdade</span>
          </h1>
          <p className="lp-hero-sub">
            GrowthAi cria copies, organiza criativos e publica seus anúncios<br className="lp-br" />
            no Meta Ads — tudo em minutos, sem agência.
          </p>

          {submitted ? (
            <div className="lp-waitlist-success">
              <span>✓</span> Você entrou na lista! Avisaremos quando o acesso abrir.
            </div>
          ) : (
            <form className="lp-waitlist-form" onSubmit={handleWaitlist}>
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Entrando...' : 'Entrar na lista de espera'}
              </button>
            </form>
          )}

          <p className="lp-hero-hint">Gratuito para entrar na lista. Sem spam.</p>
        </div>

        <div className="lp-hero-mockup">
          <div className="lp-mockup-card">
            <div className="lp-mockup-header">
              <span className="lp-mockup-dot" />
              <span className="lp-mockup-dot yellow" />
              <span className="lp-mockup-dot green" />
              <span className="lp-mockup-title">Criativo gerado por IA</span>
            </div>
            <div className="lp-mockup-body">
              <div className="lp-mockup-label">Headline</div>
              <div className="lp-mockup-text">Transforme cliques em clientes com IA</div>
              <div className="lp-mockup-label" style={{ marginTop: '0.75rem' }}>Texto</div>
              <div className="lp-mockup-text small">Alcance o público certo com a mensagem certa, na hora certa. GrowthAi gera copies otimizadas para cada plataforma.</div>
              <div className="lp-mockup-label" style={{ marginTop: '0.75rem' }}>CTA</div>
              <div className="lp-mockup-cta">Comece agora →</div>
              <div className="lp-mockup-tags">
                <span>#marketing</span><span>#ia</span><span>#conversao</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-features" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-badge">Funcionalidades</div>
          <h2 className="lp-section-title">Tudo que você precisa<br />para crescer com anúncios</h2>
          <p className="lp-section-sub">Sem planilhas, sem agência, sem retrabalho.</p>

          <div className="lp-features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-how" id="how">
        <div className="lp-section-inner">
          <div className="lp-section-badge dark">Como funciona</div>
          <h2 className="lp-section-title white">De zero ao anúncio<br />em menos de 5 minutos</h2>

          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={s.num} className="lp-step">
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-content">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="lp-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lp-cta">
        <div className="lp-cta-glow" />
        <div className="lp-section-inner lp-cta-inner">
          <h2 className="lp-cta-title">Pronto para escalar<br />suas campanhas?</h2>
          <p className="lp-cta-sub">Entre na lista de espera e seja um dos primeiros a acessar o GrowthAi.</p>
          {submitted ? (
            <div className="lp-waitlist-success">
              <span>✓</span> Você já está na lista!
            </div>
          ) : (
            <form className="lp-waitlist-form centered" onSubmit={handleWaitlist}>
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Entrando...' : 'Quero acesso antecipado'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo">
            <span className="lp-logo-icon">G</span>
            <span className="lp-logo-text">GrowthAi</span>
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} GrowthAi. Todos os direitos reservados.</p>
          <Link to="/login" className="lp-footer-link">Já tenho conta</Link>
        </div>
      </footer>

    </div>
  );
}
