/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { Issue, User, Comment, HotspotPrediction, IssueCategory, SeverityLevel } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure database directory and file exist
function initDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const defaultData = {
      users: [
        {
          id: 'user-1',
          username: 'jane_doe',
          email: 'jane@community.org',
          points: 340,
          reportsCount: 5,
          verificationsCount: 14,
          badges: ['Pothole Patrol', 'Local Vigilante', 'Vibe Guardian'],
          role: 'citizen'
        },
        {
          id: 'user-2',
          username: 'seattle_works',
          email: 'authority@seattle.gov',
          points: 1200,
          reportsCount: 0,
          verificationsCount: 42,
          badges: ['Official Responder', 'City Engineer'],
          role: 'authority'
        },
        {
          id: 'user-3',
          username: 'brian_k',
          email: 'brian@neighborhood.net',
          points: 180,
          reportsCount: 2,
          verificationsCount: 8,
          badges: ['Eco Warrior'],
          role: 'citizen'
        }
      ],
      issues: [],
      hotspots: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

initDB();

// Helper to read DB
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], issues: [], hotspots: [] };
  }
}

// Helper to write DB
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database:', error);
  }
}

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        console.log('Gemini AI Client initialized successfully.');
      } catch (e) {
        console.error('Failed to initialize Gemini AI Client:', e);
      }
    } else {
      console.warn('GEMINI_API_KEY environment variable is not configured or is default placeholder. AI endpoints will run in smart simulation mode.');
    }
  }
  return aiClient;
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Authentication & Users
app.post('/api/login', (req, res) => {
  const { username, role } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const db = readDB();
  let user = db.users.find((u: User) => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    // Register new user
    user = {
      id: `user-${Date.now()}`,
      username: username,
      email: `${username}@community.org`,
      points: 50, // Starting bonus
      reportsCount: 0,
      verificationsCount: 0,
      badges: ['New Neighbor'],
      role: role || 'citizen'
    };
    db.users.push(user);
    writeDB(db);
  }

  res.json(user);
});

app.get('/api/users/leaderboard', (req, res) => {
  const db = readDB();
  const sorted = [...db.users].sort((a: User, b: User) => b.points - a.points);
  res.json(sorted);
});

// 2. Issues Management
app.get('/api/issues', (req, res) => {
  const db = readDB();
  res.json(db.issues);
});

app.post('/api/issues', (req, res) => {
  const { title, description, category, latitude, longitude, locationName, severity, imageUrl, reportedBy, reporterName, tags } = req.body;

  if (!title || !description || !category || !latitude || !longitude || !locationName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = readDB();
  const newIssue: Issue = {
    id: `issue-${Date.now()}`,
    title,
    description,
    category: category as IssueCategory,
    status: 'reported',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&auto=format&fit=crop&q=60',
    latitude: Number(latitude),
    longitude: Number(longitude),
    locationName,
    severity: (severity || 'medium') as SeverityLevel,
    reportedBy: reportedBy || 'anonymous',
    reporterName: reporterName || 'Anonymous Citizen',
    reportedAt: new Date().toISOString(),
    verifiedBy: [],
    rejectedBy: [],
    score: 0,
    authorityAction: null,
    comments: [],
    tags: tags || []
  };

  db.issues.push(newIssue);

  // Update user points and counts for reporting!
  const user = db.users.find((u: User) => u.id === reportedBy);
  if (user) {
    user.points += 50; // 50 points for reporting an issue!
    user.reportsCount += 1;
    // Award badge if threshold reached
    if (user.reportsCount >= 5 && !user.badges.includes('Civic Leader')) {
      user.badges.push('Civic Leader');
    }
  }

  writeDB(db);
  res.status(201).json(newIssue);
});

// Community verification (Upvote)
app.post('/api/issues/:id/verify', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'UserId is required' });
  }

  const db = readDB();
  const issue = db.issues.find((i: Issue) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  if (issue.reportedBy === userId) {
    return res.status(400).json({ error: 'You cannot verify your own reported issue!' });
  }

  if (issue.verifiedBy.includes(userId)) {
    return res.status(400).json({ error: 'You have already verified this issue.' });
  }

  // Remove from rejection list if present
  issue.rejectedBy = issue.rejectedBy.filter((u: string) => u !== userId);
  issue.verifiedBy.push(userId);
  issue.score = issue.verifiedBy.length - issue.rejectedBy.length;

  // Auto-upgrade status to 'verified' if threshold reached (e.g. 3 verifications)
  if (issue.status === 'reported' && issue.verifiedBy.length >= 3) {
    issue.status = 'verified';
  }

  // Update points for verifying user
  const verifier = db.users.find((u: User) => u.id === userId);
  if (verifier) {
    verifier.points += 15; // 15 points for validating community issues
    verifier.verificationsCount += 1;
    if (verifier.verificationsCount >= 10 && !verifier.badges.includes('Community Pillar')) {
      verifier.badges.push('Community Pillar');
    }
  }

  // Reward original reporter
  const reporter = db.users.find((u: User) => u.id === issue.reportedBy);
  if (reporter) {
    reporter.points += 10; // Extra points when community verifies your report
  }

  writeDB(db);
  res.json(issue);
});

// Community dispute (Downvote)
app.post('/api/issues/:id/dispute', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'UserId is required' });
  }

  const db = readDB();
  const issue = db.issues.find((i: Issue) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  if (issue.reportedBy === userId) {
    return res.status(400).json({ error: 'You cannot dispute your own reported issue!' });
  }

  if (issue.rejectedBy.includes(userId)) {
    return res.status(400).json({ error: 'You have already disputed this issue.' });
  }

  // Remove from verification list if present
  issue.verifiedBy = issue.verifiedBy.filter((u: string) => u !== userId);
  issue.rejectedBy.push(userId);
  issue.score = issue.verifiedBy.length - issue.rejectedBy.length;

  const disputer = db.users.find((u: User) => u.id === userId);
  if (disputer) {
    disputer.points += 15;
    disputer.verificationsCount += 1;
  }

  writeDB(db);
  res.json(issue);
});

// Authority update (Resolutions)
app.post('/api/issues/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, note, userId } = req.body;

  if (!status || !userId) {
    return res.status(400).json({ error: 'Status and userId are required' });
  }

  const db = readDB();
  const user = db.users.find((u: User) => u.id === userId);
  if (!user || user.role !== 'authority') {
    return res.status(403).json({ error: 'Only authorized municipal staff can perform this action' });
  }

  const issue = db.issues.find((i: Issue) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issue.status = status;
  issue.authorityAction = {
    note: note || `Municipal update regarding ${issue.category.toLowerCase()} maintenance.`,
    updatedBy: user.username,
    updatedAt: new Date().toISOString()
  };

  // Give points to authority for managing and solving issues
  user.points += 100;

  writeDB(db);
  res.json(issue);
});

// Comments
app.post('/api/issues/:id/comments', (req, res) => {
  const { id } = req.params;
  const { userId, username, text } = req.body;

  if (!userId || !username || !text) {
    return res.status(400).json({ error: 'UserId, username, and comment text are required' });
  }

  const db = readDB();
  const issue = db.issues.find((i: Issue) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    userId,
    username,
    text,
    createdAt: new Date().toISOString()
  };

  issue.comments.push(newComment);

  // Award gamification points for active civic discussions
  const commenter = db.users.find((u: User) => u.id === userId);
  if (commenter) {
    commenter.points += 10;
  }

  writeDB(db);
  res.status(201).json(newComment);
});

// ============================================================================
// AI LAYER & GEMINI INTEGRATION
// ============================================================================

// 1. AI Image/Issue Analysis (Day 1 & Day 2: AI-powered issue categorization and estimation)
app.post('/api/ai/analyze-image', async (req, res) => {
  const { imageBase64, userCategorySuggestion } = req.body;

  const ai = getGeminiClient();

  if (!ai) {
    // Elegant fallback simulation
    console.log('Gemini client not found, running smart simulated issue extraction...');
    const mockCategories = {
      'Pothole': {
        title: 'Deep Asphalt Pothole',
        description: 'An expansive road indentation with exposed gravel and sharp cracked edges, posing a direct threat to tires, alignment, and cyclists.',
        severity: 'high' as SeverityLevel,
        tags: ['asphalt', 'pothole', 'street-damage', 'tire-hazard']
      },
      'Water Leakage': {
        title: 'Municipal Water Pipe Leakage',
        description: 'Consistent bubbling water emerging from between concrete slabs, forming localized street flow and threatening subgrade stability.',
        severity: 'high' as SeverityLevel,
        tags: ['water-waste', 'water-leak', 'flooding', 'infrastructure']
      },
      'Damaged Streetlight': {
        title: 'Unlit Broken Streetlight Fixture',
        description: 'Shattered lamp cover and burnt bulb on municipal lamppost. Causes complete lack of nighttime visibility along the pedestrian corridor.',
        severity: 'medium' as SeverityLevel,
        tags: ['darkness', 'streetlight', 'pedestrian-safety', 'electrical']
      },
      'Waste Management': {
        title: 'Overflowing Public Dumpster & Trash Pile',
        description: 'Piled trash bags, packaging cardboard, and heavy discarded waste surrounding a full public waste receptacle, attracting pests and blocking passage.',
        severity: 'medium' as SeverityLevel,
        tags: ['litter', 'waste', 'public-health', 'sidewalk-blocked']
      },
      'Public Infra': {
        title: 'Cracked Pedestrian Sidewalk Slab',
        description: 'Sidewalk pavement fractured and lifted by roots/ground movement, producing a major trip hazard on a highly traveled neighborhood route.',
        severity: 'low' as SeverityLevel,
        tags: ['sidewalk', 'trip-hazard', 'cracked-concrete', 'accessibility']
      }
    };

    const choice = (userCategorySuggestion || 'Pothole') as IssueCategory;
    const data = mockCategories[choice] || mockCategories['Pothole'];

    return res.json({
      category: choice,
      title: data.title,
      description: data.description,
      severity: data.severity,
      tags: data.tags,
      suggestedAction: `Deploy maintenance team to examine ${choice.toLowerCase()} state and draft immediate correction plan.`
    });
  }

  try {
    let prompt = `You are the core AI of "Community Hero," a civic hyperlocal problem-solving app. 
Analyze the uploaded image representing a public infrastructure/community issue.
Categorize this issue into EXACTLY one of these categories: 'Pothole', 'Water Leakage', 'Damaged Streetlight', 'Waste Management', 'Public Infra'.
Generate a complete structured JSON response representing the analysis with these exact fields:
- category: One of the five categories listed above.
- title: A precise, human-readable, official-sounding title for the complaint (5-8 words).
- description: A highly detailed, realistic, clinical description of the damage, its extent, and immediate impact on public safety (2-3 sentences).
- severity: 'low', 'medium', or 'high' based on hazard risk.
- tags: Array of 3-4 short lowercase tags describing components (e.g. ["flooding", "pedestrian-safety"]).
- suggestedAction: A recommendation for the municipal dispatch team.

If the image is missing, unclear, or not related to public infrastructure, look at the suggestion "${userCategorySuggestion || 'Pothole'}" and imagine a typical issue of that kind to fulfill the structured response.
`;

    const contents: any[] = [prompt];
    
    if (imageBase64) {
      // Remove dataurl prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: 'One of: Pothole, Water Leakage, Damaged Streetlight, Waste Management, Public Infra' },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            severity: { type: Type.STRING, description: 'One of: low, medium, high' },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedAction: { type: Type.STRING }
          },
          required: ['category', 'title', 'description', 'severity', 'tags', 'suggestedAction']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Gemini image analysis error:', error);
    res.status(500).json({ error: 'AI image analysis failed' });
  }
});

// 2. AI Future Hotspot Predictions & Maintenance Analysis (Day 3 & Day 4: Predictive insights)
app.get('/api/ai/predict-hotspots', async (req, res) => {
  const db = readDB();
  const issuesList = db.issues;

  const ai = getGeminiClient();

  if (!ai || issuesList.length === 0) {
    // Return mock prediction clusters based on pre-seeded data or generated coordinates
    console.log('Gemini client not found, generating smart simulated risk prediction hotspots...');
    return res.json(db.hotspots || []);
  }

  try {
    const prompt = `You are the "Community Hero" Predictive Maintenance AI.
Analyze the following active community issues in our database:
${JSON.stringify(issuesList.map(i => ({ category: i.category, title: i.title, location: i.locationName, severity: i.severity, lat: i.latitude, lng: i.longitude, reportedAt: i.reportedAt })))}

Identify exactly 2 critical risk "Hotspots" or clusters where issues are compounding or indicate underlying systemic municipal weaknesses (e.g., water main pipe corrosion risk, neighborhood dark corridors, road degradation zones).
For each hotspot, invent a realistic name, coordinates centered near the issues, a numeric riskScore (0 to 100), logical reasoning based on the reports, and an actionable prevention recommendation.

Return a JSON array of exactly 2 hotspots with these exact fields:
- id: unique string
- title: string (e.g., "Corroded Water Corridor")
- category: one of 'Pothole', 'Water Leakage', 'Damaged Streetlight', 'Waste Management', 'Public Infra'
- latitude: number
- longitude: number
- riskScore: number
- reasoning: string (clinical AI reasoning)
- recommendation: string (preventative action)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              riskScore: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ['id', 'title', 'category', 'latitude', 'longitude', 'riskScore', 'reasoning', 'recommendation']
          }
        }
      }
    });

    const parsedHotspots = JSON.parse(response.text?.trim() || '[]');
    
    // Save to DB to persist
    db.hotspots = parsedHotspots;
    writeDB(db);

    res.json(parsedHotspots);
  } catch (error) {
    console.error('Gemini Hotspot prediction error:', error);
    // Return current hotspots in DB as fallback
    res.json(db.hotspots || []);
  }
});

// ============================================================================
// VITE DEV SERVER & FRONTEND HOOKUP
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
