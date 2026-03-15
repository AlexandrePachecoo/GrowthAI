import { Request, Response } from 'express';
import { loginUser } from './login.service';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }

  try {
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    res.status(401).json({ error: message });
  }
}
