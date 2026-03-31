import { pool } from '../../db';

export async function getProfile(userId: string) {
  const { rows } = await pool.query(
    'SELECT id, email, name, created_at FROM profiles WHERE id = $1',
    [userId],
  );
  return rows[0] ?? null;
}

export async function getOrCreateProfile(userId: string, email: string) {
  const existing = await getProfile(userId);
  if (existing) return existing;

  const { rows } = await pool.query(
    `INSERT INTO profiles (id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, email, name, created_at`,
    [userId, email, null],
  );
  return rows[0];
}

export async function updateName(userId: string, name: string) {
  const { rows } = await pool.query(
    `UPDATE profiles SET name = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, name, created_at`,
    [name, userId],
  );
  return rows[0] ?? null;
}

export async function requestEmailChange(userToken: string, newEmail: string) {
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ email: newEmail }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Erro ao solicitar alteração de e-mail');
  }
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Erro ao enviar e-mail de recuperação');
  }
}
