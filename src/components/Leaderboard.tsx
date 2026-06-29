/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trophy, Award, Medal, Shield, Sparkles, User, RefreshCw, Key, UserCheck, Check } from 'lucide-react';
import { User as UserType } from '../types';

interface LeaderboardProps {
  users: UserType[];
  currentUser: UserType | null;
  onLogin: (username: string, role: 'citizen' | 'authority') => Promise<void>;
}

export default function Leaderboard({
  users,
  currentUser,
  onLogin
}: LeaderboardProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [roleInput, setRoleInput] = useState<'citizen' | 'authority'>('citizen');
  const [loading, setLoading] = useState(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setLoading(true);
    try {
      await onLogin(usernameInput.trim().toLowerCase(), roleInput);
      setUsernameInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredefinedLogin = async (username: string, role: 'citizen' | 'authority') => {
    setLoading(true);
    try {
      await onLogin(username, role);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for ranking symbols/icons
  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-amber-500 fill-amber-100" />;
    if (index === 1) return <Medal className="w-4 h-4 text-slate-400 fill-slate-100" />;
    if (index === 2) return <Medal className="w-4 h-4 text-amber-700 fill-amber-50/50" />;
    return <span className="font-mono text-xs font-semibold text-slate-400">{index + 1}</span>;
  };

  // Badge list styling mapper
  const getBadgeStyle = (badgeName: string) => {
    const defaultStyle = 'bg-slate-100 text-slate-700 border-slate-200';
    const mappings: { [key: string]: string } = {
      'Pothole Patrol': 'bg-rose-50 text-rose-700 border-rose-100 font-medium',
      'Local Vigilante': 'bg-purple-50 text-purple-700 border-purple-100 font-medium',
      'Vibe Guardian': 'bg-indigo-50 text-indigo-700 border-indigo-100 font-medium',
      'Official Responder': 'bg-amber-500 text-white border-amber-600 font-bold',
      'City Engineer': 'bg-slate-900 text-white border-slate-950 font-bold',
      'Eco Warrior': 'bg-emerald-50 text-emerald-700 border-emerald-100 font-medium',
      'Community Pillar': 'bg-sky-50 text-sky-700 border-sky-100 font-medium',
      'Civic Leader': 'bg-amber-50 text-amber-700 border-amber-200 font-medium'
    };
    return mappings[badgeName] || defaultStyle;
  };

  return (
    <div className="space-y-6" id="gamification-leaderboard-panel">
      
      {/* 1. Profile Status Widget */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
          Citizen Profile & Switcher
        </h2>

        {currentUser ? (
          <div className="space-y-4">
            {/* Logged in User HUD */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold font-sans text-sm shadow-md shadow-indigo-600/15">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 text-sm truncate">{currentUser.username}</span>
                  {currentUser.role === 'authority' ? (
                    <span className="px-1.5 py-0.5 bg-slate-900 text-[9px] text-amber-400 font-mono font-bold rounded flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> STAFF
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-[9px] text-indigo-600 font-mono font-semibold rounded">
                      CITIZEN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-indigo-600 font-bold font-mono">{currentUser.points} XP</span>
                  <span className="text-[11px] text-slate-400 font-medium">Reports: {currentUser.reportsCount}</span>
                </div>
              </div>
            </div>

            {/* Badges Display */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Earned Civic Badges</p>
              <div className="flex flex-wrap gap-1.5">
                {currentUser.badges.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No badges earned. Report or verify issues to unlock!</span>
                ) : (
                  currentUser.badges.map((bd) => (
                    <span
                      key={bd}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] ${getBadgeStyle(bd)}`}
                    >
                      <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-500" />
                      {bd}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
            No profile initialized. Please login using predefined roles or register a new identity below.
          </div>
        )}

        {/* Quick Swapper Sandbox Buttons */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100/60">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Key className="w-3 h-3 text-indigo-500" /> Switch Roles (For Testing Demo)
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handlePredefinedLogin('jane_doe', 'citizen')}
              disabled={loading || currentUser?.username === 'jane_doe'}
              className={`p-1.5 text-[10px] font-bold border rounded-lg transition active:scale-95 disabled:scale-100 disabled:opacity-50 text-center cursor-pointer ${
                currentUser?.username === 'jane_doe' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              Jane (Citizen)
            </button>
            <button
              onClick={() => handlePredefinedLogin('brian_k', 'citizen')}
              disabled={loading || currentUser?.username === 'brian_k'}
              className={`p-1.5 text-[10px] font-bold border rounded-lg transition active:scale-95 disabled:scale-100 disabled:opacity-50 text-center cursor-pointer ${
                currentUser?.username === 'brian_k' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              Brian (Citizen)
            </button>
            <button
              onClick={() => handlePredefinedLogin('seattle_works', 'authority')}
              disabled={loading || currentUser?.username === 'seattle_works'}
              className={`p-1.5 text-[10px] font-bold border rounded-lg transition active:scale-95 disabled:scale-100 disabled:opacity-50 text-center cursor-pointer ${
                currentUser?.username === 'seattle_works' 
                  ? 'border-slate-900 bg-slate-900 text-white' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              Works (Staff)
            </button>
          </div>
        </div>

        {/* Custom Login Form */}
        <form onSubmit={handleCustomLogin} className="space-y-2 pt-2 border-t border-slate-100/60" id="profile-custom-login-form">
          <div className="flex gap-2.5">
            <input
              type="text"
              required
              disabled={loading}
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Or register custom username..."
              className="flex-grow px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white text-xs text-slate-900 shadow-sm"
            />
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as 'citizen' | 'authority')}
              className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg text-[10px] font-semibold outline-none focus:border-indigo-500"
            >
              <option value="citizen">Citizen</option>
              <option value="authority">Staff</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !usernameInput.trim()}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Register Custom User'}
          </button>
        </form>
      </div>

      {/* 2. Public Leaderboard Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4.5 h-4.5 text-amber-500 fill-amber-100" />
            Civic engagement Leaderboard
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Citizens contributing key reports & confirmations across Chandigarh.</p>
        </div>

        <div className="space-y-2">
          {users.map((usr, index) => {
            const isMe = usr.id === currentUser?.id;
            return (
              <div
                key={usr.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
                  isMe 
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' 
                    : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 flex items-center justify-center shrink-0">
                    {getRankBadge(index)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                      {usr.username}
                      {isMe && <span className="text-[9px] bg-indigo-600 text-white px-1 py-0.1 font-bold rounded">YOU</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {usr.role === 'authority' ? 'Municipal Authority' : 'Civic Problem Solver'}
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3 font-mono">
                  <span className="text-xs font-bold text-indigo-600">{usr.points} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
