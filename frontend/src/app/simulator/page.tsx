'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Leaf, Car, ShieldAlert, Award } from 'lucide-react';

export default function SimulatorPage() {
  const [treeCount, setTreeCount] = useState<number>(5);

  // Carbon Offsets Factor: 1 mature tree absorbs ~22 kg CO2 per year
  const annualOffsetPerTree = 22;
  const lifetimeOffsetPerTree = 220; // assumed 10 years lifespan average for calculations

  const annualOffsetTotal = treeCount * annualOffsetPerTree;
  const lifetimeOffsetTotal = treeCount * lifetimeOffsetPerTree;

  // Equivalency calculations:
  // - 1 kg CO2 is emitted by driving ~5.5 km in a gasoline car
  // - 1 kg CO2 is emitted by charging ~120 smartphones
  // - 1 kg CO2 is emitted by manufacturing ~20 plastic bottles
  const carKmEquivalent = Math.round(annualOffsetTotal * 5.5);
  const smartphonesCharged = Math.round(annualOffsetTotal * 122);
  const plasticBottlesSaved = Math.round(annualOffsetTotal * 20);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Tree Impact Simulator</h1>
        <p className="text-gray-400 font-semibold mt-1">Visualize the long-term carbon offset power of planting trees.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls and Calculations */}
        <div className="glass-panel p-6 border-white/5 bg-gray-950/40 h-fit space-y-6">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
            <Leaf className="w-4 h-4" />
            <span>Offset Calculator</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-200 block">Number of trees to plant</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="50"
                value={treeCount}
                onChange={(e) => setTreeCount(Number(e.target.value))}
                className="flex-1 accent-emerald-500 cursor-pointer"
              />
              <span className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-lg text-sm font-extrabold text-white shrink-0 min-w-14 text-center">
                {treeCount}
              </span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Estimated Annual Offset</span>
              <span className="text-3xl font-black text-emerald-400 block mt-1">{annualOffsetTotal.toFixed(0)} kg CO₂</span>
              <span className="text-[11px] text-gray-500 font-semibold mt-1 block">at ~22 kg CO₂ absorption per tree / year</span>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">10-Year Lifetime Offset</span>
              <span className="text-3xl font-black text-white block mt-1">{lifetimeOffsetTotal.toFixed(0)} kg CO₂</span>
              <span className="text-[11px] text-gray-500 font-semibold mt-1 block">equivalent to 2.2 metric tons of offset</span>
            </div>
          </div>

          {/* Environmental Equivalency list */}
          <div className="border-t border-white/5 pt-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Offset Equivalencies</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-gray-300">
                <Car className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-extrabold text-white">Car Commuting Offset</p>
                  <p className="font-semibold text-gray-400 mt-0.5">Cancels out {carKmEquivalent.toLocaleString()} km of gasoline driving.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-gray-300">
                <svg className="w-5 h-5 text-teal-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12" y2="18.01" />
                </svg>
                <div>
                  <p className="font-extrabold text-white">Device Charging Offset</p>
                  <p className="font-semibold text-gray-400 mt-0.5">Offsets charging {smartphonesCharged.toLocaleString()} smartphones.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-gray-300">
                <svg className="w-5 h-5 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <div>
                  <p className="font-extrabold text-white">Plastic Waste Offset</p>
                  <p className="font-semibold text-gray-400 mt-0.5">Avoids equivalent emissions of {plasticBottlesSaved.toLocaleString()} plastic bottles.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Canvas Column */}
        <div className="lg:col-span-2 glass-panel p-6 border-white/5 bg-gray-950/40 min-h-[50vh] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold text-white">Interactive Forest Canvas</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                {treeCount} Trees Growing
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-3 font-semibold leading-relaxed">
              Watch your forest expand! Every tree visualizes real carbon absorption working to lower greenhouse concentrations.
            </p>
          </div>

          {/* Canvas Forest rendering grid */}
          <div className="my-6 border border-white/5 bg-gray-900/30 rounded-2xl p-6 min-h-[350px] max-h-[420px] overflow-y-auto grid grid-cols-5 sm:grid-cols-10 gap-4 place-items-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-950/5 pointer-events-none" />
            
            <AnimatePresence>
              {Array.from({ length: treeCount }).map((_, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, y: 15 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: Math.min(idx * 0.03, 1) }}
                  className="relative group cursor-pointer"
                >
                  <svg className="w-10 h-12 text-emerald-400 hover:text-emerald-300 drop-shadow-[0_4px_6px_rgba(16,185,129,0.2)] hover:scale-110 transition-all duration-200" viewBox="0 0 24 24" fill="currentColor">
                    {/* Tree Crown */}
                    <path d="M12 2L4 12h5v6h6v-6h5L12 2z" />
                    {/* Trunk */}
                    <rect x="11" y="18" width="2" height="4" fill="#78350f" />
                  </svg>
                  {/* Tooltip trigger */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-950 border border-white/10 px-2 py-1 rounded text-[8px] font-black text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-1 z-10">
                    Sapling #{idx + 1} (+22kg/yr)
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex items-start gap-3 text-xs text-emerald-400 leading-relaxed font-semibold">
            <Sparkles className="w-5 h-5 shrink-0 text-emerald-300" />
            <span>
              Tip: You can fund actual trees in the **Marketplace** by completing quests, earning points, and converting them to verified sapling planting offsets.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
