import { Request, Response } from 'express';
import { registerUser } from './register.service';

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }

  try {
    const user = await registerUser(email, password, name);
    res.status(201).json({ message: 'Usuário criado com sucesso', user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    res.status(400).json({ error: message });
  }
}
