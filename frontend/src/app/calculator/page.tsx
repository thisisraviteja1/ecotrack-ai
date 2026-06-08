'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateUserSession, submitCalculation } from '../../lib/api';
import { Car, Zap, Salad, ShoppingBag, Trash2, ArrowRight, ArrowLeft, Award, Sparkles } from 'lucide-react';

export default function CalculatorPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    transportMode: 'car',
    travelDistance: 15, // km/day
    electricity: 180,   // kWh/month
    acUsage: 4,        // hours/day
    diet: 'mixed',
    shoppingOnline: 4,
    shoppingFashion: 2,
    recyclingHabit: 'sometimes',
    plasticUsage: 'medium'
  });

  useEffect(() => {
    async function loadUser() {
      const user = await getOrCreateUserSession();
      setUserId(user.id);
    }
    loadUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 5));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await submitCalculation({
        userId,
        transportMode: formData.transportMode,
        travelDistance: Number(formData.travelDistance),
        electricity: Number(formData.electricity),
        acUsage: Number(formData.acUsage),
        diet: formData.diet,
        shoppingOnline: Number(formData.shoppingOnline),
        shoppingFashion: Number(formData.shoppingFashion),
        recyclingHabit: formData.recyclingHabit,
        plasticUsage: formData.plasticUsage
      });

      setResult(response.calculation);

      // Trigger navbar XP refresh
      window.dispatchEvent(new Event('ecotrack-user-updated'));
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to calculate footprint. Ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'Transportation',
    'Energy Consumption',
    'Dietary Habits',
    'Shopping Habits',
    'Waste Management'
  ];

  const stepIcons = [Car, Zap, Salad, ShoppingBag, Trash2];
  const StepIcon = stepIcons[step - 1];

  return (
    <div className="max-w-2xl mx-auto pt-6 px-4">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white">Carbon Footprint Calculator</h1>
        <p className="text-gray-400 font-semibold mt-1">Estimate your monthly greenhouse emissions and carbon score.</p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 border-white/5 bg-gray-950/40 relative">
          {/* Progress Indicators */}
          <div className="flex justify-between items-center mb-8 gap-2">
            {stepTitles.map((title, idx) => {
              const Icon = stepIcons[idx];
              const isActive = step === idx + 1;
              const isPassed = step > idx + 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                    isActive ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/25' :
                    isPassed ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                    'bg-white/5 border-white/10 text-gray-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold mt-2 text-center hidden md:block ${isActive ? 'text-white' : 'text-gray-500'}`}>
                    {title}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/5 pt-6 mb-8">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">
              <StepIcon className="w-4 h-4" />
              <span>Step {step} of 5: {stepTitles[step - 1]}</span>
            </div>

            {/* STEP 1: Transportation */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-200">Primary mode of daily transport</label>
                  <select
                    name="transportMode"
                    value={formData.transportMode}
                    onChange={handleChange}
                    className="glass-input text-sm font-semibold cursor-pointer"
                  >
                    <option value="car">Gasoline/Diesel Car</option>
                    <option value="bike">Motorcycle / Bike</option>
                    <option value="bus">Public Bus</option>
                    <option value="train">Train / Metro</option>
                    <option value="walking">Walking / Cycling (Carbon Neutral)</option>
                    <option value="flight">Long Distance Flight (Avg hours/month)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-200">
                    Average distance traveled daily ({formData.transportMode === 'flight' ? 'hours/month' : 'km/day'})
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      name="travelDistance"
                      min="0"
                      max={formData.transportMode === 'flight' ? '50' : '200'}
                      value={formData.travelDistance}
                      onChange={handleChange}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-extrabold text-white shrink-0 min-w-16 text-center">
                      {formData.travelDistance} {formData.transportMode === 'flight' ? 'hrs' : 'km'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Energy Consumption */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-200">Monthly electricity consumption (kWh)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      name="electricity"
                      min="0"
                      max="1000"
                      value={formData.electricity}
                      onChange={handleChange}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-extrabold text-white shrink-0 min-w-20 text-center">
                      {formData.electricity} kWh
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-semibold">Average home consumes roughly 150 - 300 kWh monthly.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-200">Air Conditioner usage (hours/day)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      name="acUsage"
                      min="0"
                      max="24"
                      value={formData.acUsage}
                      onChange={handleChange}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-extrabold text-white shrink-0 min-w-16 text-center">
                      {formData.acUsage} hrs
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Diet Habits */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-200">Primary dietary profile</label>
                  <select
                    name="diet"
                    value={formData.diet}
                    onChange={handleChange}
                    className="glass-input text-sm font-semibold cursor-pointer"
                  >
                    <option value="vegetarian">Vegetarian (No meat, dairy/eggs included)</option>
                    <option value="mixed">Mixed Diet (Balanced meat, dairy, vegetables)</option>
                    <option value="non-vegetarian">Meat Lover (High meat consumption)</option>
                  </select>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-xs text-emerald-400 font-semibold leading-relaxed">
                  Dietary choices shape carbon impact. A heavy meat diet produces nearly 4x the emissions of vegetarian food systems.
                </div>
              </div>
            )}

            {/* STEP 4: Shopping Habits */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-200">Online shopping deliveries (packages/month)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      name="shoppingOnline"
                      min="0"
                      max="30"
                      value={formData.shoppingOnline}
                      onChange={handleChange}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-extrabold text-white shrink-0 min-w-16 text-center">
                      {formData.shoppingOnline} pkgs
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-200">Fast fashion purchases (clothing items/month)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      name="shoppingFashion"
                      min="0"
                      max="15"
                      value={formData.shoppingFashion}
                      onChange={handleChange}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-extrabold text-white shrink-0 min-w-16 text-center">
                      {formData.shoppingFashion} items
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Waste Management */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-200">Recycling and composting habits</label>
                  <select
                    name="recyclingHabit"
                    value={formData.recyclingHabit}
                    onChange={handleChange}
                    className="glass-input text-sm font-semibold cursor-pointer"
                  >
                    <option value="always">Always (Strict separation of recycling & compost)</option>
                    <option value="sometimes">Sometimes (Separate plastics/paper sporadically)</option>
                    <option value="never">Never (All waste goes into landfill bin)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-200">Plastic packaging usage level</label>
                  <select
                    name="plasticUsage"
                    value={formData.plasticUsage}
                    onChange={handleChange}
                    className="glass-input text-sm font-semibold cursor-pointer"
                  >
                    <option value="high">High (Frequent take-out, single-use bottles)</option>
                    <option value="medium">Medium (Mix of reusable and single-use plastic)</option>
                    <option value="low">Low (Primarily package-free products)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between border-t border-white/5 pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/10"
              >
                {loading ? 'Analyzing...' : 'Calculate Footprint'}
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      ) : (
        /* Calculator Results Display */
        <div className="glass-panel p-6 md:p-8 border-emerald-500/20 bg-gray-950/40 text-center animate-in zoom-in-95 duration-300">
          <div className="inline-flex items-center justify-center bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-full mb-4">
            <Award className="w-8 h-8 text-emerald-400" />
          </div>

          <h2 className="text-2xl font-black text-white">Calculation Complete!</h2>
          <p className="text-sm font-semibold text-emerald-400 mt-1">You earned +50 XP Eco Points!</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Carbon Rating</p>
              <p className="text-4xl font-extrabold text-emerald-400 mt-1">{result.rating}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Carbon Score</p>
              <p className="text-4xl font-extrabold text-white mt-1">{result.carbonScore} <span className="text-xs text-gray-500">/100</span></p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 col-span-2 md:col-span-2">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Monthly CO₂ Footprint</p>
              <p className="text-4xl font-extrabold text-white mt-1">{result.totalCO2.toFixed(1)} <span className="text-xs text-gray-400 font-semibold">kg</span></p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 p-6 rounded-xl mt-6 text-left">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">Emissions Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
                  <span>🚗 Transportation</span>
                  <span>{result.transportCO2.toFixed(1)} kg ({((result.transportCO2 / result.totalCO2) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(result.transportCO2 / result.totalCO2) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
                  <span>⚡ Home Energy</span>
                  <span>{result.energyCO2.toFixed(1)} kg ({((result.energyCO2 / result.totalCO2) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: `${(result.energyCO2 / result.totalCO2) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
                  <span>🥗 Food & Diet</span>
                  <span>{result.foodCO2.toFixed(1)} kg ({((result.foodCO2 / result.totalCO2) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(result.foodCO2 / result.totalCO2) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
                  <span>🛍️ Shopping & Apparel</span>
                  <span>{result.shoppingCO2.toFixed(1)} kg ({((result.shoppingCO2 / result.totalCO2) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${(result.shoppingCO2 / result.totalCO2) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={() => setResult(null)}
              className="flex-1 px-6 py-3 border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl transition-all"
            >
              Recalculate
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-md transition-all"
            >
              View Carbon Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
