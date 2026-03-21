import { pool } from '../../db';

const META_API_VERSION = 'v19.0';
const BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// Mapeia objetivo interno → objetivo Meta
const OBJECTIVE_MAP: Record<string, string> = {
  conversion: 'OUTCOME_SALES',
  awareness:  'OUTCOME_AWARENESS',
  engagement: 'OUTCOME_ENGAGEMENT',
  traffic:    'OUTCOME_TRAFFIC',
};

// Mapeia objetivo → evento de otimização e cobrança
const OPTIMIZATION_MAP: Record<string, { optimization_goal: string; billing_event: string }> = {
  conversion: { optimization_goal: 'OFFSITE_CONVERSIONS', billing_event: 'IMPRESSIONS' },
  awareness:  { optimization_goal: 'REACH',               billing_event: 'IMPRESSIONS' },
  engagement: { optimization_goal: 'POST_ENGAGEMENT',     billing_event: 'POST_ENGAGEMENT' },
  traffic:    { optimization_goal: 'LINK_CLICKS',         billing_event: 'LINK_CLICKS' },
};

// Mapeia CTA textual → tipo Meta
const CTA_MAP: Record<string, string> = {
  'saiba mais':       'LEARN_MORE',
  'compre agora':     'SHOP_NOW',
  'cadastre-se':      'SIGN_UP',
  'baixe agora':      'DOWNLOAD',
  'entre em contato': 'CONTACT_US',
  'assine':           'SUBSCRIBE',
};

function normalizeCta(cta: string): string {
  const lower = cta.toLowerCase();
  for (const [key, val] of Object.entries(CTA_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 'LEARN_MORE';
}

async function metaPost(path: string, token: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: token }),
  });
  const data = await res.json() as any;
  if (data.error) throw new Error(`Meta API: ${data.error.message}`);
  return data;
}

export interface PublishInput {
  userId: string;
  campaignId: string;   // ID interno da campanha salva
  platform: 'instagram' | 'facebook';
  pageId: string;        // Facebook Page ID
  websiteUrl: string;    // URL de destino do anúncio
  dailyBudget: number;   // em centavos (ex: 2000 = R$20,00)
  startTime: string;     // ISO date string
  endTime?: string;
  targeting: {
    countries: string[];
    ageMin?: number;
    ageMax?: number;
    genders?: number[];  // 1=masculino, 2=feminino
  };
}

export interface PublishResult {
  metaCampaignId: string;
  metaAdSetId: string;
  metaAdCreativeId: string;
  metaAdId: string;
}

export async function publishToMeta(input: PublishInput): Promise<PublishResult> {
  // 1. Buscar token e ad account do usuário
  const { rows } = await pool.query(
    `SELECT meta_access_token, meta_ad_account_id FROM profiles WHERE id = $1`,
    [input.userId]
  );
  const profile = rows[0];
  if (!profile?.meta_access_token) throw new Error('Meta não conectado');
  if (!profile?.meta_ad_account_id) throw new Error('Conta de anúncio não selecionada');

  const token = profile.meta_access_token as string;
  const adAccountId = profile.meta_ad_account_id as string;
  const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

  // 2. Buscar campanha interna
  const { rows: campRows } = await pool.query(
    `SELECT copies, product, platforms FROM campaigns WHERE id = $1 AND user_id = $2`,
    [input.campaignId, input.userId]
  );
  if (!campRows[0]) throw new Error('Campanha não encontrada');

  const copies = campRows[0].copies as Record<string, any>;
  const copy = copies[input.platform] ?? copies[Object.keys(copies)[0]];
  if (!copy) throw new Error('Nenhuma copy disponível para esta plataforma');

  // Detectar objetivo a partir da copy (fallback: traffic)
  const objective = 'traffic';
  const metaObjective = OBJECTIVE_MAP[objective];
  const { optimization_goal, billing_event } = OPTIMIZATION_MAP[objective];

  // 3. Criar Campaign
  const campaign = await metaPost(`/${actId}/campaigns`, token, {
    name: `[GrowthAi] ${campRows[0].product} - ${input.platform}`,
    objective: metaObjective,
    status: 'PAUSED',
    special_ad_categories: [],
  });

  // 4. Criar Ad Set
  const targeting: Record<string, unknown> = {
    geo_locations: { countries: input.targeting.countries },
  };
  if (input.targeting.ageMin) targeting.age_min = input.targeting.ageMin;
  if (input.targeting.ageMax) targeting.age_max = input.targeting.ageMax;
  if (input.targeting.genders?.length) targeting.genders = input.targeting.genders;

  const adSetBody: Record<string, unknown> = {
    name: `[GrowthAi] AdSet - ${input.platform}`,
    campaign_id: campaign.id,
    daily_budget: input.dailyBudget,
    billing_event,
    optimization_goal,
    targeting,
    status: 'PAUSED',
    start_time: input.startTime,
  };
  if (input.endTime) adSetBody.end_time = input.endTime;
  if (input.platform === 'instagram') {
    adSetBody.instagram_actor_id = input.pageId;
  }

  const adSet = await metaPost(`/${actId}/adsets`, token, adSetBody);

  // 5. Criar Ad Creative
  const creative = await metaPost(`/${actId}/adcreatives`, token, {
    name: `[GrowthAi] Creative - ${input.platform}`,
    object_story_spec: {
      page_id: input.pageId,
      link_data: {
        link: input.websiteUrl,
        message: copy.bodyText,
        name: copy.headline,
        call_to_action: {
          type: normalizeCta(copy.cta ?? ''),
          value: { link: input.websiteUrl },
        },
      },
    },
  });

  // 6. Criar Ad
  const ad = await metaPost(`/${actId}/ads`, token, {
    name: `[GrowthAi] Ad - ${input.platform}`,
    adset_id: adSet.id,
    creative: { creative_id: creative.id },
    status: 'PAUSED',
  });

  return {
    metaCampaignId: campaign.id,
    metaAdSetId: adSet.id,
    metaAdCreativeId: creative.id,
    metaAdId: ad.id,
  };
}
