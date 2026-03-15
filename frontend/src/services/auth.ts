const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function register(email: string, password: string, name: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Erro ao cadastrar');
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Erro ao fazer login');
  return data;
}
