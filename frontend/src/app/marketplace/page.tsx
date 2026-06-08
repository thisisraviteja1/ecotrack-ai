'use client';

import React, { useEffect, useState } from 'react';
import { getOrCreateUserSession, buyOffset } from '../../lib/api';
import { ShoppingBag, Award, ShieldCheck, TreePine, Zap, Wind, CheckCircle2 } from 'lucide-react';

export default function MarketplacePage() {
  const [userId, setUserId] = useState('');
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState('Beginner');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [txMessage, setTxMessage] = useState<string | null>(null);

  const loadUserData = async () => {
    const session = await getOrCreateUserSession();
    setUserId(session.id);
    setPoints(session.points);
    setLevel(session.level);
    setLoading(false);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handlePurchase = async (projectId: string, cost: number, name: string) => {
    if (!userId) return;

    if (points < cost) {
      alert(`Insufficient Eco Points. You have ${points} XP, but need ${cost} XP.`);
      return;
    }

    setPurchasing(projectId);
    setTxMessage(null);

    try {
      const res = await buyOffset(userId, cost, name);
      setPoints(res.user.points);
      
      // Update local storage in current window frame
      localStorage.setItem('ecotrack_user', JSON.stringify(res.user));
      
      // Dispatch updating navbar points
      window.dispatchEvent(new Event('ecotrack-user-updated'));

      setTxMessage(`Successfully purchased offset project: ${name}! Spent ${cost} points.`);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Transaction failed. Check connection.');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4" />
        <p className="text-gray-400 font-semibold text-sm">Loading offset listings...</p>
      </div>
    );
  }

  const projects = [
    {
      id: 'proj-1',
      name: 'Reforest the Amazon',
      category: 'forestry',
      description: 'Support local agroforestry sapling planting in critical deforested corridors of the Amazon basin.',
      cost: 300,
      offset: '150 kg CO₂',
      icon: TreePine,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      id: 'proj-2',
      name: 'Community Solar Farm Expansion',
      category: 'energy',
      description: 'Fund solar panel assemblies in energy-poor microgrids, displacing grid-level coal electricity generation.',
      cost: 500,
      offset: '300 kg CO₂',
      icon: Zap,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10'
    },
    {
      id: 'proj-3',
      name: 'Methane Gas Capture Project',
      category: 'waste',
      description: 'Capture methane emissions from municipal organic landfill waste and convert it into clean power fuel.',
      cost: 200,
      offset: '100 kg CO₂',
      icon: Wind,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="glass-panel p-6 border-white/5 bg-gray-950/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs mb-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Carbon Offset Marketplace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Spend Eco Points</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            Redeem the Green Points earned from your daily habits to fund verified environmental offset projects.
          </p>
        </div>

        {/* User Balance card */}
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl shrink-0 text-center min-w-40">
          <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Your Balance</span>
          <span className="text-3xl font-black text-emerald-400 block mt-1">{points} XP</span>
          <span className="text-[10px] text-gray-500 font-bold mt-1.5 block uppercase tracking-widest">{level} Status</span>
        </div>
      </div>

      {txMessage && (
        <div className="bg-emerald-500/5 border border-emerald-500/25 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-400 font-semibold animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{txMessage}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project) => {
          const Icon = project.icon;
          const isAffordable = points >= project.cost;
          const isPending = purchasing === project.id;
          
          return (
            <div key={project.id} className="glass-card p-6 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className={`${project.bgColor} w-12 h-12 rounded-xl flex items-center justify-center border border-white/5`}>
                  <Icon className={`w-6 h-6 ${project.color}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">{project.name}</h3>
                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1 block">{project.category} offset</span>
                </div>
                <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="border-t border-white/5 pt-5 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-400">Carbon Offset</span>
                  <span className="text-white font-extrabold">{project.offset}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-400">XP Cost</span>
                  <span className="text-emerald-400 font-black">{project.cost} XP</span>
                </div>

                <button
                  onClick={() => handlePurchase(project.id, project.cost, project.name)}
                  disabled={!isAffordable || isPending}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 ${
                    isPending ? 'bg-gray-800 text-gray-500 cursor-not-allowed' :
                    isAffordable 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/10' 
                      : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>{isPending ? 'Redeeming...' : isAffordable ? 'Redeem Offset' : 'Insufficient XP'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel p-6 border-white/5 bg-gray-950/20 text-center max-w-xl mx-auto space-y-3">
        <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Verified Offsets Guarantee</h3>
        <p className="text-gray-400 text-xs font-semibold leading-relaxed">
          All carbon offsets on EcoTrack AI represent real, third-party audited environmental additions verified through standard Gold Standard or Verra register compliance.
        </p>
      </div>
    </div>
  );
}
