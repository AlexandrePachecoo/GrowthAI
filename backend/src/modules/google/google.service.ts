import { pool } from '../../db';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';

export function buildOAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: GOOGLE_ADS_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }).toString(),
  });

  const data = await res.json() as any;
  if (data.error) throw new Error(data.error_description ?? data.error);
  if (!data.refresh_token) throw new Error('Refresh token não retornado. Verifique se o acesso offline foi solicitado.');
  return data;
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }).toString(),
  });

  const data = await res.json() as any;
  if (data.error) throw new Error(data.error_description ?? data.error);
  return data.access_token;
}

export async function fetchCustomerAccounts(refreshToken: string): Promise<{ id: string; name: string }[]> {
  const { GoogleAdsApi } = await import('google-ads-api');

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_DEVELOPER_TOKEN!,
  });

  const accessibleCustomers = await client.listAccessibleCustomers(refreshToken);

  return accessibleCustomers.resource_names.map((resourceName: string) => {
    const id = resourceName.replace('customers/', '');
    return { id, name: `Conta ${id}` };
  });
}

export async function saveGoogleTokens(
  userId: string,
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await pool.query(
    `UPDATE profiles
     SET google_access_token = $1, google_refresh_token = $2
     WHERE id = $3`,
    [accessToken, refreshToken, userId]
  );
}

export async function saveGoogleCustomerId(userId: string, customerId: string): Promise<void> {
  await pool.query(
    `UPDATE profiles SET google_customer_id = $1 WHERE id = $2`,
    [customerId, userId]
  );
}

export async function getGoogleStatus(userId: string): Promise<{
  connected: boolean;
  customerId: string | null;
}> {
  const result = await pool.query(
    `SELECT google_access_token, google_customer_id FROM profiles WHERE id = $1`,
    [userId]
  );
  const row = result.rows[0];
  return {
    connected: !!row?.google_access_token,
    customerId: row?.google_customer_id ?? null,
  };
}

export async function disconnectGoogle(userId: string): Promise<void> {
  await pool.query(
    `UPDATE profiles
     SET google_access_token = NULL, google_refresh_token = NULL, google_customer_id = NULL
     WHERE id = $1`,
    [userId]
  );
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT google_access_token, google_refresh_token FROM profiles WHERE id = $1`,
    [userId]
  );
  const profile = rows[0];
  if (!profile?.google_refresh_token) throw new Error('Google Ads não conectado');

  const newToken = await refreshAccessToken(profile.google_refresh_token);
  await pool.query(
    `UPDATE profiles SET google_access_token = $1 WHERE id = $2`,
    [newToken, userId]
  );
  return newToken;
}
