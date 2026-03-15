import { Request, Response } from 'express';
import { generateCampaignCopy, CampaignInput } from './campaign.service';

export async function generate(req: Request, res: Response) {
  const { product, description, targetAudience, objective, platform, tone } = req.body as CampaignInput;

  if (!product || !description || !targetAudience || !objective || !platform) {
    res.status(400).json({ error: 'Campos obrigatórios: product, description, targetAudience, objective, platform' });
    return;
  }

  try {
    const result = await generateCampaignCopy({ product, description, targetAudience, objective, platform, tone });
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    res.status(500).json({ error: message });
  }
}
