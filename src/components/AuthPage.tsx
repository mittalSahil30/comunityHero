/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Lock, 
  Mail, 
  Shield, 
  LogIn, 
  UserPlus, 
  Globe, 
  Key, 
  AlertCircle, 
  Check, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthPageProps {
  onLogin: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (username: string, password?: string, role?: 'citizen' | 'authority', email?: string) => Promise<{ success: boolean; error?: string }>;
  onContinueAsGuest: () => void;
}

export default function AuthPage({
  onLogin,
  onRegister,
  onContinueAsGuest
}: AuthPageProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'citizen' | 'authority'>('citizen');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username and Password are required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (authMode === 'login') {
        const res = await onLogin(username.trim().toLowerCase(), password.trim());
        if (res.success) {
          setSuccessMsg('Authentication successful! Loading city dashboard...');
        } else {
          setErrorMsg(res.error || 'Invalid credentials. Try "password123" for demo accounts.');
        }
      } else {
        const res = await onRegister(
          username.trim().toLowerCase(),
          password.trim(),
          role,
          email.trim() || undefined
        );
        if (res.success) {
          setSuccessMsg('Account created successfully! Logging you in...');
        } else {
          setErrorMsg(res.error || 'Could not register account. Username may be taken.');
        }
      }
    } catch (err) {
      setErrorMsg('A connection error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUsername: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await onLogin(demoUsername, 'password123');
      if (res.success) {
        setSuccessMsg(`Welcome back, ${demoUsername}! Loading...`);
      } else {
        setErrorMsg(res.error || 'Demo login failed.');
      }
    } catch (err) {
      setErrorMsg('Demo login failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row antialiased" id="auth-landing-page">
      
      {/* 1. Left Graphic Panel (Branding) */}
      <div className="md:w-1/2 bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-8 md:p-16 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-indigo-950/40">
        
        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building2 className="w-6.5 h-6.5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent uppercase">
                COMMUNITY HERO
              </span>
              <p className="text-[10px] text-indigo-400 font-mono tracking-wider uppercase font-semibold">Hyperlocal Grid & Civic Solver</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-12 space-y-6 max-w-lg">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-white">
            Empower your neighborhood. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              Solve local issues together.
            </span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            A state-of-the-art geo-reporting portal mapping Chandigarh's sectors. report potholes, damaged utility infrastructure, or water leaks. Verify peer-reported alerts to earn community XP, unlock badges, and raise priority metrics using AI-driven scoring!
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-indigo-950/20 border border-indigo-900/30 p-3.5 rounded-2xl">
              <span className="text-indigo-400 font-mono font-bold text-lg">Grid Nodes</span>
              <p className="text-xs text-slate-400 mt-1">Spatially mapped Chandigarh sectors for exact hazard detection.</p>
            </div>
            <div className="bg-indigo-950/20 border border-indigo-900/30 p-3.5 rounded-2xl">
              <span className="text-emerald-400 font-mono font-bold text-lg">AI Prioritization</span>
              <p className="text-xs text-slate-400 mt-1">Immediate image analyzer and severity validation on upload.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-mono flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" />
          <span>Ingress Active: Chandigarh Central Sectors</span>
        </div>
      </div>

      {/* 2. Right Interactive Form Panel */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-slate-950 relative">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">
              {authMode === 'login' ? 'Welcome Back!' : 'Join community initiatives'}
            </h2>
            <p className="text-xs text-slate-400">
              {authMode === 'login' 
                ? 'Sign in to access personalized dashboards, claim rewards, and resolve issues.' 
                : 'Register to start tracking points, earn specialized civic badges, and drop pins.'}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => { setAuthMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <LogIn className="w-4 h-4" /> Sign In
              </span>
            </button>
            <button
              onClick={() => { setAuthMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <UserPlus className="w-4 h-4" /> Sign Up
              </span>
            </button>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-start gap-2.5 animate-fade-in">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" id="main-auth-panel-form">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. sahil_m"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl outline-none focus:border-indigo-500 focus:bg-slate-900/60 text-xs text-white shadow-inner font-semibold transition"
                />
              </div>
            </div>

            {/* Email (Register only) */}
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sahil@community.org"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl outline-none focus:border-indigo-500 focus:bg-slate-900/60 text-xs text-white shadow-inner font-semibold transition"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl outline-none focus:border-indigo-500 focus:bg-slate-900/60 text-xs text-white shadow-inner font-semibold transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Role (Register only) */}
            {authMode === 'register' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('citizen')}
                    className={`py-2.5 text-xs font-bold border rounded-2xl transition cursor-pointer ${
                      role === 'citizen'
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-400'
                        : 'border-slate-800 text-slate-400 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    Citizen Solver
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('authority')}
                    className={`py-2.5 text-xs font-bold border rounded-2xl transition cursor-pointer ${
                      role === 'authority'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                        : 'border-slate-800 text-slate-400 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    Municipal Staff
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal italic">
                  {role === 'authority' 
                    ? 'Staff mode grants privileges to verify, schedule fixes, and change issue status to In Progress or Resolved.' 
                    : 'Citizen mode allows pinned reporting on Chandigarh grid, verifying issues, and climbing the community leaderboard.'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15 transition-all mt-4"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : authMode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to Grid
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create My Account
                </>
              )}
            </button>
          </form>

          {/* Quick Sandbox Selector */}
          <div className="space-y-3 pt-6 border-t border-slate-900" id="sandbox-credentials-block">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Key className="w-3.5 h-3.5 shrink-0" /> Fast Sandbox Access (Demo Profiles)
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('jane_doe')}
                className="py-2 px-1 text-[10px] font-bold border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition cursor-pointer"
              >
                Jane (Citizen)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('brian_k')}
                className="py-2 px-1 text-[10px] font-bold border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition cursor-pointer"
              >
                Brian (Citizen)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('seattle_works')}
                className="py-2 px-1 text-[10px] font-bold border border-emerald-900 hover:border-emerald-800 bg-emerald-950/20 text-emerald-400 rounded-xl transition cursor-pointer"
              >
                Works (Staff)
              </button>
            </div>
            <p className="text-[9px] text-slate-500 text-center italic">
              * Standard password for demo accounts: <strong className="font-mono bg-slate-900 px-1 py-0.5 rounded text-indigo-400">password123</strong>
            </p>
          </div>

          {/* Continue as Guest Bypass */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 font-bold transition-all underline cursor-pointer"
            >
              Continue to view Grid Map as Guest <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
