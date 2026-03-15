import { supabase } from '../../../supabase';

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw new Error(error.message);

  return { token: data.session.access_token, user: data.user };
}
