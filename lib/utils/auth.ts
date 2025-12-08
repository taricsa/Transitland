import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/types';

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return userData as any;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  const typedUser = user as { role: UserRole };
  if (typedUser.role !== role) {
    throw new Error('Insufficient permissions');
  }
  return user;
}

export function getDashboardPath(role: UserRole): string {
  const dashboardMap: Record<UserRole, string> = {
    mechanic: '/mechanic',
    ops_manager: '/ops',
    parts_clerk: '/clerk',
    driver: '/driver',
  };
  return dashboardMap[role] || '/dashboard';
}

