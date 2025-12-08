'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Get user role to redirect to appropriate dashboard
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (userData) {
          const role = (userData as { role: UserRole }).role;
          const dashboardMap: Record<UserRole, string> = {
            mechanic: '/mechanic',
            ops_manager: '/ops',
            parts_clerk: '/clerk',
            driver: '/driver',
          };
          router.push(dashboardMap[role] || '/dashboard');
          router.refresh();
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Sign in to Fleet OS
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 backdrop-blur-sm">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border-0 bg-white/10 px-4 py-3 text-white placeholder:text-slate-500 ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition-all sm:text-sm sm:leading-6"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border-0 bg-white/10 px-4 py-3 text-white placeholder:text-slate-500 ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition-all sm:text-sm sm:leading-6"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

