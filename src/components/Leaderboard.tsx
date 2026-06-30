/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Medal, 
  Shield, 
  Sparkles, 
  User, 
  RefreshCw, 
  Key, 
  Lock, 
  UserPlus, 
  LogIn, 
  LogOut, 
  AlertCircle,
  Mail,
  UserCheck,
  Check
} from 'lucide-react';
import { User as UserType } from '../types';

interface LeaderboardProps {
  users: UserType[];
  currentUser: UserType | null;
  onLogin: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (username: string, password?: string, role?: 'citizen' | 'authority', email?: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
}

export default function Leaderboard({
  users,
  currentUser,
  onLogin,
  onRegister,
  onLogout
}: LeaderboardProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<'citizen' | 'authority'>('citizen');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setErrorMsg('Username is required.');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('Password is required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (authMode === 'login') {
        const res = await onLogin(usernameInput.trim().toLowerCase(), passwordInput.trim());
        if (res.success) {
          setSuccessMsg('Logged in successfully!');
          setUsernameInput('');
          setPasswordInput('');
        } else {
          setErrorMsg(res.error || 'Authentication failed.');
        }
      } else {
        const res = await onRegister(
          usernameInput.trim().toLowerCase(),
          passwordInput.trim(),
          roleInput,
          emailInput.trim() || undefined
        );
        if (res.success) {
          setSuccessMsg('Account registered and logged in!');
          setUsernameInput('');
          setPasswordInput('');
          setEmailInput('');
        } else {
          setErrorMsg(res.error || 'Registration failed.');
        }
      }
    } catch (err) {
      setErrorMsg('An error occurred during authentication.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredefinedLogin = async (username: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await onLogin(username, 'password123');
      if (res.success) {
        setSuccessMsg(`Switched to ${username}!`);
      } else {
        setErrorMsg(res.error || 'Quick login failed.');
      }
    } catch (err) {
      setErrorMsg('Quick login failed.');
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
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="user-profile-status-card">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Award className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
            Citizen Security Profile
          </span>
          {currentUser && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-[10px] text-rose-600 hover:text-rose-700 font-mono font-bold bg-rose-50 hover:bg-rose-100/60 px-2 py-0.5 rounded transition"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" /> LOGOUT
            </button>
          )}
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
          <div className="space-y-4">
            {/* Auth Tab Buttons */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" /> Sign Up
                </span>
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3" id="secure-profile-auth-form">
              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. janesmith"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white text-xs text-slate-950 shadow-sm font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    disabled={loading}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white text-xs text-slate-950 shadow-sm font-medium"
                  />
                </div>
              </div>

              {authMode === 'register' && (
                <>
                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address (Optional)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        disabled={loading}
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. jane@mail.org"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white text-xs text-slate-950 shadow-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-sans">Verification Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRoleInput('citizen')}
                        className={`py-2 text-xs font-bold border rounded-xl transition ${
                          roleInput === 'citizen'
                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        Citizen Solver
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoleInput('authority')}
                        className={`py-2 text-xs font-bold border rounded-xl transition ${
                          roleInput === 'authority'
                            ? 'border-slate-900 bg-slate-950 text-white'
                            : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        Municipal Staff
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal italic">
                      {roleInput === 'authority' 
                        ? 'Staff mode grants rights to review, categorize, and change status to In Progress / Resolved.' 
                        : 'Citizen mode allows reporting local issues, verifying alerts, and earning leaderboard points.'}
                    </p>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : authMode === 'login' ? (
                  <>
                    <LogIn className="w-3.5 h-3.5" /> Sign In securely
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> Create Verified Account
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Quick Swapper Sandbox Buttons */}
        <div className="space-y-2 pt-3 border-t border-slate-100/60" id="sandbox-roles-swapper">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Key className="w-3 h-3 text-indigo-500" /> Sandbox Credentials (Demo & Evaluation)
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handlePredefinedLogin('jane_doe')}
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
              onClick={() => handlePredefinedLogin('brian_k')}
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
              onClick={() => handlePredefinedLogin('seattle_works')}
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
          <p className="text-[9px] text-slate-400 text-center italic leading-tight">
            * Standard password for all sandbox seed accounts is: <strong className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-600">password123</strong>
          </p>
        </div>
      </div>

      {/* 2. Public Leaderboard Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="leaderboard-ranking-list">
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
