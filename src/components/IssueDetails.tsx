/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2, ShieldAlert, Calendar, MapPin, User, Tag, Send, AlertTriangle, ShieldCheck, Clock, Shield } from 'lucide-react';
import { Issue, Comment, User as UserType } from '../types';
import { calculatePriority } from '../utils/priority';

interface IssueDetailsProps {
  issue: Issue | null;
  currentUser: UserType | null;
  onVerify: (id: string) => Promise<void>;
  onDispute: (id: string) => Promise<void>;
  onAddComment: (id: string, text: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string, note: string) => Promise<void>;
}

export default function IssueDetails({
  issue,
  currentUser,
  onVerify,
  onDispute,
  onAddComment,
  onUpdateStatus
}: IssueDetailsProps) {
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Authority controls state
  const [authStatus, setAuthStatus] = useState('');
  const [authNote, setAuthNote] = useState('');
  const [updatingAuth, setUpdatingAuth] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);

  if (!issue) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[400px]">
        <MapPin className="w-12 h-12 text-slate-200 mb-3 animate-bounce" />
        <p className="font-semibold text-slate-600">No Issue Selected</p>
        <p className="text-xs text-slate-400 max-w-[240px] mt-1">
          Click on any pulsing point on the interactive map or select one from the feed to view status, comments, and action details.
        </p>
      </div>
    );
  }

  const isReporter = issue.reportedBy === currentUser?.id;
  const hasVerified = currentUser ? issue.verifiedBy.includes(currentUser.id) : false;
  const hasRejected = currentUser ? issue.rejectedBy.includes(currentUser.id) : false;
  const isAuthority = currentUser?.role === 'authority';

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await onAddComment(issue.id, commentText);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authStatus) return;

    setUpdatingAuth(true);
    try {
      await onUpdateStatus(issue.id, authStatus, authNote);
      setShowAuthForm(false);
      setAuthNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAuth(false);
    }
  };

  // Severity indicator styling
  const severityColors = {
    low: 'bg-green-50 text-green-700 border-green-100',
    medium: 'bg-amber-50 text-amber-700 border-amber-100',
    high: 'bg-rose-50 text-rose-700 border-rose-100'
  };

  // Status indicator styling
  const statusLabels = {
    reported: { text: 'Reported', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    verified: { text: 'Verified', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    in_progress: { text: 'In Progress', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    resolved: { text: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
  };

  // Verification threshold ratio (e.g. 3)
  const verificationsCount = issue.verifiedBy.length;
  const verificationRatio = Math.min(100, (verificationsCount / 3) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[680px]" id="issue-details-panel">
      
      {/* Header Scrollable area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Banner with severity & status */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${statusLabels[issue.status].color}`}>
              {statusLabels[issue.status].text}
            </span>
            <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold capitalize ${severityColors[issue.severity]}`}>
              {issue.severity} Severity
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(issue.reportedAt).toLocaleDateString()}
          </span>
        </div>

        {/* Title and location */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">{issue.title}</h1>
          <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
            {issue.locationName}
          </p>
        </div>

        {/* Image block */}
        {issue.imageUrl && (
          <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative group">
            <img
              src={issue.imageUrl}
              className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              alt={issue.title}
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Detailed description */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Complaint Details</h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
            {issue.description}
          </p>
        </div>

        {/* Tags */}
        {issue.tags && issue.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {issue.tags.map((tg) => (
              <span key={tg} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md border border-slate-200">
                <Tag className="w-2.5 h-2.5" /> #{tg}
              </span>
            ))}
          </div>
        )}

        {/* Priority Score Engine Block */}
        {(() => {
          const priority = calculatePriority(issue);
          return (
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-500" />
                  Priority Score Engine
                </h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${priority.colorClass}`}>
                  {priority.badge}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-white p-2.5 rounded-lg border border-slate-100">
                <div>
                  <div className="text-slate-400 uppercase font-semibold">Severity (x5)</div>
                  <div className="font-bold text-slate-800 font-mono mt-0.5">
                    +{issue.severity === 'high' ? 15 : issue.severity === 'medium' ? 10 : 5}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-semibold">Verifications (x2)</div>
                  <div className="font-bold text-slate-800 font-mono mt-0.5">
                    +{verificationsCount * 2}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-semibold">Age (Days Pending)</div>
                  <div className="font-bold text-slate-800 font-mono mt-0.5">
                    +{priority.daysPending} pt{priority.daysPending !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs font-semibold px-1 pt-1 border-t border-slate-200/40">
                <span className="text-slate-500">Calculated Priority Score</span>
                <span className="text-indigo-600 font-mono font-bold text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {priority.score} Points
                </span>
              </div>
            </div>
          );
        })()}

        {/* Citizen Engagement / Verification Progress Bar */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              Community Verification Meter
            </span>
            <span className="font-mono text-slate-500">{verificationsCount}/3 votes</span>
          </div>
          
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                issue.status === 'reported' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${verificationRatio}%` }}
            ></div>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            {issue.status === 'reported' 
              ? `Requires ${Math.max(0, 3 - verificationsCount)} more community confirmations to qualify for automatic verified dispatch status.` 
              : `Successfully verified by the neighborhood. Local municipal team notified!`}
          </p>

          {/* Voting Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => onVerify(issue.id)}
              disabled={isReporter || hasVerified || issue.status === 'resolved'}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 disabled:scale-100 disabled:opacity-50 ${
                hasVerified 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' 
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400 hover:bg-slate-50/50'
              }`}
              id="verify-button"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {hasVerified ? 'Verified (+15 XP)' : 'Confirm Issue'}
            </button>
            <button
              onClick={() => onDispute(issue.id)}
              disabled={isReporter || hasRejected || issue.status === 'resolved'}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 disabled:scale-100 disabled:opacity-50 ${
                hasRejected 
                  ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' 
                  : 'border-slate-200 bg-white text-slate-700 hover:border-rose-400 hover:bg-slate-50/50'
              }`}
              id="dispute-button"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              {hasRejected ? 'Disputed' : 'Flag / Dispute'}
            </button>
          </div>
          {isReporter && (
            <p className="text-[10px] text-center text-slate-400 italic">You cannot verify or dispute your own report.</p>
          )}
        </div>

        {/* Official Authority Board */}
        {issue.authorityAction ? (
          <div className="bg-indigo-50/80 border border-indigo-100 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Municipal Authority Resolution Note
            </div>
            <p className="text-sm text-indigo-950/90 leading-relaxed italic">
              "{issue.authorityAction.note}"
            </p>
            <div className="text-[10px] text-indigo-600/80 font-mono flex justify-between pt-1 border-t border-indigo-100/60">
              <span>By: municipal_works ({issue.authorityAction.updatedBy})</span>
              <span>At: {new Date(issue.authorityAction.updatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">Pending action review by city public works dispatch.</p>
            {isAuthority && !showAuthForm && (
              <button
                onClick={() => {
                  setAuthStatus(issue.status);
                  setShowAuthForm(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-lg transition active:scale-95 cursor-pointer"
                id="authority-board-open"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Open Authority Board
              </button>
            )}
          </div>
        )}

        {/* Authority Status Update Form */}
        {showAuthForm && isAuthority && (
          <form onSubmit={handleAuthSubmit} className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-4 shadow-lg animate-fadeIn" id="authority-board-form">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Authority Board Action
              </span>
              <button 
                type="button" 
                onClick={() => setShowAuthForm(false)}
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Update Maintenance Status</label>
              <select
                value={authStatus}
                onChange={(e) => setAuthStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs outline-none focus:border-indigo-500"
              >
                <option value="verified">Verified (Pending Dispatch)</option>
                <option value="in_progress">In Progress (Workers Dispatched)</option>
                <option value="resolved">Resolved (Fix Completed)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Official Update / Resolution Note</label>
              <textarea
                rows={2}
                required
                value={authNote}
                onChange={(e) => setAuthNote(e.target.value)}
                placeholder="Write update: e.g., Paving crew scheduled. Road closed on Monday."
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-xs outline-none focus:border-indigo-500 resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={updatingAuth}
              className="w-full py-2 bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 transition text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Commit Maintenance Log (+100 XP)
            </button>
          </form>
        )}

        {/* Comments Feed list */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            Civic Discussion Board ({issue.comments.length})
          </h3>

          <div className="space-y-3">
            {issue.comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg text-center">No discussion yet. Suggest coordination or safety updates below!</p>
            ) : (
              issue.comments.map((comment) => (
                <div key={comment.id} className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-400" />
                      {comment.username}
                    </span>
                    <span className="font-mono text-[10px]">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-700 leading-normal font-sans">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Input comment footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        {currentUser ? (
          <form onSubmit={handleCommentSubmit} className="flex gap-2" id="comment-add-form">
            <input
              type="text"
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type message to the neighborhood board..."
              className="flex-grow px-3.5 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs text-slate-900 shadow-sm"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white disabled:bg-slate-300 transition rounded-xl flex items-center justify-center cursor-pointer shadow"
              title="Post Comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <p className="text-xs text-center text-slate-400 italic">Please sign in as a citizen above to chat.</p>
        )}
      </div>

    </div>
  );
}
