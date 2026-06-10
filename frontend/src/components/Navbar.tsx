'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuth from '../hooks/useAuth';
import { Leaf, Award, BarChart3, Calculator, MessageSquarePlus, Calendar, Sparkles, ShoppingBag, Trophy, Menu, X, LogOut, LogIn } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, refetch } = useAuth(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animatePoints, setAnimatePoints] = useState(false);

  useEffect(() => {
    // Listen for points updates from pages
    const handlePointsUpdate = () => {
      refetch();
      setAnimatePoints(true);
      setTimeout(() => setAnimatePoints(false), 1200);
    };

    window.addEventListener('ecotrack-user-updated', handlePointsUpdate);
    return () => {
      window.removeEventListener('ecotrack-user-updated', handlePointsUpdate);
    };
  }, [refetch]);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, protected: true },
    { href: '/calculator', label: 'Calculator', icon: Calculator, protected: true },
    { href: '/coach', label: 'AI Coach', icon: MessageSquarePlus, protected: true },
    { href: '/challenges', label: 'Habits & Missions', icon: Calendar, protected: true },
    { href: '/simulator', label: 'Tree Simulator', icon: Sparkles, protected: true },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag, protected: true },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, protected: true },
  ];

  const visibleLinks = navLinks.filter(link => !link.protected || user);

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 shadow-lg px-4 md:px-8 py-3.5 mb-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all duration-300">
            <Leaf className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">EcoTrack</span>
            <span className="text-emerald-400 font-extrabold text-xl tracking-tight">AI</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1.5">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User profile / Login badges */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-gray-900/60 border border-white/10 pl-3.5 pr-2.5 py-1.5 rounded-full">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none font-bold">
                    {user.level}
                  </p>
                  <p className="text-xs text-gray-300 leading-none mt-1 font-semibold">
                    {user.name.split(' ')[0]}
                  </p>
                </div>
                <div 
                  className={`flex items-center gap-1 bg-emerald-500 text-white font-extrabold px-3 py-1 rounded-full text-xs transition-all duration-300 ${
                    animatePoints ? 'scale-125 bg-emerald-400 rotate-2' : ''
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{user.points} XP</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2.5 rounded-full border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-extrabold rounded-full transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pt-4 border-t border-white/5 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-base font-semibold ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
          
          {user ? (
            <div className="flex items-center justify-between mt-3 px-4 py-3 bg-gray-900/40 rounded-xl border border-white/5">
              <div>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{user.level}</p>
                <p className="text-sm font-semibold text-gray-200">{user.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-emerald-500 text-white font-black px-3.5 py-1.5 rounded-full text-sm">
                  <Award className="w-4 h-4" />
                  <span>{user.points} XP</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 mt-3 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-base font-bold rounded-xl transition-all"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
