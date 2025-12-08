'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Client-side logout utility
 * Signs out the user and redirects to login page
 */
export async function handleLogout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Logout error:', error);
    throw error;
  }
  
  // Redirect to login page
  window.location.href = '/login';
}

