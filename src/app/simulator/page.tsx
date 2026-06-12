'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { getDashboardStats } from '../../lib/api';
import { calculateCarbonMath } from '../../lib/carbonMath';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Leaf, Sparkles, TrendingDown, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

export default function SimulatorPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [mounted, setMounted] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [baselineCalc, setBaselineCalc] = useState<any>(null);

  // Simulation Sliders State
  const [simTransport, setSimTransport] = useState(15);
  const [simElectricity, setSimElectricity] = useState(180);
  const [simAcUsage, setSimAcUsage] = useState(4);
  const [simDiet, setSimDiet] = useState('mixed');
  const [simRecycling, setSimRecycling] = useState('sometimes');

  useEffect(() => {
    setMounted(true);
    async function loadStats() {
      if (!user) return;
      try {
        const stats = await getDashboardStats();
        const lastCalc = stats.lastCalculation;
        if (lastCalc) {
          setBaselineCalc(lastCalc);
          setSimTransport(lastCalc.travelDistance !== undefined ? lastCalc.travelDistance : 15);
          setSimElectricity(lastCalc.electricity !== undefined ? lastCalc.electricity : 180);
          setSimAcUsage(lastCalc.acUsage !== undefined ? lastCalc.acUsage : 4);
          setSimDiet(lastCalc.diet || 'mixed');
          setSimRecycling(lastCalc.recyclingHabit || 'sometimes');
        } else {
          // Default baseline reference if user hasn't run the calculator yet
          const defaultCalc = {
            transportMode: 'car',
            travelDistance: 15,
            electricity: 180,
            acUsage: 4,
            diet: 'mixed',
            shoppingOnline: 4,
            shoppingFashion: 2,
            recyclingHabit: 'sometimes',
            plasticUsage: 'medium',
            totalCO2: 380,
            carbonScore: 49,
            rating: 'D'
          };
          setBaselineCalc(defaultCalc);
        }
      } catch (err) {
        console.error('Failed to load simulator baseline:', err);
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

  // Calculate Simulated Footprint
  const simulatedCalc = calculateCarbonMath({
    transportMode: baselineCalc?.transportMode || 'car',
    travelDistance: Math.max(0, Math.min(200, Number(simTransport))),
    electricity: Math.max(0, Math.min(1000, Number(simElectricity))),
    acUsage: Math.max(0, Math.min(24, Number(simAcUsage))),
    diet: simDiet as any,
    shoppingOnline: baselineCalc?.shoppingOnline !== undefined ? baselineCalc.shoppingOnline : 4,
    shoppingFashion: baselineCalc?.shoppingFashion !== undefined ? baselineCalc.shoppingFashion : 2,
    recyclingHabit: simRecycling as any,
    plasticUsage: baselineCalc?.plasticUsage || 'medium'
  });

  const baselineCO2 = baselineCalc ? baselineCalc.totalCO2 : 380;
  const simulatedCO2 = simulatedCalc.totalCO2;
  const annualSavings = Math.max(0, (baselineCO2 - simulatedCO2) * 12);
  const scoreDiff = simulatedCalc.carbonScore - (baselineCalc ? baselineCalc.carbonScore : 49);

  // Trajectory Projection Chart Data (5 Years Cumulative)
  const trajectoryData = Array.from({ length: 5 }).map((_, idx) => {
    const year = idx + 1;
    return {
      name: `Yr ${year}`,
      'Baseline Route': Math.round(baselineCO2 * 12 * year),
      'Optimized Route': Math.round(simulatedCO2 * 12 * year),
    };
  });

  const totalSaved5Years = Math.round(annualSavings * 5);

  // Carbon Twin Configuration based on simulated score
  const score = simulatedCalc.carbonScore;
  let twinStatus = 'Smoggy & Polluted';
  let twinColor = 'text-red-400';
  let twinBg = 'from-red-950/20 to-transparent border-red-500/10';
  let avatarFace = (
    <svg className="w-24 h-24 text-gray-500 animate-bounce" viewBox="0 0 100 100" fill="currentColor">
      <circle cx="50" cy="50" r="45" fill="#5a524e" stroke="#3e3835" strokeWidth="4" />
      <circle cx="35" cy="40" r="6" fill="#1e1b19" />
      <circle cx="65" cy="40" r="6" fill="#1e1b19" />
      <path d="M35 70 Q50 50 65 70" stroke="#1e1b19" strokeWidth="4" fill="none" />
      <circle cx="20" cy="75" r="4" fill="#a78bfa" className="opacity-60" />
      <circle cx="80" cy="25" r="5" fill="#a78bfa" className="opacity-60" />
    </svg>
  );

  if (score >= 85) {
    twinStatus = 'Eco Champion Avatar';
    twinColor = 'text-emerald-400';
    twinBg = 'from-emerald-950/20 to-transparent border-emerald-500/20';
    avatarFace = (
      <div className="relative">
        <svg className="w-24 h-24 text-emerald-400 animate-pulse" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="45" fill="#059669" stroke="#047857" strokeWidth="4" />
          <circle cx="33" cy="42" r="7" fill="#ffffff" />
          <circle cx="35" cy="42" r="3" fill="#10b981" />
          <circle cx="67" cy="42" r="7" fill="#ffffff" />
          <circle cx="65" cy="42" r="3" fill="#10b981" />
          <path d="M33 65 Q50 82 67 65" stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Flower crown */}
          <circle cx="30" cy="12" r="6" fill="#fbbf24" />
          <circle cx="50" cy="8" r="6" fill="#f43f5e" />
          <circle cx="70" cy="12" r="6" fill="#38bdf8" />
        </svg>
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg">Eco King</span>
      </div>
    );
  } else if (score >= 70) {
    twinStatus = 'Healthy Planet Avatar';
    twinColor = 'text-teal-400';
    twinBg = 'from-teal-950/20 to-transparent border-teal-500/20';
    avatarFace = (
      <svg className="w-24 h-24 text-teal-400" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="50" r="45" fill="#0d9488" stroke="#0f766e" strokeWidth="4" />
        <circle cx="35" cy="42" r="6" fill="#ffffff" />
        <circle cx="36" cy="42" r="2.5" fill="#0d9488" />
        <circle cx="65" cy="42" r="6" fill="#ffffff" />
        <circle cx="64" cy="42" r="2.5" fill="#0d9488" />
        <path d="M36 65 Q50 78 64 65" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M12 40 Q25 35 30 45" stroke="#fbbf24" strokeWidth="3" fill="none" />
      </svg>
    );
  } else if (score >= 40) {
    twinStatus = 'Active Learner Avatar';
    twinColor = 'text-amber-400';
    twinBg = 'from-amber-950/20 to-transparent border-amber-500/10';
    avatarFace = (
      <svg className="w-24 h-24 text-amber-500" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="50" r="45" fill="#d97706" stroke="#b45309" strokeWidth="4" />
        <circle cx="35" cy="42" r="5" fill="#ffffff" />
        <circle cx="65" cy="42" r="5" fill="#ffffff" />
        <line x1="33" y1="65" x2="67" y2="65" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  const handleResetSimulator = () => {
    if (baselineCalc) {
      setSimTransport(baselineCalc.travelDistance || 15);
      setSimElectricity(baselineCalc.electricity || 180);
      setSimAcUsage(baselineCalc.acUsage || 4);
      setSimDiet(baselineCalc.diet || 'mixed');
      setSimRecycling(baselineCalc.recyclingHabit || 'sometimes');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Impact Behavior Simulator</h1>
          <p className="text-gray-400 font-semibold mt-1">Adjust your simulated choices to instantly project your future carbon trajectory.</p>
        </div>
        <button
          onClick={handleResetSimulator}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-white/10 hover:bg-white/5 text-white text-xs font-bold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Reset simulation sliders to baseline calculations"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Simulation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sliders Input Column */}
        <div className="glass-panel p-6 border-white/5 bg-gray-950/40 space-y-6 h-fit">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
            <Zap className="w-4 h-4" />
            <span>Simulate Habits</span>
          </div>

          {/* Transport Slider */}
          <div className="space-y-2">
            <label htmlFor="sim-transport-range" className="text-xs font-bold text-gray-300 block">
              Simulated Daily Distance: <span className="text-white font-extrabold">{simTransport} km</span>
            </label>
            <input
              id="sim-transport-range"
              type="range"
              min="0"
              max="200"
              value={simTransport}
              onChange={(e) => setSimTransport(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={200}
              aria-valuenow={simTransport}
            />
          </div>

          {/* Electricity Slider */}
          <div className="space-y-2">
            <label htmlFor="sim-electricity-range" className="text-xs font-bold text-gray-300 block">
              Simulated Monthly Electric: <span className="text-white font-extrabold">{simElectricity} kWh</span>
            </label>
            <input
              id="sim-electricity-range"
              type="range"
              min="0"
              max="1000"
              value={simElectricity}
              onChange={(e) => setSimElectricity(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={1000}
              aria-valuenow={simElectricity}
            />
          </div>

          {/* AC Runtime Slider */}
          <div className="space-y-2">
            <label htmlFor="sim-ac-range" className="text-xs font-bold text-gray-300 block">
              Simulated AC Usage: <span className="text-white font-extrabold">{simAcUsage} hrs/day</span>
            </label>
            <input
              id="sim-ac-range"
              type="range"
              min="0"
              max="24"
              value={simAcUsage}
              onChange={(e) => setSimAcUsage(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={24}
              aria-valuenow={simAcUsage}
            />
          </div>

          {/* Diet Dropdown */}
          <div className="space-y-2">
            <label htmlFor="sim-diet-select" className="text-xs font-bold text-gray-300 block">Simulated Diet Option</label>
            <select
              id="sim-diet-select"
              value={simDiet}
              onChange={(e) => setSimDiet(e.target.value)}
              className="w-full glass-input text-sm font-semibold cursor-pointer"
            >
              <option value="vegetarian">100% Vegetarian</option>
              <option value="mixed">Mixed Food Intake</option>
              <option value="non-vegetarian">Heavy Meat Diet</option>
            </select>
          </div>

          {/* Recycling Dropdown */}
          <div className="space-y-2">
            <label htmlFor="sim-recycling-select" className="text-xs font-bold text-gray-300 block">Simulated Recycling Habits</label>
            <select
              id="sim-recycling-select"
              value={simRecycling}
              onChange={(e) => setSimRecycling(e.target.value)}
              className="w-full glass-input text-sm font-semibold cursor-pointer"
            >
              <option value="always">Always Separate Waste</option>
              <option value="sometimes">Sometimes Recycle</option>
              <option value="never">Landfill Trash Only</option>
            </select>
          </div>
        </div>

        {/* Dashboard Display */}
        <div className="lg:col-span-2 space-y-8">
          {/* Carbon Twin & Real-time Projection Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Carbon Twin Graphic */}
            <div className={`glass-panel p-6 border bg-gradient-to-br ${twinBg} flex flex-col items-center justify-center gap-4 text-center`}>
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">My Carbon Twin</h3>
              <div className="p-4 bg-gray-950/40 rounded-full border border-white/5 shadow-inner">
                {avatarFace}
              </div>
              <div>
                <p className={`font-black text-lg ${twinColor}`}>{twinStatus}</p>
                <p className="text-xs text-gray-400 font-semibold mt-1">Twin grows healthier and evolves as your Carbon Score rises!</p>
              </div>
            </div>

            {/* Impact Projection Stats */}
            <div className="glass-panel p-6 border-white/5 bg-gray-950/40 flex flex-col justify-between gap-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Projection Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs text-gray-400 font-semibold">Projected Carbon Score</span>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-white">{simulatedCalc.carbonScore}</span>
                    <span className={`text-xs font-bold ml-1.5 ${scoreDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ({scoreDiff >= 0 ? '+' : ''}{scoreDiff})
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs text-gray-400 font-semibold">Simulated Monthly Footprint</span>
                  <span className="text-lg font-extrabold text-white">{simulatedCalc.totalCO2.toFixed(1)} kg</span>
                </div>

                <div className="flex justify-between items-center pb-2">
                  <span className="text-xs text-gray-400 font-semibold">Potential Annual Savings</span>
                  <span className="text-lg font-extrabold text-emerald-400">{annualSavings.toFixed(0)} kg CO₂</span>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-300" />
                <span>Simulations use validated emissions formulas.</span>
              </div>
            </div>
          </div>

          {/* 5-Year Trajectory Line Chart */}
          <div className="glass-panel p-6 border-white/5 bg-gray-950/40">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white">5-Year Trajectory Future Projection</h3>
                <p className="text-gray-500 text-xs mt-0.5 font-semibold">Comparing business-as-usual vs simulated eco behaviors.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 font-semibold block">Total 5-Yr Carbon Saved</span>
                <span className="text-lg font-black text-emerald-400">{totalSaved5Years.toLocaleString()} kg CO₂</span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectoryData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} fontWeight="600" />
                  <YAxis stroke="#9ca3af" fontSize={11} fontWeight="600" />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="Baseline Route" stroke="rgba(156, 163, 175, 0.4)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Optimized Route" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-xl mt-6 flex items-start gap-2.5 text-xs text-gray-400 leading-relaxed font-semibold">
              <Sparkles className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>
                Under the **Optimized Route**, your cumulative reductions save enough carbon emissions to offset the equivalent lifetime absorption of **{(totalSaved5Years / 220).toFixed(1)} mature trees**!
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
