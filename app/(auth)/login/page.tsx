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
          const typedUserData = userData as { role?: string };
          if (typedUserData.role) {
            const role = typedUserData.role as UserRole;
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
    <div className="flex min-h-screen flex-col justify-center items-center bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Ambient Industrial Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/50 to-slate-950 pointer-events-none"></div>

      <div className="relative w-full max-w-lg space-y-8">
        
        {/* Header - Centered & Large */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 shadow-2xl shadow-blue-900/50">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-center text-4xl font-extrabold tracking-tight text-white">
            Fleet OS
          </h2>
          <p className="text-center text-xl text-slate-400 font-medium">
            Transitland Operations
          </p>
        </div>

        {/* The "Rugged" Card */}
        <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <form className="space-y-8" onSubmit={handleLogin}>
            
            {error && (
              <div className="rounded-xl bg-red-500/10 border-2 border-red-500/20 p-5 flex items-start gap-4">
                <svg className="h-6 w-6 text-red-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-lg font-medium text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-xl font-bold text-slate-200 ml-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-0 bg-slate-950 py-5 px-6 text-xl text-white shadow-inner ring-1 ring-inset ring-slate-700 placeholder:text-slate-600 focus:ring-4 focus:ring-blue-600 sm:text-xl sm:leading-6 transition-all"
                  placeholder="name@transitland.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-xl font-bold text-slate-200 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-0 bg-slate-950 py-5 px-6 text-xl text-white shadow-inner ring-1 ring-inset ring-slate-700 placeholder:text-slate-600 focus:ring-4 focus:ring-blue-600 sm:text-xl sm:leading-6 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-8 py-6 text-2xl font-bold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accessing...
                </span>
              ) : (
                'Log In'
              )}
            </button>
          </form>
        </div>
        
        <div className="text-center">
             <p className="text-slate-500 text-sm">Need help? Call Ops Dispatch at <span className="text-slate-400 font-mono">555-0192</span></p>
        </div>
      </div>
    </div>
  );
}