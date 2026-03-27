import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { saveCampaign, listCampaigns, deleteCampaign, addExternalCreative } from './campaigns.service';
import { generateStrategy } from './strategy.service';

export async function save(req: AuthRequest, res: Response) {
  const { name, product, platforms, copies, images } = req.body;

  if (!name || !platforms?.length || !copies) {
    res.status(400).json({ error: 'Campos obrigatórios: name, platforms, copies' });
    return;
  }

  try {
    const campaign = await saveCampaign({ userId: req.userId!, name, product, platforms, copies, images: images ?? {} });
    res.status(201).json(campaign);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' });
  }
}

export async function list(req: AuthRequest, res: Response) {
  try {
    const campaigns = await listCampaigns(req.userId!);
    res.json(campaigns);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    await deleteCampaign(id as string, req.userId!);
    res.status(204).send();
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' });
  }
}

export async function strategy(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { totalBudget } = req.body;

  if (!totalBudget || isNaN(Number(totalBudget))) {
    res.status(400).json({ error: 'totalBudget obrigatório (valor em reais)' });
    return;
  }

  try {
    const result = await generateStrategy({
      campaignId: id as string,
      userId: req.userId!,
      totalBudget: Number(totalBudget),
    });
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' });
  }
}

export async function addCreative(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { platform, imageData } = req.body;

  if (!platform || !imageData) {
    res.status(400).json({ error: 'Campos obrigatórios: platform, imageData' });
    return;
  }

  try {
    const campaign = await addExternalCreative(id as string, req.userId!, platform, imageData);
    res.json(campaign);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' });
  }
}
