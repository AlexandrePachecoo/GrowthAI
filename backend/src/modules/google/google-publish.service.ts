import { pool } from '../../db';
import { getValidAccessToken } from './google.service';

const GOOGLE_ADS_API_VERSION = 'v17';
const BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

// Mapeia objetivo interno → objetivo Google Ads
const OBJECTIVE_MAP: Record<string, string> = {
  conversion:  'SALES',
  awareness:   'BRAND_AWARENESS_AND_REACH',
  engagement:  'ENGAGEMENT',
  traffic:     'WEBSITE_TRAFFIC',
};

async function googlePost(
  path: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_DEVELOPER_TOKEN!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json() as any;
  if (data.error) throw new Error(`Google Ads API: ${data.error.message}`);
  return data;
}

export interface GooglePublishInput {
  userId: string;
  campaignId: string;
  websiteUrl: string;
  dailyBudgetMicros: number; // em micros (1 BRL = 1_000_000 micros)
  startDate: string;         // formato YYYY-MM-DD
  endDate?: string;
  countries: string[];       // ex: ['BR']
}

export interface GooglePublishResult {
  googleCampaignId: string;
  googleAdGroupId: string;
  googleAdId: string;
}

export async function publishToGoogle(input: GooglePublishInput): Promise<GooglePublishResult> {
  // 1. Buscar customer ID e obter access token renovado
  const { rows } = await pool.query(
    `SELECT google_customer_id FROM profiles WHERE id = $1`,
    [input.userId]
  );
  const profile = rows[0];
  if (!profile?.google_customer_id) throw new Error('Conta Google Ads não selecionada');

  const customerId = profile.google_customer_id as string;
  const accessToken = await getValidAccessToken(input.userId);

  // 2. Buscar dados da campanha interna
  const { rows: campRows } = await pool.query(
    `SELECT copies, product FROM campaigns WHERE id = $1 AND user_id = $2`,
    [input.campaignId, input.userId]
  );
  if (!campRows[0]) throw new Error('Campanha não encontrada');

  const copies = campRows[0].copies as Record<string, any>;
  const copy = copies['google_ads'] ?? copies[Object.keys(copies)[0]];
  if (!copy) throw new Error('Nenhuma copy disponível');

  const objective = 'traffic';
  const advertisingChannelType = 'SEARCH';

  // 3. Criar Budget
  const budgetRes = await googlePost(
    `/customers/${customerId}/campaignBudgets:mutate`,
    accessToken,
    {
      operations: [{
        create: {
          name: `[GrowthAi] Budget - ${campRows[0].product}`,
          amountMicros: input.dailyBudgetMicros,
          deliveryMethod: 'STANDARD',
        },
      }],
    }
  );
  const budgetResourceName = budgetRes.results[0].resourceName;

  // 4. Criar Campaign
  const campaignBody: Record<string, unknown> = {
    name: `[GrowthAi] ${campRows[0].product}`,
    advertisingChannelType,
    campaignBudget: budgetResourceName,
    status: 'PAUSED',
    networkSettings: {
      targetGoogleSearch: true,
      targetSearchNetwork: true,
    },
    startDate: input.startDate,
  };
  if (input.endDate) campaignBody.endDate = input.endDate;

  const campaignRes = await googlePost(
    `/customers/${customerId}/campaigns:mutate`,
    accessToken,
    { operations: [{ create: campaignBody }] }
  );
  const campaignResourceName = campaignRes.results[0].resourceName;
  const googleCampaignId = campaignResourceName.split('/').pop()!;

  // 5. Criar Ad Group
  const adGroupRes = await googlePost(
    `/customers/${customerId}/adGroups:mutate`,
    accessToken,
    {
      operations: [{
        create: {
          name: `[GrowthAi] AdGroup - ${campRows[0].product}`,
          campaign: campaignResourceName,
          status: 'ENABLED',
          cpcBidMicros: 1_000_000, // R$1,00 default
        },
      }],
    }
  );
  const adGroupResourceName = adGroupRes.results[0].resourceName;
  const googleAdGroupId = adGroupResourceName.split('/').pop()!;

  // 6. Criar Responsive Search Ad
  const adRes = await googlePost(
    `/customers/${customerId}/ads:mutate`,
    accessToken,
    {
      operations: [{
        create: {
          adGroup: adGroupResourceName,
          status: 'PAUSED',
          ad: {
            finalUrls: [input.websiteUrl],
            responsiveSearchAd: {
              headlines: [
                { text: copy.headline?.slice(0, 30) ?? 'Conheça nosso produto' },
                { text: copy.subheadline?.slice(0, 30) ?? 'Oferta especial' },
                { text: campRows[0].product?.slice(0, 30) ?? 'Saiba mais' },
              ],
              descriptions: [
                { text: copy.bodyText?.slice(0, 90) ?? 'Clique e saiba mais sobre nossos produtos.' },
                { text: copy.cta?.slice(0, 90) ?? 'Acesse nosso site agora.' },
              ],
            },
          },
        },
      }],
    }
  );
  const adResourceName = adRes.results[0].resourceName;
  const googleAdId = adResourceName.split('/').pop()!;

  return { googleCampaignId, googleAdGroupId, googleAdId };
}
