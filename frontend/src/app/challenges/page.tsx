'use client';

import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { submitHabits, getChallenges, joinChallenge, claimChallengeReward, getDashboardStats } from '../../lib/api';
import { CheckSquare, Square, Trophy, Award, Sparkles, ChevronRight, Activity, CheckCircle2 } from 'lucide-react';

export default function ChallengesPage() {
  const { user, loading: authLoading, refetch: refetchUser } = useAuth(true);
  const [loading, setLoading] = useState(true);
  
  // Habits state
  const [habits, setHabits] = useState({
    usedBicycle: false,
    avoidedPlastic: false,
    usedPublicTransport: false,
    savedElectricity: false,
    recycledWaste: false,
    carpooled: false
  });
  
  // Challenges state
  const [allChallenges, setAllChallenges] = useState<any[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<any[]>([]);

  const loadPageData = async () => {
    if (!user) return;
    try {
      const stats = await getDashboardStats();
      
      if (stats.habits && stats.habits.length > 0) {
        const todayStr = new Date().toDateString();
        const todayHabit = stats.habits.find((h: any) => new Date(h.date).toDateString() === todayStr);
        if (todayHabit) {
          setHabits({
            usedBicycle: todayHabit.usedBicycle,
            avoidedPlastic: todayHabit.avoidedPlastic,
            usedPublicTransport: todayHabit.usedPublicTransport,
            savedElectricity: todayHabit.savedElectricity,
            recycledWaste: todayHabit.recycledWaste,
            carpooled: todayHabit.carpooled
          });
        }
      }
      
      setActiveChallenges(stats.activeChallenges || []);
      setCompletedChallenges(stats.completedChallenges || []);

      const challengesList = await getChallenges();
      setAllChallenges(challengesList);
    } catch (e) {
      console.error('Failed to load page data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPageData();
    }
  }, [user]);

  const handleHabitToggle = async (key: keyof typeof habits) => {
    if (!user) return;

    const updatedHabits = {
      ...habits,
      [key]: !habits[key]
    };
    
    setHabits(updatedHabits);

    try {
      await submitHabits(updatedHabits);
      // Refresh user points in layout
      refetchUser();
    } catch (e) {
      console.error(e);
      alert('Failed to save habit checklist. Ensure backend is running.');
      setHabits(habits);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      await joinChallenge(challengeId);
      await loadPageData();
    } catch (e) {
      console.error(e);
      alert('Failed to enroll in challenge.');
    }
  };

  const handleClaimReward = async (userChallengeId: string) => {
    try {
      await claimChallengeReward(userChallengeId);
      refetchUser();
      await loadPageData();
    } catch (e) {
      console.error(e);
      alert('Failed to claim reward points.');
    }
  };

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  const activeChallengeIds = activeChallenges.map(ac => ac.challengeId);
  const completedChallengeIds = completedChallenges.map(cc => cc.challengeId);

  const habitLabels = [
    { key: 'usedBicycle', label: 'Bicycled instead of driving', category: 'transport', xp: '+10 XP' },
    { key: 'usedPublicTransport', label: 'Commuted by Bus/Train/Metro', category: 'transport', xp: '+10 XP' },
    { key: 'savedElectricity', label: 'Reduced AC/appliances runtime', category: 'energy', xp: '+10 XP' },
    { key: 'recycledWaste', label: 'Separated recycling & compost', category: 'waste', xp: '+10 XP' },
    { key: 'avoidedPlastic', label: 'Avoided single-use plastics', category: 'waste', xp: '+10 XP' },
    { key: 'carpooled', label: 'Shared a ride / Carpooled', category: 'transport', xp: '+10 XP' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
      {/* Daily Habits checklist */}
      <div className="glass-panel p-6 border-white/5 bg-gray-950/40 h-fit space-y-6">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
          <Activity className="w-4 h-4" />
          <span>Daily Habit Tracker</span>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white font-sans">Eco Check-in</h2>
          <p className="text-gray-400 text-xs mt-1 font-semibold leading-relaxed">
            Record today\'s sustainable habits. Every checked action offsets carbon emissions and increases your rank by **+10 XP**.
          </p>
        </div>

        <div className="space-y-3">
          {habitLabels.map((habit) => {
            const isChecked = habits[habit.key as keyof typeof habits];
            return (
              <button
                key={habit.key}
                onClick={() => handleHabitToggle(habit.key as keyof typeof habits)}
                role="checkbox"
                aria-checked={isChecked ? "true" : "false"}
                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
                  isChecked
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 text-emerald-400">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <span className="text-sm font-semibold leading-none">{habit.label}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isChecked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'
                }`}>
                  {habit.xp}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Green Challenges List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-6 border-white/5 bg-gray-950/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
              <Trophy className="w-4 h-4" />
              <span>Weekly Missions Panel</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
              <span>Current Status:</span>
              <span className="text-amber-400 font-extrabold">{user?.level}</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Eco Missions</h2>
            <p className="text-gray-400 text-sm font-medium mt-1">
              Join curated sustainability missions, execute long-term eco goals, and claim premium points on completion.
            </p>
          </div>
        </div>

        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest pl-1">Active Quests In Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChallenges.map((uc) => (
                <div key={uc.id} className="glass-panel p-5 border-emerald-500/30 bg-emerald-950/5 relative overflow-hidden flex flex-col justify-between gap-4">
                  <div className="absolute top-0 right-0 p-3 text-xs bg-emerald-500/10 text-emerald-400 border-l border-b border-emerald-500/20 rounded-bl-xl font-bold uppercase tracking-widest">
                    Active
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white pr-16">{uc.challenge.title}</h4>
                    <p className="text-xs text-gray-300 font-semibold leading-relaxed mt-2">{uc.challenge.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {uc.challenge.points} XP Reward
                    </span>
                    <button
                      onClick={() => handleClaimReward(uc.id)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1"
                    >
                      <span>Complete Mission</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Challenges */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Available Quests Directory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allChallenges.map((challenge) => {
              const isJoined = activeChallengeIds.includes(challenge.id);
              const isCompleted = completedChallengeIds.includes(challenge.id);
              return (
                <div key={challenge.id} className="glass-card p-5 flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">{challenge.title}</h4>
                    <p className="text-xs text-gray-400 font-semibold leading-relaxed mt-2">{challenge.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      {challenge.points} XP
                    </span>
                    
                    {isCompleted ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Completed
                      </span>
                    ) : isJoined ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Joined
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 group"
                      >
                        <span>Enroll Quest</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
