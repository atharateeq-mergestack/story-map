import type { Session, User } from '@supabase/supabase-js';
import { createClient } from './server';

export async function getServerSession(): Promise<Session | null> {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return user !== null;
}
