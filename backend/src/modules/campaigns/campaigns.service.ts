import { pool } from '../../db';

export interface SaveCampaignInput {
  userId: string;
  name: string;
  product: string;
  platforms: string[];
  copies: Record<string, object>;
  images: Record<string, string>;
}

export async function saveCampaign(input: SaveCampaignInput) {
  const { rows } = await pool.query(
    `INSERT INTO campaigns (user_id, name, product, platforms, copies, images)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, product, platforms, created_at`,
    [input.userId, input.name, input.product, input.platforms, JSON.stringify(input.copies), JSON.stringify(input.images)]
  );
  return rows[0];
}

export async function listCampaigns(userId: string) {
  const { rows } = await pool.query(
    `SELECT id, name, product, platforms, copies, images, created_at
     FROM campaigns
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function deleteCampaign(id: string, userId: string) {
  await pool.query(
    `DELETE FROM campaigns WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
}

export async function addExternalCreative(id: string, userId: string, platform: string, imageData: string) {
  const { rows } = await pool.query(
    `SELECT images FROM campaigns WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (!rows[0]) throw new Error('Campanha não encontrada');

  const images = rows[0].images ?? {};
  const existing = images[platform];
  const currentList: string[] = Array.isArray(existing) ? existing : existing ? [existing] : [];
  currentList.push(imageData);
  images[platform] = currentList;

  const { rows: updated } = await pool.query(
    `UPDATE campaigns SET images = $1 WHERE id = $2 AND user_id = $3
     RETURNING id, name, product, platforms, copies, images, created_at`,
    [JSON.stringify(images), id, userId]
  );
  return updated[0];
}
