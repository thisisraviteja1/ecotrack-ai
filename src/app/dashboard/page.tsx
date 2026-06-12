'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import useAuth from '../../hooks/useAuth';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { getDashboardStats, downloadTextReport } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Award, TrendingDown, ArrowRight, Download, Brain, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [mounted, setMounted] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    async function loadStats() {
      if (!user) return;
      try {
        const stats = await getDashboardStats();
        setData(stats);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoadingStats(false);
      }
    }
    
    if (user) {
      loadStats();
    }
  }, [user]);

  if (!mounted) return null;
  if (authLoading || loadingStats) {
    return <LoadingSkeleton />;
  }

  const latestCalc = data?.latestCalculation;
  const prediction = data?.prediction;
  const reductionPercentage = data?.reductionPercentage || 0;

  // Pie chart data
  const pieData = latestCalc ? [
    { name: 'Transport', value: Math.round(latestCalc.transportCO2), color: '#10b981' },
    { name: 'Energy', value: Math.round(latestCalc.energyCO2), color: '#14b8a6' },
    { name: 'Food', value: Math.round(latestCalc.foodCO2), color: '#f59e0b' },
    { name: 'Shopping', value: Math.round(latestCalc.shoppingCO2), color: '#6366f1' },
    { name: 'Waste', value: Math.round(latestCalc.wasteCO2), color: '#ec4899' },
  ].filter(item => item.value > 0) : [];

  // Comparison Bar Chart data
  const barData = latestCalc ? [
    { name: 'Transport', You: Math.round(latestCalc.transportCO2), Average: 140 },
    { name: 'Energy', You: Math.round(latestCalc.energyCO2), Average: 120 },
    { name: 'Food', You: Math.round(latestCalc.foodCO2), Average: 80 },
    { name: 'Others', You: Math.round(latestCalc.shoppingCO2 + latestCalc.wasteCO2), Average: 40 },
  ] : [];

  // Line chart weekly habit points
  const lineData = data?.habits?.map((h: any) => ({
    date: new Date(h.date).toLocaleDateString(undefined, { weekday: 'short' }),
    Points: h.pointsEarned
  })) || [
    { date: 'Mon', Points: 10 },
    { date: 'Tue', Points: 30 },
    { date: 'Wed', Points: 20 },
    { date: 'Thu', Points: 40 },
    { date: 'Fri', Points: 15 },
    { date: 'Sat', Points: 50 },
    { date: 'Sun', Points: 30 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Carbon Analytics Dashboard</h1>
          <p className="text-gray-400 font-semibold mt-1">Hello, {user?.name.split(' ')[0]}. Here is your sustainability overview.</p>
        </div>
          <button
            onClick={() => downloadTextReport()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-md transition-all text-sm shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            <Download className="w-4 h-4" />
            <span>Download Carbon Report</span>
          </button>
      </div>

      {/* Profile Metrics Cards */}
      {!latestCalc ? (
        <div className="glass-panel p-8 text-center border-white/5 bg-gray-950/40">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Emissions Profile Found</h3>
          <p className="text-gray-400 font-semibold text-sm max-w-md mx-auto mb-6">
            To view carbon analytics and charts, please complete your first footprint calculation.
          </p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold rounded-xl transition-all shadow-md"
          >
            <span>Start Calculator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6 border-white/5 bg-gray-950/40">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Total Monthly Emissions</p>
              <h2 className="text-3xl font-black text-white mt-2">
                {latestCalc.totalCO2.toFixed(1)} <span className="text-xs text-gray-400 font-bold">kg CO₂</span>
              </h2>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mt-3">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>On track for carbon reduction</span>
              </div>
            </div>

            <div className="glass-panel p-6 border-white/5 bg-gray-950/40">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Carbon Efficiency Score</p>
              <h2 className="text-3xl font-black text-white mt-2">
                {latestCalc.carbonScore} <span className="text-xs text-gray-500 font-bold">/100</span>
              </h2>
              <p className="text-xs text-gray-400 font-bold mt-3">Rating Status: <span className="text-emerald-400 font-extrabold">{latestCalc.rating}</span></p>
            </div>

            <div className="glass-panel p-6 border-white/5 bg-gray-950/40">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Eco Reduction %</p>
              <h2 className="text-3xl font-black text-emerald-400 mt-2">
                {reductionPercentage}%
              </h2>
              <p className="text-xs text-gray-400 font-bold mt-3">Avoided emissions targets</p>
            </div>

            <div className="glass-panel p-6 border-white/5 bg-gray-950/40">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Community Standing</p>
              <h2 className="text-3xl font-black text-white mt-2">
                {user?.points} <span className="text-xs text-gray-400 font-bold">XP</span>
              </h2>
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mt-3">
                <Award className="w-3.5 h-3.5" />
                <span>Level: {user?.level}</span>
              </div>
            </div>
          </div>

          {/* AI Prediction Engine Card */}
          {prediction && (
            <div className="glass-panel p-6 border-emerald-500/20 bg-gradient-to-r from-emerald-950/10 to-transparent flex flex-col md:flex-row items-center gap-6">
              <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/25 shrink-0">
                <Brain className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">AI Habit Engine Prediction</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Gemini 1.5 Flash</span>
                </div>
                <p className="text-sm font-semibold text-gray-200 leading-relaxed">
                  {prediction.explanation}
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400 pt-1">
                  <span>Forecast Baseline Annual: <span className="text-red-400 font-extrabold">{prediction.forecastAnnualWithoutChange} kg</span></span>
                  <span>•</span>
                  <span>Forecast Optimized Annual: <span className="text-emerald-400 font-extrabold">{prediction.forecastAnnualWithChange} kg</span></span>
                </div>
              </div>
            </div>
          )}

          {/* Charts Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <div className="glass-panel p-6 border-white/5 bg-gray-950/40">
              <h3 className="text-base font-bold text-gray-300 mb-6 uppercase tracking-wider">Emissions Category Split</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="glass-panel p-6 border-white/5 bg-gray-950/40">
              <h3 className="text-base font-bold text-gray-300 mb-6 uppercase tracking-wider">You vs Typical Citizen (kg CO₂/mo)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} fontWeight="600" />
                    <YAxis stroke="#9ca3af" fontSize={11} fontWeight="600" />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <Legend />
                    <Bar dataKey="You" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Average" fill="rgba(156,163,175,0.3)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Chart */}
            <div className="glass-panel p-6 border-white/5 bg-gray-950/40 lg:col-span-2">
              <h3 className="text-base font-bold text-gray-300 mb-6 uppercase tracking-wider">Weekly Eco Check-in Score Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} fontWeight="600" />
                    <YAxis stroke="#9ca3af" fontSize={11} fontWeight="600" />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <Line type="monotone" dataKey="Points" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
