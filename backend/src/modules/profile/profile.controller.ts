import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { supabase } from '../../supabase';
import { getOrCreateProfile, getProfile, updateName, requestEmailChange, requestPasswordReset } from './profile.service';

export async function me(req: AuthRequest, res: Response) {
  try {
    const { data } = await supabase.auth.getUser(
      req.headers.authorization!.replace('Bearer ', ''),
    );
    const email = data.user?.email ?? '';
    const profile = await getOrCreateProfile(req.userId!, email);
    res.json(profile);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' });
  }
}

export async function updateProfileName(req: AuthRequest, res: Response) {
  const { name } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: 'name é obrigatório' }); return; }
  try {
    const profile = await updateName(req.userId!, name.trim());
    res.json(profile);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' });
  }
}

export async function changeEmail(req: AuthRequest, res: Response) {
  const { email } = req.body;
  if (!email?.trim()) { res.status(400).json({ error: 'email é obrigatório' }); return; }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Não autenticado' }); return; }

  try {
    await requestEmailChange(token, email.trim());
    res.json({ message: 'Confirmação enviada para o novo e-mail' });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const profile = await getProfile(req.userId!);
    if (!profile) { res.status(404).json({ error: 'Perfil não encontrado' }); return; }

    await requestPasswordReset(profile.email);
    res.json({ message: 'Link de redefinição enviado para o seu e-mail' });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' });
  }
}
