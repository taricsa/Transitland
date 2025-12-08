import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    // Return a mock client for build time
    // This will be replaced with actual client at runtime
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
        delete: () => ({ eq: async () => ({ error: null }) }),
        upsert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
      }),
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
      }),
      removeChannel: () => {},
    } as any;
  }
  
  return createBrowserClient<Database>(url, key);
}

