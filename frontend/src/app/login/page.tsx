'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, checkAuthStatus } from '../../lib/api';
import { Leaf, Lock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    async function checkExisting() {
      const user = await checkAuthStatus();
      if (user) {
        router.push('/dashboard');
      }
    }
    checkExisting();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all input fields');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid credentials, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-16 px-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <Leaf className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="font-extrabold text-2xl text-white">EcoTrack <span className="text-emerald-400">AI</span></span>
        </div>
        <h1 className="text-xl font-bold text-gray-300">Welcome Back</h1>
        <p className="text-xs text-gray-400 font-semibold mt-1">Log in to track your carbon actions and earn points.</p>
      </div>

      <div className="glass-panel p-6 md:p-8 border-white/5 bg-gray-950/40 relative">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 text-xs text-red-400 font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-input" className="text-xs font-semibold text-gray-300">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input text-sm font-semibold pl-10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password-input" className="text-xs font-semibold text-gray-300">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input text-sm font-semibold pl-10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-white/5 pt-5 mt-6 text-center text-xs text-gray-400 font-semibold">
          <span>Don't have an account? </span>
          <Link href="/register" className="text-emerald-400 hover:underline">
            Sign up free
          </Link>
        </div>
      </div>
    </div>
  );
}
