/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue, SeverityLevel } from '../types';

export interface PriorityBreakdown {
  score: number;
  label: 'Critical' | 'Medium' | 'Low';
  badge: string; // e.g., '🔥 Critical' or '⚠️ Medium'
  colorClass: string; // CSS color classes
  textClass: string;
  daysPending: number;
}

export function calculatePriority(issue: Issue): PriorityBreakdown {
  // Convert severity level to numerical multiplier
  let severityWeight = 1;
  if (issue.severity === 'high') severityWeight = 3;
  else if (issue.severity === 'medium') severityWeight = 2;

  const verificationsCount = issue.verifiedBy ? issue.verifiedBy.length : 0;

  // Calculate days pending (issue age)
  const reportTime = new Date(issue.reportedAt).getTime();
  const currentTime = Date.now();
  const diffTime = Math.max(0, currentTime - reportTime);
  const daysPending = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Formula: priority = severity*5 + verifications*2 + daysPending
  const score = (severityWeight * 5) + (verificationsCount * 2) + daysPending;

  let label: 'Critical' | 'Medium' | 'Low' = 'Low';
  let badge = '✅ Low';
  let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
  let textClass = 'text-emerald-600';

  if (score >= 15) {
    label = 'Critical';
    badge = '🔥 Critical';
    colorClass = 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse';
    textClass = 'text-rose-600';
  } else if (score >= 8) {
    label = 'Medium';
    badge = '⚠️ Medium';
    colorClass = 'bg-amber-50 text-amber-700 border-amber-100';
    textClass = 'text-amber-600';
  }

  return {
    score,
    label,
    badge,
    colorClass,
    textClass,
    daysPending
  };
}
