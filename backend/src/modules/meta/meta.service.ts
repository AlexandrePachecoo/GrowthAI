import { pool } from '../../db';

const META_API_VERSION = 'v19.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export function buildOAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: process.env.META_REDIRECT_URI!,
    scope: 'ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,pages_manage_ads',
    response_type: 'code',
    state: userId,
  });
  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: process.env.META_REDIRECT_URI!,
    code,
  });

  const res = await fetch(`${META_GRAPH_URL}/oauth/access_token?${params.toString()}`);
  const data = await res.json() as any;

  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function getLongLivedToken(shortToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortToken,
  });

  const res = await fetch(`${META_GRAPH_URL}/oauth/access_token?${params.toString()}`);
  const data = await res.json() as any;

  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function fetchPages(accessToken: string): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `${META_GRAPH_URL}/me/accounts?fields=id,name&access_token=${accessToken}`
  );
  const data = await res.json() as any;

  if (data.error) throw new Error(data.error.message);
  return data.data ?? [];
}

export async function fetchAdAccounts(accessToken: string): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `${META_GRAPH_URL}/me/adaccounts?fields=id,name&access_token=${accessToken}`
  );
  const data = await res.json() as any;

  if (data.error) throw new Error(data.error.message);
  return data.data ?? [];
}

export async function saveMetaToken(
  userId: string,
  accessToken: string,
  expiresIn: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  await pool.query(
    `UPDATE profiles
     SET meta_access_token = $1, meta_token_expires_at = $2
     WHERE id = $3`,
    [accessToken, expiresAt, userId]
  );
}

export async function saveMetaAdAccount(userId: string, adAccountId: string): Promise<void> {
  await pool.query(
    `UPDATE profiles SET meta_ad_account_id = $1 WHERE id = $2`,
    [adAccountId, userId]
  );
}

export async function getMetaStatus(userId: string): Promise<{
  connected: boolean;
  adAccountId: string | null;
  expiresAt: string | null;
}> {
  const result = await pool.query(
    `SELECT meta_access_token, meta_token_expires_at, meta_ad_account_id FROM profiles WHERE id = $1`,
    [userId]
  );
  const row = result.rows[0];
  return {
    connected: !!row?.meta_access_token,
    adAccountId: row?.meta_ad_account_id ?? null,
    expiresAt: row?.meta_token_expires_at ?? null,
  };
}

export async function disconnectMeta(userId: string): Promise<void> {
  await pool.query(
    `UPDATE profiles
     SET meta_access_token = NULL, meta_token_expires_at = NULL, meta_ad_account_id = NULL
     WHERE id = $1`,
    [userId]
  );
}
