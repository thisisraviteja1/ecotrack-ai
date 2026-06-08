'use client';

import React, { useEffect, useState } from 'react';
import { getOrCreateUserSession, getLeaderboard } from '../../lib/api';
import { Trophy, Award, Medal, Crown } from 'lucide-react';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const session = await getOrCreateUserSession();
        setCurrentUserId(session.id);

        const board = await getLeaderboard();
        
        // Merge current user dynamically if they aren't on the list yet
        const exists = board.some((u: any) => u.id === session.id || u.email === session.email);
        if (!exists && session.points > 0) {
          board.push({
            id: session.id,
            name: session.name,
            points: session.points,
            level: session.level,
            email: session.email
          });
        }

        // Sort descending by points
        board.sort((a: any, b: any) => b.points - a.points);
        setUsers(board);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4" />
        <p className="text-gray-400 font-semibold text-sm">Retrieving rankings...</p>
      </div>
    );
  }

  // Top 3 Podium spots
  const podiumUsers = users.slice(0, 3);
  const otherUsers = users.slice(3);

  const podiumColors = [
    { border: 'border-amber-400/30', bg: 'bg-amber-500/5', badge: 'bg-amber-500 text-black', icon: Crown, label: '1st Gold' },
    { border: 'border-gray-300/30', bg: 'bg-gray-400/5', badge: 'bg-gray-300 text-black', icon: Medal, label: '2nd Silver' },
    { border: 'border-amber-700/30', bg: 'bg-amber-800/5', badge: 'bg-amber-700 text-white', icon: Medal, label: '3rd Bronze' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel p-6 border-white/5 bg-gray-950/40">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs mb-2">
          <Trophy className="w-4 h-4" />
          <span>Community Standings</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Eco Leaderboard</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">
          See how you rank against other eco-heroes. Earn points by logging daily habits, complete challenges, and offset carbon.
        </p>
      </div>

      {/* Podium Displays */}
      {podiumUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
          {podiumUsers.map((user, idx) => {
            const style = podiumColors[idx] || podiumColors[2];
            const Icon = style.icon;
            const isCurrentUser = user.id === currentUserId;

            return (
              <div
                key={user.id || idx}
                className={`glass-panel p-6 border-t-4 text-center flex flex-col items-center gap-3 relative order-2 md:order-${idx === 0 ? '2' : idx === 1 ? '1' : '3'} ${
                  style.border
                } ${style.bg} ${
                  isCurrentUser ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-gray-950' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm ${style.badge}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg truncate max-w-44">
                    {user.name}
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                    {user.level}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/5 px-4 py-1.5 rounded-full">
                  <span className="font-black text-white text-base">{user.points} <span className="text-[10px] text-gray-400 uppercase font-black">XP</span></span>
                </div>
                {isCurrentUser && (
                  <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mt-1">
                    You
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Table for remaining positions */}
      {otherUsers.length > 0 && (
        <div className="glass-panel border-white/5 bg-gray-950/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-semibold">
              <thead className="bg-white/5 border-b border-white/5 text-[10px] text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Achievement Level</th>
                  <th className="py-4 px-6 text-right">XP Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {otherUsers.map((user, idx) => {
                  const rank = idx + 4;
                  const isCurrentUser = user.id === currentUserId;
                  return (
                    <tr
                      key={user.id || idx}
                      className={`transition-colors ${
                        isCurrentUser ? 'bg-emerald-500/10 text-emerald-300' : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <td className="py-4 px-6 text-center font-extrabold text-gray-400">{rank}</td>
                      <td className="py-4 px-6 font-extrabold text-white">
                        <div className="flex items-center gap-2">
                          <span>{user.name}</span>
                          {isCurrentUser && (
                            <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCurrentUser ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'
                        }`}>
                          {user.level}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-white">{user.points} XP</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
