/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueStatus = 'reported' | 'verified' | 'in_progress' | 'resolved';
export type SeverityLevel = 'low' | 'medium' | 'high';
export type IssueCategory = 'Pothole' | 'Water Leakage' | 'Damaged Streetlight' | 'Waste Management' | 'Public Infra';

export interface User {
  id: string;
  username: string;
  email: string;
  points: number;
  reportsCount: number;
  verificationsCount: number;
  badges: string[];
  role: 'citizen' | 'authority';
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface AuthorityAction {
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  severity: SeverityLevel;
  reportedBy: string; // user id
  reporterName: string;
  reportedAt: string;
  verifiedBy: string[]; // user ids
  rejectedBy: string[]; // user ids
  score: number; // calculated score based on verifications and gravity
  authorityAction?: AuthorityAction | null;
  comments: Comment[];
  tags: string[];
}

export interface HotspotPrediction {
  id: string;
  title: string;
  category: IssueCategory;
  latitude: number;
  longitude: number;
  riskScore: number; // 0-100
  reasoning: string;
  recommendation: string;
}

export interface AISolutionAnalysis {
  category: IssueCategory;
  title: string;
  description: string;
  severity: SeverityLevel;
  tags: string[];
  suggestedAction: string;
}
