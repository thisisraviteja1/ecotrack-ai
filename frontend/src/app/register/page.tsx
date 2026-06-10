'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, checkAuthStatus } from '../../lib/api';
import { Leaf, Lock, Mail, User, ArrowRight, ShieldAlert, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkExisting() {
      const user = await checkAuthStatus();
      if (user) {
        router.push('/dashboard');
      }
    }
    checkExisting();
  }, [router]);

  // Client-side visual validations helper
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError('Please fill in all input fields');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet safety standards');
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, name });
      router.push('/calculator'); // Redirect to calculator for first calculation
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-10 px-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <Leaf className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="font-extrabold text-2xl text-white">EcoTrack <span className="text-emerald-400">AI</span></span>
        </div>
        <h1 className="text-xl font-bold text-gray-300">Create Account</h1>
        <p className="text-xs text-gray-400 font-semibold mt-1">Start tracking your carbon emissions and earn Eco Rewards.</p>
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
            <label htmlFor="name-input" className="text-xs font-semibold text-gray-300">Full Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <User className="w-4 h-4" />
              </span>
              <input
                id="name-input"
                type="text"
                placeholder="Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-input text-sm font-semibold pl-10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

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

            {/* Password Validation List */}
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1.5 mt-1 text-[10px] font-semibold text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${validations.length ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Minimum 8 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${validations.uppercase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>At least 1 uppercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${validations.lowercase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>At least 1 lowercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${validations.number ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>At least 1 number</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${validations.special ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>At least 1 special character</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? 'Creating Account...' : 'Sign Up Free'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-white/5 pt-5 mt-6 text-center text-xs text-gray-400 font-semibold">
          <span>Already have an account? </span>
          <Link href="/login" className="text-emerald-400 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
