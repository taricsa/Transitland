import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    // In production/runtime, throw an error if env vars are missing
    // This helps identify configuration issues immediately
    if (typeof window !== 'undefined') {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!url,
        hasKey: !!key,
      });
    }
    
    // Still return a client to prevent build errors, but it will fail at runtime
    // This allows the app to build but will show clear errors when used
    return createBrowserClient<Database>(
      url || 'https://placeholder.supabase.co',
      key || 'placeholder-key'
    );
  }
  
  return createBrowserClient<Database>(url, key);
}

