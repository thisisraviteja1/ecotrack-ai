'use client';

import React from 'react';
import Link from 'next/link';
import useAuth from '../hooks/useAuth';
import { ArrowRight, Leaf, Sparkles, Award, BarChart3, MessageSquare, Globe, User } from 'lucide-react';

export default function LandingPage() {
  // Check auth but do not force redirect
  const { user, loading } = useAuth(false);

  const features = [
    {
      icon: Leaf,
      title: 'AI Carbon Calculator',
      description: 'Calculate your footprint across transport, utilities, dietary habits, and consumer goods in under 3 minutes.',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: MessageSquare,
      title: 'AI Sustainability Coach',
      description: 'Interact with a custom Gemini coach for tailored carbon saving strategies, daily tips, and voice responses.',
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
    },
    {
      icon: Sparkles,
      title: 'AI Receipt Scanner',
      description: 'Upload utility statements or gasoline pump receipts. Our vision engine extracts values and computes emissions.',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      icon: Award,
      title: 'Missions & Reward XP',
      description: 'Enroll in weekly sustainability quests, record eco-actions, level up, and spend points on carbon offsets.',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Beautiful visual breakdowns of your emissions. Track progress, monitor reduction trends, and download PDF audits.',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
    },
    {
      icon: Globe,
      title: 'Offset Marketplace',
      description: 'Redeem eco points to sponsor actual tree planting, methane capture, or global reforestation initiatives.',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="relative overflow-hidden pt-12 md:pt-20">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-20">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-4 py-1.5 rounded-full mb-6">
          <Leaf className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300 tracking-wider uppercase">Enterprise Sustainability platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
          Understand Your Impact.<br />
          <span className="text-gradient">Reduce Your Footprint.</span><br />
          Save the Planet.
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
          EcoTrack AI puts carbon transparency in your pocket. Calculate emissions, build sustainable habits, receive Gemini-powered advice, and sponsor real-world offsets.
        </p>

        {loading ? (
          <div className="h-14 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? "/calculator" : "/register"}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>{user ? "Calculate Footprint" : "Get Started Free"}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              {user ? (
                <>
                  <User className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Link>
          </div>
        )}
      </div>

      {/* Statistics Row */}
      <div className="max-w-5xl mx-auto px-4 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 glass-panel p-8 text-center border-white/5 bg-gray-950/40 shadow-xl">
          <div>
            <p className="text-4xl font-extrabold text-emerald-400">14,280 kg</p>
            <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-wider">CO₂ Offset by Users</p>
          </div>
          <div className="border-y md:border-y-0 md:border-x border-white/10 py-6 md:py-0">
            <p className="text-4xl font-extrabold text-teal-400">3,450+</p>
            <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-wider">Daily Habits Logged</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-cyan-400">890 XP</p>
            <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-wider">Average Points Earned</p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white animate-fade-in">Full-Stack Features Built for Action</h2>
          <p className="text-gray-400 font-medium mt-3 max-w-lg mx-auto">
            A comprehensive suite of tools designed to guide you from awareness to measurable impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="glass-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className={`${feature.bgColor} w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 mb-6`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 text-sm font-semibold leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>
                <Link
                  href={
                    feature.title.includes('Calculator') ? '/calculator' :
                    feature.title.includes('Coach') ? '/coach' :
                    feature.title.includes('Scanner') ? '/coach' :
                    feature.title.includes('Missions') ? '/challenges' :
                    feature.title.includes('Dashboard') ? '/dashboard' : '/marketplace'
                  }
                  className="text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group/btn"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
