import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { saveCampaign, listCampaigns, deleteCampaign } from './campaigns.service';

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
