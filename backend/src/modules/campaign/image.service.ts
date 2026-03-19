import puppeteer from 'puppeteer';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface CopyData {
  headline: string;
  bodyText: string;
  cta: string;
  hashtags: string[];
  imagePrompt: string;
}

export interface GenerateImagesInput {
  platforms: string[];
  copies: Record<string, CopyData>;
  referenceImages?: string[];
}

const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number }> = {
  instagram:  { width: 1080, height: 1080 },
  tiktok:     { width: 1080, height: 1920 },
  facebook:   { width: 1200, height: 628 },
  linkedin:   { width: 1200, height: 627 },
  google_ads: { width: 1200, height: 628 },
};

function getDimensions(platform: string) {
  return PLATFORM_DIMENSIONS[platform] ?? { width: 1200, height: 628 };
}

type TemplateType = 'diagonal' | 'circle' | 'frame' | 'split' | 'watermark';

interface NicheStyle {
  name: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  templateType: TemplateType;
}

// ── Scaling ───────────────────────────────────────────────────────────────────

function getSizes(w: number, h: number) {
  if (w > h)  return { hl: 62, body: 23, cta: 20, pad: 64 };   // landscape
  if (w === h) return { hl: 80, body: 28, cta: 23, pad: 84 };  // square
  return              { hl: 80, body: 30, cta: 25, pad: 96 };  // portrait
}

function wrapHTML(bodyHTML: string, css: string, w: number, h: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width:${w}px; height:${h}px; overflow:hidden; font-family:'Inter',-apple-system,Arial,sans-serif; }
  ${css}
</style>
</head>
<body>${bodyHTML}</body>
</html>`;
}

// ── Template 1 — Diagonal ────────────────────────────────────────────────────
// Fundo principal + corte diagonal accent no canto inferior-direito.
// Textura de pontos no fundo. Linha de destaque acima do headline.
// Composição dinâmica, estilo campanha de vendas.

function templateDiagonal(copy: CopyData, style: NicheStyle, w: number, h: number): string {
  const s = getSizes(w, h);
  const cutW = Math.round(w * 0.60);
  const cutH = Math.round(h * 0.55);
  const gap  = Math.round(s.hl * 0.18);
  // dot pattern: hex + "1a" = ~10% opacity
  const dotColor = `${style.accentColor}1a`;

  const css = `
    .wrap {
      width:${w}px; height:${h}px; background:${style.bgColor};
      position:relative; overflow:hidden;
      background-image: radial-gradient(circle, ${dotColor} 1.5px, transparent 1.5px);
      background-size: 30px 30px;
    }
    .diag {
      position:absolute; bottom:0; right:0;
      width:${cutW}px; height:${cutH}px;
      background:${style.accentColor};
      clip-path:polygon(100% 0, 100% 100%, 0 100%);
    }
    /* small square accent top-left */
    .sq { position:absolute; top:0; left:0;
      width:${Math.round(s.pad * 0.55)}px; height:${Math.round(s.pad * 0.55)}px;
      background:${style.accentColor}; }
    .content {
      position:absolute; bottom:${s.pad}px; left:${s.pad}px;
      max-width:60%; z-index:1;
    }
    .line { width:${Math.round(w * 0.07)}px; height:3px; background:${style.accentColor}; margin-bottom:${Math.round(gap * 0.7)}px; }
    .hl { font-size:${s.hl}px; font-weight:900; color:${style.textColor}; line-height:1.04; letter-spacing:-0.025em; }
    .body { font-size:${s.body}px; color:${style.textColor}; opacity:0.72; margin-top:${gap}px; line-height:1.45; }
    .cta { font-size:${s.cta}px; font-weight:700; color:${style.accentColor};
      margin-top:${Math.round(gap * 1.3)}px; text-transform:uppercase; letter-spacing:0.09em; }
  `;
  return wrapHTML(`
    <div class="wrap">
      <div class="diag"></div>
      <div class="sq"></div>
      <div class="content">
        <div class="line"></div>
        <div class="hl">${copy.headline}</div>
        <div class="body">${copy.bodyText}</div>
        <div class="cta">${copy.cta} →</div>
      </div>
    </div>`, css, w, h);
}

// ── Template 2 — Circle ───────────────────────────────────────────────────────
// Grande círculo sólido sangrando pela direita + anel externo tracejado.
// Texto centralizado à esquerda. Moderno, marca-forward.

function templateCircle(copy: CopyData, style: NicheStyle, w: number, h: number): string {
  const s = getSizes(w, h);
  const circleSize = w > h ? Math.round(h * 0.88) : Math.round(Math.min(w,h) * 0.62);
  const ringSize   = Math.round(circleSize * 1.22);
  const cRight     = Math.round(circleSize * -0.24);
  const rRight     = Math.round(ringSize   * -0.24);
  const maxTW      = w > h ? Math.round(w * 0.48) : Math.round(w * 0.44);
  const gap        = Math.round(s.hl * 0.18);

  const css = `
    .wrap { width:${w}px; height:${h}px; background:${style.bgColor}; position:relative; overflow:hidden; }
    .ring {
      position:absolute; width:${ringSize}px; height:${ringSize}px; border-radius:50%;
      border:2px solid ${style.accentColor}; opacity:0.25;
      right:${rRight}px; top:50%; transform:translateY(-50%);
    }
    .circle {
      position:absolute; width:${circleSize}px; height:${circleSize}px; border-radius:50%;
      background:${style.accentColor};
      right:${cRight}px; top:50%; transform:translateY(-50%);
    }
    .content {
      position:absolute; left:${s.pad}px; top:50%; transform:translateY(-50%);
      max-width:${maxTW}px; z-index:1;
    }
    .hl { font-size:${s.hl}px; font-weight:900; color:${style.textColor}; line-height:1.04; letter-spacing:-0.025em; }
    .sep { width:${Math.round(w * 0.05)}px; height:2px; background:${style.accentColor}; margin:${gap}px 0; }
    .body { font-size:${s.body}px; color:${style.textColor}; opacity:0.72; line-height:1.45; }
    .cta { font-size:${s.cta}px; font-weight:700; color:${style.accentColor};
      margin-top:${Math.round(gap * 1.2)}px; text-transform:uppercase; letter-spacing:0.09em; }
  `;
  return wrapHTML(`
    <div class="wrap">
      <div class="ring"></div>
      <div class="circle"></div>
      <div class="content">
        <div class="hl">${copy.headline}</div>
        <div class="sep"></div>
        <div class="body">${copy.bodyText}</div>
        <div class="cta">${copy.cta} →</div>
      </div>
    </div>`, css, w, h);
}

// ── Template 3 — Frame ────────────────────────────────────────────────────────
// Borda accent ao redor de toda a área. Conteúdo centralizado dentro.
// Cantos com quadrados de destaque. Estilo pôster / editorial.

function templateFrame(copy: CopyData, style: NicheStyle, w: number, h: number): string {
  const s      = getSizes(w, h);
  const inset  = Math.round(Math.min(w, h) * 0.055);
  const corner = Math.round(inset * 0.75);
  const gap    = Math.round(s.hl * 0.18);

  const css = `
    .wrap {
      width:${w}px; height:${h}px; background:${style.accentColor};
      position:relative; overflow:hidden;
      display:flex; align-items:center; justify-content:center;
    }
    /* corner accents on the inner card */
    .inner {
      position:absolute;
      inset:${inset}px;
      background:${style.bgColor};
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      text-align:center; padding:${s.pad}px;
    }
    /* corner squares */
    .c1,.c2,.c3,.c4 {
      position:absolute; width:${corner}px; height:${corner}px; background:${style.accentColor};
    }
    .c1 { top:0; left:0; }
    .c2 { top:0; right:0; }
    .c3 { bottom:0; left:0; }
    .c4 { bottom:0; right:0; }
    .hl { font-size:${s.hl}px; font-weight:900; color:${style.textColor}; line-height:1.04; letter-spacing:-0.025em; }
    .body { font-size:${s.body}px; color:${style.textColor}; opacity:0.72; margin-top:${gap}px; line-height:1.45; }
    .cta-btn {
      display:inline-block; margin-top:${Math.round(gap * 1.6)}px;
      padding:${Math.round(s.cta * 0.55)}px ${Math.round(s.cta * 1.6)}px;
      background:${style.accentColor}; border-radius:${Math.round(s.cta * 0.45)}px;
      font-size:${s.cta}px; font-weight:700; color:${style.bgColor};
      text-transform:uppercase; letter-spacing:0.07em;
    }
  `;
  return wrapHTML(`
    <div class="wrap">
      <div class="inner">
        <div class="c1"></div><div class="c2"></div>
        <div class="c3"></div><div class="c4"></div>
        <div class="hl">${copy.headline}</div>
        <div class="body">${copy.bodyText}</div>
        <div class="cta-btn">${copy.cta} →</div>
      </div>
    </div>`, css, w, h);
}

// ── Template 4 — Split ────────────────────────────────────────────────────────
// Faixa accent no topo (CTA em destaque) + área principal com headline + body.
// Divisão horizontal cria urgência e hierarquia visual.

function templateSplit(copy: CopyData, style: NicheStyle, w: number, h: number): string {
  const s       = getSizes(w, h);
  const topH    = Math.round(h * (w > h ? 0.34 : 0.28));
  const gap     = Math.round(s.hl * 0.18);
  const ctaSize = Math.round(s.hl * (w > h ? 0.72 : 0.62));

  const css = `
    .wrap { width:${w}px; height:${h}px; display:flex; flex-direction:column; overflow:hidden; }
    .top {
      height:${topH}px; background:${style.accentColor};
      display:flex; align-items:center;
      padding:0 ${s.pad}px; flex-shrink:0;
    }
    .top-cta {
      font-size:${ctaSize}px; font-weight:900; color:${style.bgColor};
      line-height:1.05; letter-spacing:-0.02em;
    }
    .bottom {
      flex:1; background:${style.bgColor};
      display:flex; flex-direction:column; justify-content:center;
      padding:${Math.round(s.pad * 0.75)}px ${s.pad}px;
    }
    .hl { font-size:${s.hl}px; font-weight:900; color:${style.textColor}; line-height:1.04; letter-spacing:-0.025em; }
    .body { font-size:${s.body}px; color:${style.textColor}; opacity:0.72; margin-top:${gap}px; line-height:1.45; }
    .arrow {
      display:inline-block; margin-top:${Math.round(gap * 1.2)}px;
      font-size:${s.cta}px; font-weight:700; color:${style.accentColor};
      text-transform:uppercase; letter-spacing:0.09em;
    }
  `;
  return wrapHTML(`
    <div class="wrap">
      <div class="top">
        <div class="top-cta">${copy.cta}</div>
      </div>
      <div class="bottom">
        <div class="hl">${copy.headline}</div>
        <div class="body">${copy.bodyText}</div>
        <div class="arrow">Saiba mais →</div>
      </div>
    </div>`, css, w, h);
}

// ── Template 5 — Watermark ────────────────────────────────────────────────────
// Headline do produto repetida em tamanho gigante como textura de fundo
// (opacity 0.07). Conteúdo normal sobreposto. Muito usado em branding moderno.

function templateWatermark(copy: CopyData, style: NicheStyle, w: number, h: number): string {
  const s        = getSizes(w, h);
  const gap      = Math.round(s.hl * 0.18);
  const wmSize   = Math.round(Math.min(w, h) * (w > h ? 0.30 : 0.22));
  const words    = copy.headline.split(' ');
  const wmText   = words.slice(0, Math.min(2, words.length)).join(' ');

  const css = `
    .wrap { width:${w}px; height:${h}px; background:${style.bgColor}; position:relative; overflow:hidden; }
    .wm {
      position:absolute;
      font-size:${wmSize}px; font-weight:900;
      color:${style.textColor}; opacity:0.07;
      letter-spacing:-0.04em; line-height:0.9;
      bottom:${Math.round(wmSize * -0.08)}px;
      right:${Math.round(w * -0.04)}px;
      white-space:nowrap; pointer-events:none;
      text-transform:uppercase;
    }
    /* accent bar on left edge */
    .bar { position:absolute; top:0; left:0; width:6px; height:100%; background:${style.accentColor}; }
    .content {
      position:absolute; bottom:${s.pad}px; left:${Math.round(s.pad * 1.5)}px;
      max-width:72%; z-index:1;
    }
    .tag {
      display:inline-block; margin-bottom:${Math.round(gap * 0.7)}px;
      padding:${Math.round(s.cta * 0.3)}px ${Math.round(s.cta * 0.8)}px;
      background:${style.accentColor}; border-radius:3px;
      font-size:${Math.round(s.cta * 0.85)}px; font-weight:700;
      color:${style.bgColor}; text-transform:uppercase; letter-spacing:0.1em;
    }
    .hl { font-size:${s.hl}px; font-weight:900; color:${style.textColor}; line-height:1.04; letter-spacing:-0.025em; }
    .body { font-size:${s.body}px; color:${style.textColor}; opacity:0.72; margin-top:${gap}px; line-height:1.45; }
    .cta { font-size:${s.cta}px; font-weight:700; color:${style.accentColor};
      margin-top:${Math.round(gap * 1.3)}px; text-transform:uppercase; letter-spacing:0.09em; }
  `;
  return wrapHTML(`
    <div class="wrap">
      <div class="wm">${wmText}</div>
      <div class="bar"></div>
      <div class="content">
        <div class="tag">Novo</div>
        <div class="hl">${copy.headline}</div>
        <div class="body">${copy.bodyText}</div>
        <div class="cta">${copy.cta} →</div>
      </div>
    </div>`, css, w, h);
}

// ── Style analysis via Claude Haiku ──────────────────────────────────────────

async function analyzeNicheAndProposeStyles(copy: CopyData): Promise<NicheStyle[]> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    system: 'You output only valid JSON array. No markdown, no explanation.',
    messages: [{
      role: 'user',
      content: `You are a brand strategist specializing in digital advertising.

Analyze this product and propose 5 distinct color schemes for professional ad creatives.

Product headline: "${copy.headline}"
Product description: "${copy.bodyText}"

Return exactly 5 objects — one per templateType, each used exactly once:
- "diagonal"  — bold, dynamic
- "circle"    — modern, brand-focused
- "frame"     — editorial, poster-like
- "split"     — urgent, promotional
- "watermark" — contemporary branding

For each define:
- name: short style name in Portuguese (2-3 words)
- bgColor: solid hex — vivid, on-brand, NOT white/near-white/grey
- textColor: hex — high contrast with bgColor (usually #FFFFFF or #0A0A0A)
- accentColor: hex — contrasts with bgColor, used for shapes and CTA
- templateType: one of the 5 above

Rules:
- All 5 bgColors must use COMPLETELY DIFFERENT dominant hues
- Colors must match the product niche and target audience
- Strong contrast is required between bgColor and textColor

Return ONLY a JSON array of exactly 5 objects.`,
    }],
  });

  try {
    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const parsed = JSON.parse(text) as NicheStyle[];
    if (Array.isArray(parsed) && parsed.length === 5) return parsed;
    throw new Error('invalid');
  } catch {
    return [
      { name: 'Azul Dinâmico',    bgColor: '#1B3A6B', textColor: '#FFFFFF', accentColor: '#4A9EFF', templateType: 'diagonal'  },
      { name: 'Verde Moderno',    bgColor: '#1A5C35', textColor: '#FFFFFF', accentColor: '#6EE28A', templateType: 'circle'    },
      { name: 'Vermelho Urgente', bgColor: '#B81C1C', textColor: '#FFFFFF', accentColor: '#FFD700', templateType: 'frame'     },
      { name: 'Laranja Premium',  bgColor: '#C45000', textColor: '#FFFFFF', accentColor: '#FFE5C8', templateType: 'split'     },
      { name: 'Escuro Elegante',  bgColor: '#111827', textColor: '#F9FAFB', accentColor: '#818CF8', templateType: 'watermark' },
    ];
  }
}

// ── HTML dispatcher ───────────────────────────────────────────────────────────

function generateCreativeHTML(copy: CopyData, platform: string, style: NicheStyle): string {
  const { width, height } = getDimensions(platform);
  const builders: Record<TemplateType, (c: CopyData, s: NicheStyle, w: number, h: number) => string> = {
    'diagonal':  templateDiagonal,
    'circle':    templateCircle,
    'frame':     templateFrame,
    'split':     templateSplit,
    'watermark': templateWatermark,
  };
  return (builders[style.templateType] ?? templateDiagonal)(copy, style, width, height);
}

// ── Puppeteer ─────────────────────────────────────────────────────────────────

let browserInstance: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }
  return browserInstance;
}

async function renderCreative(html: string, width: number, height: number): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1200));
    const buffer = await page.screenshot({ type: 'png', encoding: 'base64' }) as string;
    return `data:image/png;base64,${buffer}`;
  } finally {
    await page.close();
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateCampaignImages(
  input: GenerateImagesInput,
): Promise<Record<string, string[]>> {
  const entries = await Promise.all(
    input.platforms.map(async (platform) => {
      const copy = input.copies[platform];
      if (!copy) throw new Error(`Nenhuma copy para a plataforma: ${platform}`);

      const { width, height } = getDimensions(platform);
      const styles = await analyzeNicheAndProposeStyles(copy);

      const variants = await Promise.all(
        styles.map(async (style) => {
          const html = generateCreativeHTML(copy, platform, style);
          return renderCreative(html, width, height);
        }),
      );

      return [platform, variants] as [string, string[]];
    }),
  );

  return Object.fromEntries(entries);
}
