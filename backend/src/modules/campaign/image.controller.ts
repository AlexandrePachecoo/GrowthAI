import { Request, Response } from 'express';
import { generateCampaignImages, GenerateImagesInput } from './image.service';

export async function generateImages(req: Request, res: Response) {
  const { platforms, copies, referenceImages } = req.body as GenerateImagesInput;

  if (!platforms?.length || !copies || Object.keys(copies).length === 0) {
    res.status(400).json({
      error: 'Campos obrigatórios: platforms (array), copies (objeto plataforma→copy)',
    });
    return;
  }

  const missing = platforms.filter(p => !copies[p]);
  if (missing.length > 0) {
    res.status(400).json({ error: `Copies ausentes para: ${missing.join(', ')}` });
    return;
  }

  try {
    const result = await generateCampaignImages({ platforms, copies, referenceImages });
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    res.status(500).json({ error: message });
  }
}
