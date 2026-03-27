import { Response } from 'express';
import { pool } from '../../db';
import { AuthRequest as Request } from '../../middleware/auth';
import {
  buildOAuthUrl,
  exchangeCodeForTokens,
  saveGoogleTokens,
  fetchCustomerAccounts,
  saveGoogleCustomerId,
  getGoogleStatus,
  disconnectGoogle,
  getValidAccessToken,
} from './google.service';
import { publishToGoogle } from './google-publish.service';

// GET /google/connect — retorna a URL de autorização do Google
export async function connectGoogle(req: Request, res: Response) {
  try {
    const url = buildOAuthUrl(req.userId!);
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /google/callback — chamado pelo Google após autorização
export async function googleCallback(req: Request, res: Response) {
  const { code, state: userId, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integracoes?google_error=${encodeURIComponent(error)}`
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveGoogleTokens(userId, tokens.access_token, tokens.refresh_token);
    return res.redirect(`${process.env.FRONTEND_URL}/integracoes?google_connected=1`);
  } catch (err: any) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integracoes?google_error=${encodeURIComponent(err.message)}`
    );
  }
}

// GET /google/status — verifica se o usuário está conectado
export async function googleStatus(req: Request, res: Response) {
  try {
    const status = await getGoogleStatus(req.userId!);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /google/customers — lista contas Google Ads acessíveis
export async function listCustomers(req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `SELECT google_refresh_token FROM profiles WHERE id = $1`,
      [req.userId!]
    );
    const refreshToken = rows[0]?.google_refresh_token;
    if (!refreshToken) return res.status(400).json({ error: 'Google Ads não conectado' });

    const accounts = await fetchCustomerAccounts(refreshToken);
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /google/customer — salva a conta escolhida
export async function selectCustomer(req: Request, res: Response) {
  const { customerId } = req.body;
  if (!customerId) return res.status(400).json({ error: 'customerId obrigatório' });

  try {
    await saveGoogleCustomerId(req.userId!, customerId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /google/disconnect — desconecta o Google Ads
export async function disconnect(req: Request, res: Response) {
  try {
    await disconnectGoogle(req.userId!);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /google/publish — publica uma campanha no Google Ads
export async function publish(req: Request, res: Response) {
  const { campaignId, websiteUrl, dailyBudgetMicros, startDate, endDate, countries } = req.body;

  if (!campaignId || !websiteUrl || !dailyBudgetMicros || !startDate || !countries) {
    return res.status(400).json({
      error: 'Campos obrigatórios: campaignId, websiteUrl, dailyBudgetMicros, startDate, countries',
    });
  }

  try {
    const result = await publishToGoogle({
      userId: req.userId!,
      campaignId,
      websiteUrl,
      dailyBudgetMicros,
      startDate,
      endDate,
      countries,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
