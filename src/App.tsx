/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  Trophy, 
  ShieldAlert, 
  Camera, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ListFilter, 
  Search, 
  Plus,
  HelpCircle
} from 'lucide-react';
import { Issue, User, HotspotPrediction, IssueCategory, IssueStatus } from './types';
import { calculatePriority } from './utils/priority';
import InteractiveMap from './components/InteractiveMap';
import ReportIssueForm from './components/ReportIssueForm';
import IssueDetails from './components/IssueDetails';
import Leaderboard from './components/Leaderboard';
import PredictiveInsights from './components/PredictiveInsights';

export default function App() {
  // State variables
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [hotspots, setHotspots] = useState<HotspotPrediction[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Selection and Interactive state
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; locationName: string } | null>(null);
  const [showHotspots, setShowHotspots] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'issues' | 'predictive' | 'leaderboard'>('issues');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load initial data
  useEffect(() => {
    fetchIssues();
    fetchUsers();
    
    // Auto-login default citizen to allow immediate usage
    handleLogin('jane_doe', 'citizen');
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/issues');
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch (e) {
      console.error('Failed to load issues:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    }
  };

  const handleLogin = async (username: string, role: 'citizen' | 'authority') => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role })
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        
        // Refresh users list in case a new custom profile was registered
        fetchUsers();
      }
    } catch (e) {
      console.error('Login failed:', e);
    }
  };

  const handleReportSubmit = async (formData: any) => {
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newIssue = await res.json();
        setIssues(prev => [newIssue, ...prev]);
        setSelectedIssueId(newIssue.id);
        setSelectedCoords(null); // Clear map selection pin
        
        // Refresh leaderboard to reward points!
        fetchUsers();
        // Update local current user points
        if (currentUser) {
          setCurrentUser(prev => prev ? { ...prev, points: prev.points + 50, reportsCount: prev.reportsCount + 1 } : null);
        }
      }
    } catch (e) {
      console.error('Failed to report issue:', e);
    }
  };

  const handleVerify = async (issueId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updated : i));
        fetchUsers(); // Award points
        setCurrentUser(prev => prev ? { ...prev, points: prev.points + 15, verificationsCount: prev.verificationsCount + 1 } : null);
      }
    } catch (e) {
      console.error('Failed to verify issue:', e);
    }
  };

  const handleDispute = async (issueId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updated : i));
        fetchUsers();
        setCurrentUser(prev => prev ? { ...prev, points: prev.points + 15 } : null);
      }
    } catch (e) {
      console.error('Failed to dispute issue:', e);
    }
  };

  const handleAddComment = async (issueId: string, text: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username,
          text
        })
      });
      if (res.ok) {
        const newComment = await res.json();
        setIssues(prev => prev.map(i => {
          if (i.id === issueId) {
            return { ...i, comments: [...i.comments, newComment] };
          }
          return i;
        }));
        fetchUsers();
        setCurrentUser(prev => prev ? { ...prev, points: prev.points + 10 } : null);
      }
    } catch (e) {
      console.error('Failed to add comment:', e);
    }
  };

  const handleUpdateStatus = async (issueId: string, status: string, note: string) => {
    if (!currentUser || currentUser.role !== 'authority') return;
    try {
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          note,
          userId: currentUser.id
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updated : i));
        fetchUsers();
        setCurrentUser(prev => prev ? { ...prev, points: prev.points + 100 } : null);
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleTriggerPrediction = async () => {
    try {
      const res = await fetch('/api/ai/predict-hotspots');
      if (res.ok) {
        const predictions = await res.json();
        setHotspots(predictions);
      }
    } catch (e) {
      console.error('Predictive analysis failed:', e);
    }
  };

  // Filter Issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          issue.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedIssue = issues.find(i => i.id === selectedIssueId) || null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased">
      
      {/* Dynamic Header */}
      <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Building2 className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight flex items-center gap-1 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                COMMUNITY HERO
              </span>
              <p className="text-[10px] text-indigo-400 font-mono tracking-wider uppercase font-semibold">Hyperlocal Problem Solver</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-mono bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>City Ingress: Chandigarh (Active)</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-bold">{issues.length} Issues Reported</span>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / CENTER VIEW (8 cols) - Map + Feed */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Interactive Spatial Grid Map */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Live Geospatial Overlay (Chandigarh Grid)
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Click street grid to drop a pin and report</span>
            </div>
            <InteractiveMap
              issues={issues}
              hotspots={hotspots}
              selectedIssueId={selectedIssueId}
              onSelectIssue={(id) => {
                setSelectedIssueId(id);
                setSelectedCoords(null);
                setActiveTab('issues'); // Switch back to see details immediately
              }}
              onSelectCoordinates={(lat, lng, name) => {
                setSelectedCoords({ lat, lng, locationName: name });
                setSelectedIssueId(null); // Switch to reporting flow
              }}
              showHotspots={showHotspots}
            />
          </div>

          {/* Search, Filter & Issues List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto">
                <ListFilter className="w-4 h-4 text-slate-500" />
                Community Issues Feed ({filteredIssues.length})
              </h2>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Search Bar */}
                <div className="relative flex-grow sm:flex-grow-0 sm:w-60">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search street, category..."
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl outline-none text-xs text-slate-700 shadow-sm focus:border-indigo-500"
                  />
                </div>

                {/* Category Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600 outline-none shadow-sm focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Pothole">Potholes</option>
                  <option value="Water Leakage">Water Leakages</option>
                  <option value="Damaged Streetlight">Streetlights</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Public Infra">Public Infrastructure</option>
                </select>

                {/* Status Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600 outline-none shadow-sm focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="reported">Reported</option>
                  <option value="verified">Verified</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Grid List of Issues */}
            {filteredIssues.length === 0 ? (
              <div className="bg-white border border-slate-100 p-8 text-center text-slate-400 rounded-2xl shadow-sm">
                No active complaints match filters. Clear fields or select coordinates on the map to create a new one!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredIssues.map((issue) => {
                  const isSelected = selectedIssueId === issue.id;
                  
                  // Simple style mappings
                  const statusStyles: { [key: string]: string } = {
                    reported: 'bg-blue-50 text-blue-700 border-blue-100',
                    verified: 'bg-amber-50 text-amber-700 border-amber-100',
                    in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  };

                  return (
                    <div
                      key={issue.id}
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        setSelectedCoords(null);
                        setActiveTab('issues'); // Jump to issue board
                      }}
                      className={`p-4 bg-white border rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md flex flex-col justify-between h-[180px] ${
                        isSelected 
                          ? 'border-indigo-600 ring-2 ring-indigo-500/10 shadow-sm' 
                          : 'border-slate-100'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            {issue.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] border font-bold uppercase tracking-wider ${statusStyles[issue.status]}`}>
                            {issue.status}
                          </span>
                        </div>
                        <h3 className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-1">{issue.title}</h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{issue.locationName}</span>
                        </p>
                        
                        {/* Priority Score Engine Badge */}
                        {(() => {
                          const priorityData = calculatePriority(issue);
                          return (
                            <div className="flex items-center gap-1.5 pt-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${priorityData.colorClass}`}>
                                {priorityData.badge} (Priority: {priorityData.score})
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-auto">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {issue.verifiedBy.length} Verifications
                        </span>
                        <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-1 font-mono">
                          XP Score: +{issue.score * 15}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT CONTROLS PANEL (4 cols) - Tabs for Reports, Insights, and Gamification */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Tab Selection Header */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => { setActiveTab('issues'); setSelectedCoords(null); }}
              className={`py-2 text-[11px] font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'issues' && !selectedCoords
                  ? 'bg-white shadow-sm text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => { setActiveTab('predictive'); setSelectedCoords(null); }}
              className={`py-2 text-[11px] font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'predictive'
                  ? 'bg-white shadow-sm text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Insights
            </button>
            <button
              onClick={() => { setActiveTab('leaderboard'); setSelectedCoords(null); }}
              className={`py-2 text-[11px] font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-white shadow-sm text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Rewards
            </button>
          </div>

          {/* Conditional rendering based on state */}
          {selectedCoords ? (
            <ReportIssueForm
              selectedCoords={selectedCoords}
              currentUser={currentUser}
              onSubmit={handleReportSubmit}
              onCancel={() => setSelectedCoords(null)}
            />
          ) : (
            <>
              {activeTab === 'issues' && (
                <IssueDetails
                  issue={selectedIssue}
                  currentUser={currentUser}
                  onVerify={handleVerify}
                  onDispute={handleDispute}
                  onAddComment={handleAddComment}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}

              {activeTab === 'predictive' && (
                <PredictiveInsights
                  hotspots={hotspots}
                  issues={issues}
                  onTriggerPrediction={handleTriggerPrediction}
                  showHotspotsOnMap={showHotspots}
                  onToggleShowHotspotsOnMap={setShowHotspots}
                />
              )}

              {activeTab === 'leaderboard' && (
                <Leaderboard
                  users={users}
                  currentUser={currentUser}
                  onLogin={handleLogin}
                />
              )}
            </>
          )}

        </div>

      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 px-6 mt-12 border-t border-slate-800 text-xs text-center font-mono">
        <div className="max-w-7xl mx-auto space-y-2">
          <p>© 2026 Community Hero Inc. Built for Vibecoding Municipal Solver Contest.</p>
          <p className="text-[10px] text-slate-500">Telemetry Node: Active • Storage State: JSON persistence • AI Pipeline: Server-Side Gemini 3.5-flash</p>
        </div>
      </footer>

    </div>
  );
}
