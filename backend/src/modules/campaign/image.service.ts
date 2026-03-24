import puppeteer from 'puppeteer';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

// ── AI landing page generation ────────────────────────────────────────────────

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
 * Product image: ask Claude Vision for the main-subject bounding box,
 * then crop + lightly enhance with Sharp. Falls back to original on error.
 */
async function processProductImage(base64: string): Promise<string> {
  try {
    const { data, mime } = extractBase64(base64);

    // Ask Claude where the main subject is
    const vision = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mime as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data },
          },
          {
            type: 'text',
            text: 'Return ONLY valid JSON — no markdown — with the bounding box of the most important/relevant product or subject in the image, as integer percentages: {"left":0,"top":0,"width":100,"height":100}. Add small padding so nothing is clipped.',
          },
        ],
      }],
    });

    const raw = (vision.content[0] as { type: string; text: string }).text
      .replace(/```(?:json)?\s*/gi, '')
      .replace(/```/g, '')
      .trim();
    const bbox = JSON.parse(raw) as { left: number; top: number; width: number; height: number };

    const buffer = Buffer.from(data, 'base64');
    const meta = await sharp(buffer).metadata();
    const imgW = meta.width  ?? 1000;
    const imgH = meta.height ?? 1000;

    const left   = Math.max(0, Math.round(imgW * bbox.left   / 100));
    const top    = Math.max(0, Math.round(imgH * bbox.top    / 100));
    const width  = Math.min(imgW - left, Math.round(imgW * bbox.width  / 100));
    const height = Math.min(imgH - top,  Math.round(imgH * bbox.height / 100));

    const out = await sharp(buffer)
      .extract({ left, top, width, height })
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

const CAROUSEL_DIRECTIVES = [
  `SLIDE 1 — Hero: same visual identity as the other slides.
  - Background: color1 solid
  - Slide number "01 / 04" top-right (small, color2, opacity 0.6)
  - Center content: product name as small badge (border color2, text color2, border-radius 999px), then headline in large bold (font-size ~9% of height, textColor), then a pill CTA button (background color2, contrasting text)
  - Decorative: large semi-transparent circle (color2, opacity 0.07) top-right corner`,

  `SLIDE 2 — Feature: same visual identity as the other slides.
  - Background: color2 solid
  - Slide number "02 / 04" top-right (small, contrasting, opacity 0.6)
  - Left-aligned content with generous padding: bold overline text ("Por que escolher?" in small caps, contrasting color), headline in large bold (contrasting to color2), body text below (opacity 0.75)
  - Thin horizontal line (contrasting, 60px, 3px) between overline and headline`,

  `SLIDE 3 — Benefits: same visual identity as the other slides.
  - Background: color1 solid
  - Slide number "03 / 04" top-right (small, color2, opacity 0.6)
  - Centered content: headline in large bold (textColor), then 3 benefit lines derived from the body text, each prefixed by a colored bullet "●" (color2), evenly spaced
  - Thin accent line below headline (color2, 50px, 3px)`,

  `SLIDE 4 — CTA: same visual identity as the other slides.
  - Background: color2 solid
  - Slide number "04 / 04" top-right (small, contrasting, opacity 0.6)
  - Center content: bold short phrase "Pronto para começar?" (large, contrasting), headline below (medium, contrasting, opacity 0.85), large pill CTA button (background color1, contrasting text, border-radius 999px, padding 16px 48px, font-weight 800)
  - Decorative: large semi-transparent circle (color1, opacity 0.08) bottom-left corner`,
];

const LAYOUT_DIRECTIVES = [
  `LAYOUT: Full-bleed centered hero.
  - Background: color1 solid
  - Top center: small pill badge (border 1.5px color2, text color2, border-radius 999px) with the product name
  - Center: headline in very large bold font (font-size ~10% of height), textColor
  - Below headline: body text (font-size ~1.8% of height), opacity 0.75
  - Below body: pill CTA button (background color2, contrasting text, border-radius 999px, padding 14px 40px, font-weight 700)
  - Decorative: two large semi-transparent circles (color2, opacity 0.08) top-right and bottom-left`,

  `LAYOUT: Left-right vertical split.
  - Left panel (45% width): solid color2, vertically centered, contains CTA text in large bold and a small subtitle line
  - Right panel (55% width): color1, vertically centered, contains headline, body text, and solid rectangular CTA button (background color2, border-radius 8px)
  - Thin vertical line (2px, semi-transparent) separates the panels`,

  `LAYOUT: Elevated card on vivid background.
  - Background: color2 solid with subtle dot grid (radial-gradient, 1px dots, 28px spacing)
  - Center: card (border-radius 16px, box-shadow 0 24px 64px rgba(0,0,0,.35)) containing all content
  - Inside card: overline text (color2, small, uppercase), headline (large bold), divider line (color2, 40px, 3px), body text, CTA button (background color2, border-radius 8px)`,

  `LAYOUT: Bold top-band with content below.
  - Top band (32% of height): solid color2, vertically centered CTA phrase in large bold (font-size ~7% of height, font-weight 900)
  - Bottom section (68%): color1, left-aligned content with padding
  - Bottom: headline (large bold, textColor), body text (opacity 0.7), CTA button (background color2, border-radius 6px)
  - Thin horizontal line (color2, full width, 3px) separates band from bottom`,

  `LAYOUT: Typographic poster.
  - Background: color1 solid
  - Behind content: first word of headline as HUGE decorative text (font-size ~55% of height, font-weight 900, color1 slightly lighter/darker, opacity 0.08, position absolute)
  - Foreground left-aligned: small pill badge (border color2, color2 text), headline (large bold, textColor), thin accent line (color2, 50px, 3px), body text (opacity 0.68), outlined CTA button (border 2px color2, color2 text, transparent bg, border-radius 6px)`,
];

async function generateLandingPage(
  copy: CopyData,
  width: number,
  height: number,
  layoutIndex: number,
  product: ProductInfo,
  brand: BrandInfo,
  mode: 'variants' | 'carousel' = 'variants',
  userLogo?: string,
  productImage?: string,
): Promise<string> {
  const palette   = brand.colors.length >= 2 ? brand.colors : ['#111827', '#5B6AF5', '#ffffff'];
  const color1    = palette[0];
  const color2    = palette[1] ?? palette[0];
  const textColor = isColorDark(color1) ? '#FFFFFF' : '#0A0A0A';

  const directives = mode === 'carousel' ? CAROUSEL_DIRECTIVES : LAYOUT_DIRECTIVES;
  const layout = directives[layoutIndex]
    .replace(/color1/g, color1)
    .replace(/color2/g, color2)
    .replace(/textColor/g, textColor);

  const assetNotes: string[] = [];
  if (productImage) {
    assetNotes.push(`- A product image is available. Embed it using exactly this src: __PRODUCT_IMG__
  Place it prominently in the layout (e.g. as a mockup/screenshot on one side, or centered above the CTA).
  Style it with object-fit:contain, max-width/max-height that fits the design, and optionally a subtle drop-shadow or rounded corners.`);
  }
  if (userLogo) {
    assetNotes.push(`- A brand logo is available. Embed it using exactly this src: __LOGO__
  Place it at the top of the creative (top-left or top-center), small (height ~5% of total height), with object-fit:contain.`);
  }
  const assetSection = assetNotes.length
    ? `\n--- ASSETS (use these placeholders as <img src="..."> — they will be replaced) ---\n${assetNotes.join('\n')}\n`
    : '';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: 'You output only a complete valid HTML document. No markdown, no code fences, no explanation. Never use Google Fonts or any external resources.',
    messages: [{
      role: 'user',
      content: `Create an HTML page of exactly ${width}x${height}px.

--- CONTENT (use ONLY these texts — do NOT invent, add, or modify any copy, numbers, claims, or phrases) ---
Product name: ${product.name || 'Product'}
Headline: "${copy.headline}"
Body text: "${copy.bodyText}"
CTA button text: "${copy.cta}"

--- COLORS ---
color1 (primary background): ${color1}
color2 (accent / buttons): ${color2}
text color on color1: ${textColor}
${assetSection}
--- LAYOUT INSTRUCTIONS (follow exactly) ---
${layout}

--- TECHNICAL REQUIREMENTS ---
- CRITICAL: Every word of visible text in the HTML must come verbatim from the CONTENT section above. No extra slogans, numbers, percentages, claims, badges, or phrases of any kind.
- Use ONLY system fonts: font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif
- No external resources (no Google Fonts, no CDN). The only <img> tags allowed are the asset placeholders above.
- html, body: width ${width}px; height ${height}px; margin 0; padding 0; overflow hidden
- All text must be visible, inside bounds, with strong contrast against its background
- Use inline <style> block only, no JavaScript

Return ONLY the complete HTML document starting with <!DOCTYPE html>.`,
    }],
  });

  let html = (response.content[0] as { type: string; text: string }).text.trim();
  html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim();

  if (productImage) html = html.replace(/src="__PRODUCT_IMG__"/g, `src="${productImage}"`);
  if (userLogo)     html = html.replace(/src="__LOGO__"/g, `src="${userLogo}"`);

  return html;
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
    product = { name: '', audience: '', description: '' },
    brand   = { colors: [] },
    userLogo,
    userImages,
    userPalette,
  } = input;

  // Pre-process images before generating creatives
  const [processedLogo, processedProductImage] = await Promise.all([
    userLogo         ? processLogo(userLogo)                  : Promise.resolve(undefined),
    userImages?.[0]  ? processProductImage(userImages[0])     : Promise.resolve(undefined),
  ]);

  const entries = await Promise.all(
    input.platforms.map(async (platform) => {
      const copy = input.copies[platform];
      if (!copy) throw new Error(`Nenhuma copy para a plataforma: ${platform}`);

      const { width, height } = getDimensions(platform);
      const mergedBrand: BrandInfo = { colors: userPalette?.length ? userPalette : brand.colors };

      if (format === 'carousel') {
        const slides = await Promise.all(
          [0, 1, 2, 3].map(i =>
            generateLandingPage(copy, width, height, i, product, mergedBrand, 'carousel', processedLogo, processedProductImage),
          ),
        );
        const images = await Promise.all(slides.map(html => renderCreative(html, width, height)));
        return [platform, images] as [string, string[]];
      }

      const variants = await Promise.all(
        [0, 1, 2, 3, 4].map(async (i) => {
          const html = await generateLandingPage(copy, width, height, i, product, mergedBrand, 'variants', processedLogo, processedProductImage);
          return renderCreative(html, width, height);
        }),
      );

      return [platform, variants] as [string, string[]];
    }),
  );

  return Object.fromEntries(entries);
}
