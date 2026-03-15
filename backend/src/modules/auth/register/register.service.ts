import { supabase } from '../../../supabase';

export async function registerUser(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(error.message);

  await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    name: name ?? null,
  });

  return data.user;
}
