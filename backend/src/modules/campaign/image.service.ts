import puppeteer from 'puppeteer';
import sharp from 'sharp';

export interface CopyData {
  headline: string;
  bodyText: string;
  cta: string;
  hashtags: string[];
  imagePrompt: string;
}

export interface ProductInfo {
  name: string;
  audience: string;
  description: string;
}

export interface BrandInfo {
  colors: string[];
}

export interface GenerateImagesInput {
  platforms: string[];
  copies: Record<string, CopyData>;
  format?: 'carousel' | 'variants';
  product?: ProductInfo;
  brand?: BrandInfo;
  userLogo?: string;
  userImages?: string[];
  userPalette?: string[];
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
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width:${w}px; height:${h}px; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; }
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

// ── Template-based creative generation ───────────────────────────────────────

const VARIANT_TEMPLATES = [templateDiagonal, templateCircle, templateFrame, templateSplit, templateWatermark];
const CAROUSEL_TEMPLATES = [templateDiagonal, templateCircle, templateFrame, templateSplit];

function makeNicheStyle(colors: string[]): NicheStyle {
  const bg     = colors[0] ?? '#1a1a1a';
  const accent = colors[1] ?? '#5B6AF5';
  return {
    name: 'custom',
    bgColor: bg,
    textColor: isColorDark(bg) ? '#FFFFFF' : '#0A0A0A',
    accentColor: accent,
    templateType: 'diagonal',
  };
}

// ── Image processing ──────────────────────────────────────────────────────────

function extractBase64(dataUrl: string): { data: string; mime: string } {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (match) return { mime: match[1], data: match[2] };
  return { mime: 'image/png', data: dataUrl };
}

/**
 * Logo: trim solid-color borders + output as PNG (preserves transparency).
 * Falls back to original on any error.
 */
async function processLogo(base64: string): Promise<string> {
  try {
    const { data } = extractBase64(base64);
    const buffer = Buffer.from(data, 'base64');
    const out = await sharp(buffer)
      .trim({ threshold: 20 })
      .png()
      .toBuffer();
    return `data:image/png;base64,${out.toString('base64')}`;
  } catch {
    return base64;
  }
}

/**
 * Product image: trim solid borders with Sharp. Falls back to original on error.
 */
async function processProductImage(base64: string): Promise<string> {
  try {
    const { data } = extractBase64(base64);
    const buffer = Buffer.from(data, 'base64');
    const out = await sharp(buffer)
      .trim({ threshold: 20 })
      .png()
      .toBuffer();
    return `data:image/png;base64,${out.toString('base64')}`;
  } catch {
    return base64;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function injectLogo(html: string, logo: string, pad: number): string {
  const logoTag = `<img src="${logo}" style="position:fixed;top:${Math.round(pad*0.5)}px;right:${Math.round(pad*0.6)}px;height:${Math.round(pad*0.65)}px;max-width:${Math.round(pad*2.5)}px;object-fit:contain;z-index:999;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.35));" />`;
  return html.replace('</body>', `${logoTag}</body>`);
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
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'font' || req.resourceType() === 'stylesheet') {
        req.abort();
      } else {
        req.continue();
      }
    });
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 500));
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
  const {
    format = 'variants',
    brand   = { colors: [] },
    userLogo,
    userImages,
    userPalette,
  } = input;

  const [processedLogo, processedProductImage] = await Promise.all([
    userLogo        ? processLogo(userLogo)              : Promise.resolve(undefined),
    userImages?.[0] ? processProductImage(userImages[0]) : Promise.resolve(undefined),
  ]);

  const entries = await Promise.all(
    input.platforms.map(async (platform) => {
      const copy = input.copies[platform];
      if (!copy) throw new Error(`Nenhuma copy para a plataforma: ${platform}`);

      const { width, height } = getDimensions(platform);
      const colors = userPalette?.length ? userPalette : brand.colors.length ? brand.colors : ['#1a1a1a', '#5B6AF5'];
      const style  = makeNicheStyle(colors);
      const s      = getSizes(width, height);

      const templates = format === 'carousel' ? CAROUSEL_TEMPLATES : VARIANT_TEMPLATES;

      const images = await Promise.all(
        templates.map(async (tmpl) => {
          let html = tmpl(copy, style, width, height);
          if (processedLogo) html = injectLogo(html, processedLogo, s.pad);
          if (processedProductImage) {
            const imgTag = `<img src="${processedProductImage}" style="position:fixed;bottom:${Math.round(s.pad*0.4)}px;right:${Math.round(s.pad*0.4)}px;max-height:${Math.round(height*0.35)}px;max-width:${Math.round(width*0.3)}px;object-fit:contain;z-index:10;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.25));" />`;
            html = html.replace('</body>', `${imgTag}</body>`);
          }
          return renderCreative(html, width, height);
        }),
      );

      return [platform, images] as [string, string[]];
    }),
  );

  return Object.fromEntries(entries);
}
