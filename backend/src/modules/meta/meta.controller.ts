import { Response } from 'express';
import { pool } from '../../db';
import { AuthRequest as Request } from '../../middleware/auth';
import {
  buildOAuthUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  fetchAdAccounts,
  fetchPages,
  saveMetaToken,
  saveMetaAdAccount,
  getMetaStatus,
  disconnectMeta,
} from './meta.service';
import { publishToMeta } from './meta-publish.service';

// GET /meta/connect — retorna a URL de autorização do Meta
export async function connectMeta(req: Request, res: Response) {
  try {
    const url = buildOAuthUrl(req.userId!);
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /meta/callback — chamado pelo Meta após autorização
export async function metaCallback(req: Request, res: Response) {
  const { code, state: userId, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integracoes?meta_error=${encodeURIComponent(error)}`
    );
  }

  try {
    const shortToken = await exchangeCodeForToken(code);
    const longToken = await getLongLivedToken(shortToken.access_token);
    await saveMetaToken(userId, longToken.access_token, longToken.expires_in);

    return res.redirect(`${process.env.FRONTEND_URL}/integracoes?meta_connected=1`);
  } catch (err: any) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integracoes?meta_error=${encodeURIComponent(err.message)}`
    );
  }
}

// GET /meta/status — verifica se o usuário está conectado
export async function metaStatus(req: Request, res: Response) {
  try {
    const status = await getMetaStatus(req.userId!);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /meta/ad-accounts — lista as contas de anúncio disponíveis
export async function listAdAccounts(req: Request, res: Response) {
  try {
    const result = await pool.query(
      'SELECT meta_access_token FROM profiles WHERE id = $1',
      [req.userId!]
    );
    const token = result.rows[0]?.meta_access_token;

    if (!token) {
      return res.status(400).json({ error: 'Meta não conectado' });
    }

    const accounts = await fetchAdAccounts(token);
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /meta/pages — lista as páginas do Facebook do usuário
export async function listPages(req: Request, res: Response) {
  try {
    const result = await pool.query(
      'SELECT meta_access_token FROM profiles WHERE id = $1',
      [req.userId!]
    );
    const token = result.rows[0]?.meta_access_token;
    if (!token) return res.status(400).json({ error: 'Meta não conectado' });

    const pages = await fetchPages(token);
    res.json(pages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /meta/ad-account — salva a conta de anúncio escolhida
export async function selectAdAccount(req: Request, res: Response) {
  const { adAccountId } = req.body;
  if (!adAccountId) return res.status(400).json({ error: 'adAccountId obrigatório' });

  try {
    await saveMetaAdAccount(req.userId!, adAccountId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /meta/disconnect — desconecta o Meta
export async function disconnect(req: Request, res: Response) {
  try {
    await disconnectMeta(req.userId!);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /meta/publish — publica um anúncio no Meta Ads
export async function publish(req: Request, res: Response) {
  const { campaignId, platform, pageId, websiteUrl, dailyBudget, startTime, endTime, targeting } = req.body;

  if (!campaignId || !platform || !pageId || !websiteUrl || !dailyBudget || !startTime || !targeting) {
    return res.status(400).json({ error: 'Campos obrigatórios: campaignId, platform, pageId, websiteUrl, dailyBudget, startTime, targeting' });
  }

  try {
    const result = await publishToMeta({
      userId: req.userId!,
      campaignId,
      platform,
      pageId,
      websiteUrl,
      dailyBudget,
      startTime,
      endTime,
      targeting,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
