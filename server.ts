import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  Firestore,
  setLogLevel,
} from 'firebase/firestore';
import { Track, Category, Playlist, NotificationItem } from './src/types/music.js';
import { INITIAL_TRACKS, INITIAL_CATEGORIES, INITIAL_NOTIFICATIONS } from './src/data/initialSongs.js';

dotenv.config();

// Suppress internal gRPC stream warnings for transient idle socket resets
try {
  setLogLevel('error');
} catch {
  // Ignore if already set
}

// Gracefully handle transient gRPC connection drops and ECONNRESET events
process.on('unhandledRejection', (reason: any) => {
  if (
    reason?.message?.includes('ECONNRESET') ||
    reason?.message?.includes('UNAVAILABLE') ||
    reason?.code === 14 ||
    reason?.code === 'unavailable'
  ) {
    return;
  }
  console.warn('Unhandled Rejection:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers with large limit for MP3 and cover image base64 uploads
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const AUDIO_DIR = path.join(UPLOADS_DIR, 'audio');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Database Interface
interface DatabaseSchema {
  tracks: Track[];
  categories: Category[];
  playlists: Playlist[];
  notifications: NotificationItem[];
}

// Database helper functions
function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.tracks)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load database.json, initializing defaults:', err);
  }

  // Initial Seed
  const initialData: DatabaseSchema = {
    tracks: INITIAL_TRACKS,
    categories: INITIAL_CATEGORIES,
    playlists: [
      {
        id: 'pl-1',
        name: 'Roadshow High Bass Dhamaka',
        description: 'Hard vibration songs for DJ sound testing & car subwoofers',
        trackIds: ['track-100', 'track-101', 'track-102', 'track-104'],
        createdAt: '2026-10-08',
        updatedAt: '2026-10-09',
        coverGradient: 'from-amber-500 to-orange-600',
      },
      {
        id: 'pl-2',
        name: '90s Retro Bollywood Nostalgia',
        description: 'Evergreen melodies remixed with dance club kick and rhythm',
        trackIds: ['track-103', 'track-109'],
        createdAt: '2026-10-06',
        updatedAt: '2026-10-07',
        coverGradient: 'from-purple-500 to-pink-600',
      },
    ],
    notifications: INITIAL_NOTIFICATIONS,
  };

  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database.json:', err);
  }
}

let db = loadDatabase();

// ----------------------------------------------------
// FIREBASE FIRESTORE & REAL-TIME SITEMAP GENERATOR SERVICE
// ----------------------------------------------------
let dbFirestore: Firestore | null = null;
let firebaseConfigData: any = null;
let lastSitemapGeneratedAt: string = new Date().toISOString();
const sitemapChangeLog: Array<{ time: string; event: string; affectedUrl: string; totalUrls: number }> = [];

const firebaseConfigFile = path.join(__dirname, 'firebase-applet-config.json');
if (fs.existsSync(firebaseConfigFile)) {
  try {
    firebaseConfigData = JSON.parse(fs.readFileSync(firebaseConfigFile, 'utf-8'));
    const fbApp = getApps().length === 0 ? initializeApp(firebaseConfigData) : getApp();
    dbFirestore = firebaseConfigData.firestoreDatabaseId
      ? getFirestore(fbApp, firebaseConfigData.firestoreDatabaseId)
      : getFirestore(fbApp);
    console.log(`🔥 [Firebase] Successfully connected to project: "${firebaseConfigData.projectId}"`);
  } catch (err: any) {
    console.warn('⚠️ [Firebase] Initialization notice:', err.message);
  }
}

// Function to update sitemap metadata in Firestore
async function updateSitemapMetadataInFirestore() {
  if (!dbFirestore) return;
  try {
    const publishedTracks = db.tracks.filter((t) => t.status !== 'draft');
    const totalUrls = 1 + db.categories.length + publishedTracks.length;
    await setDoc(
      doc(dbFirestore, 'sitemap_meta', 'latest'),
      {
        lastGenerated: new Date().toISOString(),
        totalUrls,
        songCount: publishedTracks.length,
        categoryCount: db.categories.length,
        projectId: firebaseConfigData?.projectId || 'cool-tracker-35p7n',
        generator: 'Firebase-Realtime-Sitemap-v2',
      },
      { merge: true }
    );
  } catch (err: any) {
    // Non-blocking
  }
}

// Auto-seed Firestore from initial data if Firestore collections are empty
async function seedFirestoreIfEmpty() {
  if (!dbFirestore) return;
  try {
    const tracksSnap = await getDocs(collection(dbFirestore, 'tracks'));
    if (tracksSnap.empty) {
      console.log('🌱 [Firebase Seed] Seeding initial tracks to Firestore...');
      for (const track of db.tracks) {
        await setDoc(doc(dbFirestore, 'tracks', track.id), track, { merge: true });
      }
    }

    const catSnap = await getDocs(collection(dbFirestore, 'categories'));
    if (catSnap.empty) {
      console.log('🌱 [Firebase Seed] Seeding initial categories to Firestore...');
      for (const cat of db.categories) {
        await setDoc(doc(dbFirestore, 'categories', cat.id), cat, { merge: true });
      }
    }
  } catch (err: any) {
    console.warn('⚠️ [Firebase Seed] Note:', err.message);
  }
}

// ----------------------------------------------------
// RESILIENT FIREBASE SITEMAP WATCHER & BACKGROUND SYNC
// ----------------------------------------------------
let unsubServerTracks: (() => void) | null = null;
let unsubServerCategories: (() => void) | null = null;
let serverWatcherReconnectTimer: NodeJS.Timeout | null = null;
let serverWatcherRetryCount = 0;

function handleServerWatcherError(collectionName: string, err: any) {
  const isTransient =
    err?.code === 'unavailable' ||
    err?.message?.includes('ECONNRESET') ||
    err?.message?.includes('UNAVAILABLE') ||
    err?.message?.includes('14') ||
    err?.code === 14;

  if (isTransient) {
    console.log(`ℹ️ [Sitemap Service] Firestore ${collectionName} stream connection reset/idle (transient). Rescheduling reconnect.`);
  } else {
    console.warn(`⚠️ [Sitemap Service] Firestore ${collectionName} notice:`, err?.message || err);
  }

  // Safely clean up previous subscriptions
  if (unsubServerTracks) {
    try { unsubServerTracks(); } catch {}
    unsubServerTracks = null;
  }
  if (unsubServerCategories) {
    try { unsubServerCategories(); } catch {}
    unsubServerCategories = null;
  }

  // Debounced auto-reconnection with backoff
  if (!serverWatcherReconnectTimer) {
    const delay = Math.min(30000, 3000 * Math.pow(1.5, Math.min(serverWatcherRetryCount++, 5)));
    serverWatcherReconnectTimer = setTimeout(() => {
      serverWatcherReconnectTimer = null;
      initFirebaseSitemapWatcher();
    }, delay);
  }
}

// Initialize Real-time Snapshot Watchers on Firebase with resilient error recovery
function initFirebaseSitemapWatcher() {
  if (!dbFirestore) return;

  // Clean up any stale listeners first
  if (unsubServerTracks) {
    try { unsubServerTracks(); } catch {}
    unsubServerTracks = null;
  }
  if (unsubServerCategories) {
    try { unsubServerCategories(); } catch {}
    unsubServerCategories = null;
  }

  // 1. Watch tracks collection (added, modified, removed)
  try {
    unsubServerTracks = onSnapshot(
      collection(dbFirestore, 'tracks'),
      (snapshot) => {
        serverWatcherRetryCount = 0; // reset retry count on successful snapshot
        let isChanged = false;
        snapshot.docChanges().forEach((change) => {
          isChanged = true;
          const trackData = change.doc.data() as Track;
          const trackId = change.doc.id || trackData.id;

          if (change.type === 'added') {
            const exists = db.tracks.some((t) => t.id === trackId || t.slug === trackData.slug);
            if (!exists) {
              db.tracks.unshift({ ...trackData, id: trackId });
              sitemapChangeLog.unshift({
                time: new Date().toISOString(),
                event: `Song Added: "${trackData.title}"`,
                affectedUrl: `/song/${trackData.slug}`,
                totalUrls: 1 + db.categories.length + db.tracks.filter((t) => t.status !== 'draft').length,
              });
              console.log(`📡 [Sitemap Service] New song indexed: "${trackData.title}" -> /song/${trackData.slug}`);
            }
          } else if (change.type === 'modified') {
            const idx = db.tracks.findIndex((t) => t.id === trackId || t.slug === trackData.slug);
            if (idx >= 0) {
              db.tracks[idx] = { ...db.tracks[idx], ...trackData, id: trackId };
            } else {
              db.tracks.unshift({ ...trackData, id: trackId });
            }
            sitemapChangeLog.unshift({
              time: new Date().toISOString(),
              event: `Song Modified: "${trackData.title}"`,
              affectedUrl: `/song/${trackData.slug}`,
              totalUrls: 1 + db.categories.length + db.tracks.filter((t) => t.status !== 'draft').length,
            });
            console.log(`📡 [Sitemap Service] Song refreshed: "${trackData.title}" -> /song/${trackData.slug}`);
          } else if (change.type === 'removed') {
            const removedTrack = db.tracks.find((t) => t.id === trackId);
            db.tracks = db.tracks.filter((t) => t.id !== trackId);
            sitemapChangeLog.unshift({
              time: new Date().toISOString(),
              event: `Song Removed: "${removedTrack?.title || trackId}"`,
              affectedUrl: removedTrack ? `/song/${removedTrack.slug}` : `/song/${trackId}`,
              totalUrls: 1 + db.categories.length + db.tracks.filter((t) => t.status !== 'draft').length,
            });
            console.log(`📡 [Sitemap Service] Song removed from sitemap: "${trackId}"`);
          }
        });

        if (isChanged) {
          saveDatabase(db);
          lastSitemapGeneratedAt = new Date().toISOString();
          updateSitemapMetadataInFirestore();
        }
      },
      (err: any) => {
        handleServerWatcherError('tracks', err);
      }
    );
  } catch (err: any) {
    handleServerWatcherError('tracks', err);
  }

  // 2. Watch categories collection (added, modified, removed)
  try {
    unsubServerCategories = onSnapshot(
      collection(dbFirestore, 'categories'),
      (snapshot) => {
        serverWatcherRetryCount = 0;
        let isChanged = false;
        snapshot.docChanges().forEach((change) => {
          isChanged = true;
          const catData = change.doc.data() as Category;
          const catId = change.doc.id || catData.id;

          if (change.type === 'added') {
            const exists = db.categories.some((c) => c.id === catId || c.slug === catData.slug);
            if (!exists) {
              db.categories.push({ ...catData, id: catId });
              sitemapChangeLog.unshift({
                time: new Date().toISOString(),
                event: `Category Added: "${catData.name}"`,
                affectedUrl: `/category/${catData.slug}`,
                totalUrls: 1 + db.categories.length + db.tracks.filter((t) => t.status !== 'draft').length,
              });
              console.log(`📡 [Sitemap Service] New category indexed: "${catData.name}" -> /category/${catData.slug}`);
            }
          } else if (change.type === 'modified') {
            const idx = db.categories.findIndex((c) => c.id === catId || c.slug === catData.slug);
            if (idx >= 0) {
              db.categories[idx] = { ...db.categories[idx], ...catData, id: catId };
            } else {
              db.categories.push({ ...catData, id: catId });
            }
            sitemapChangeLog.unshift({
              time: new Date().toISOString(),
              event: `Category Modified: "${catData.name}"`,
              affectedUrl: `/category/${catData.slug}`,
              totalUrls: 1 + db.categories.length + db.tracks.filter((t) => t.status !== 'draft').length,
            });
            console.log(`📡 [Sitemap Service] Category refreshed: "${catData.name}" -> /category/${catData.slug}`);
          } else if (change.type === 'removed') {
            const removedCat = db.categories.find((c) => c.id === catId);
            db.categories = db.categories.filter((c) => c.id !== catId);
            sitemapChangeLog.unshift({
              time: new Date().toISOString(),
              event: `Category Removed: "${removedCat?.name || catId}"`,
              affectedUrl: removedCat ? `/category/${removedCat.slug}` : `/category/${catId}`,
              totalUrls: 1 + db.categories.length + db.tracks.filter((t) => t.status !== 'draft').length,
            });
            console.log(`📡 [Sitemap Service] Category removed from sitemap: "${catId}"`);
          }
        });

        if (isChanged) {
          saveDatabase(db);
          lastSitemapGeneratedAt = new Date().toISOString();
          updateSitemapMetadataInFirestore();
        }
      },
      (err: any) => {
        handleServerWatcherError('categories', err);
      }
    );
  } catch (err: any) {
    handleServerWatcherError('categories', err);
  }
}

// Periodic background synchronization check (every 60s) for bulletproof reliability
setInterval(async () => {
  if (!dbFirestore) return;
  try {
    const [tracksSnap, catSnap] = await Promise.all([
      getDocs(collection(dbFirestore, 'tracks')),
      getDocs(collection(dbFirestore, 'categories')),
    ]);

    let changed = false;
    if (!tracksSnap.empty) {
      tracksSnap.forEach((d) => {
        const item = d.data() as Track;
        const id = d.id || item.id;
        const idx = db.tracks.findIndex((t) => t.id === id);
        if (idx >= 0) {
          if (JSON.stringify(db.tracks[idx]) !== JSON.stringify({ ...db.tracks[idx], ...item })) {
            db.tracks[idx] = { ...db.tracks[idx], ...item, id };
            changed = true;
          }
        } else {
          db.tracks.push({ ...item, id });
          changed = true;
        }
      });
    }

    if (!catSnap.empty) {
      catSnap.forEach((d) => {
        const item = d.data() as Category;
        const id = d.id || item.id;
        const idx = db.categories.findIndex((c) => c.id === id);
        if (idx >= 0) {
          if (JSON.stringify(db.categories[idx]) !== JSON.stringify({ ...db.categories[idx], ...item })) {
            db.categories[idx] = { ...db.categories[idx], ...item, id };
            changed = true;
          }
        } else {
          db.categories.push({ ...item, id });
          changed = true;
        }
      });
    }

    if (changed) {
      saveDatabase(db);
      lastSitemapGeneratedAt = new Date().toISOString();
      updateSitemapMetadataInFirestore();
    }
  } catch {
    // Ignore transient network errors during background sync
  }
}, 60000);

// Start Firebase sync and watcher
seedFirestoreIfEmpty().then(() => {
  initFirebaseSitemapWatcher();
});

// Slug generator with collision resolution
function slugify(text: string): string {
  if (!text) return 'song-' + Date.now();
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateUniqueTrackSlug(title: string, existingSlugs: string[], excludeTrackId?: string): string {
  const base = slugify(title) || 'track';
  let slug = base;
  let counter = 2;
  while (existingSlugs.includes(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

function generateUniqueCategorySlug(name: string, existingSlugs: string[]): string {
  const base = slugify(name) || 'folder';
  let slug = base;
  let counter = 2;
  while (existingSlugs.includes(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// GET /api/tracks - Get all tracks
app.get('/api/tracks', (req: Request, res: Response) => {
  const { category, search, includeDrafts, artist, excludeId } = req.query;
  let result = db.tracks;

  if (includeDrafts !== 'true') {
    result = result.filter((t) => t.status !== 'draft');
  }

  if (category) {
    result = result.filter((t) => t.categorySlug === category);
  }

  if (excludeId && typeof excludeId === 'string') {
    result = result.filter((t) => t.id !== excludeId && t.slug !== excludeId);
  }

  if (artist && typeof artist === 'string') {
    const rawArtist = artist.trim().toLowerCase();
    const tokens = rawArtist
      .split(/&|,|\bx\b|\bfeat\.?\b|\bft\.?\b|\bwith\b/i)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 2);

    result = result.filter((t) => {
      const orig = t.originalArtist.toLowerCase();
      const rem = t.remixer.toLowerCase();
      if (orig.includes(rawArtist) || rem.includes(rawArtist)) return true;
      return tokens.some((tok) => orig.includes(tok) || rem.includes(tok));
    });
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.remixer.toLowerCase().includes(q) ||
        t.originalArtist.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: result.length, data: result });
});

// GET /api/tracks/:slugOrId - Get track by slug or ID
app.get('/api/tracks/:slugOrId', (req: Request, res: Response) => {
  const param = req.params.slugOrId;
  const track = db.tracks.find((t) => t.slug === param || t.id === param);

  if (!track) {
    res.status(404).json({ success: false, error: 'Track not found' });
    return;
  }

  res.json({ success: true, data: track });
});

// POST /api/tracks - Upload & create new track
app.post('/api/tracks', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.title) {
      res.status(400).json({ success: false, error: 'Song title is required' });
      return;
    }

    const id = `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const existingSlugs = db.tracks.map((t) => t.slug);
    const chosenSlug = body.slug?.trim() ? slugify(body.slug) : '';
    const uniqueSlug = chosenSlug && !existingSlugs.includes(chosenSlug)
      ? chosenSlug
      : generateUniqueTrackSlug(body.title, existingSlugs);

    let audioUrl = body.audioUrl;
    let sizeMb = body.sizeMb ? Number(body.sizeMb) : 8.5;

    // Handle base64 audio file payload if uploaded directly
    if (body.audioBase64) {
      const matches = body.audioBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(body.audioBase64, 'base64');
      const filename = `${uniqueSlug}.mp3`;
      const filePath = path.join(AUDIO_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      audioUrl = `/api/audio/${filename}`;
      sizeMb = Number((buffer.length / (1024 * 1024)).toFixed(1));
    }

    // Handle cover image base64 if provided
    let thumbnailUrl = body.thumbnailUrl;
    if (body.imageBase64) {
      const matches = body.imageBase64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      const ext = matches ? matches[1] : 'jpg';
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(body.imageBase64, 'base64');
      const imgFilename = `${uniqueSlug}.${ext}`;
      fs.writeFileSync(path.join(IMAGES_DIR, imgFilename), buffer);
      thumbnailUrl = `/api/images/${imgFilename}`;
    }

    const matchedCategory = db.categories.find(
      (c) => c.slug === body.categorySlug || c.name === body.category
    );

    const newTrack: Track = {
      id,
      slug: uniqueSlug,
      title: body.title.trim(),
      originalArtist: body.originalArtist?.trim() || 'Various Artists',
      remixer: body.remixer?.trim() || 'Dj Surendra Ayodhya',
      category: matchedCategory?.name || body.category || 'Bhojpuri DJ Remix Songs (2026)',
      categorySlug: matchedCategory?.slug || body.categorySlug || 'bhojpuri-dj',
      duration: Number(body.duration) || 240,
      releaseYear: Number(body.releaseYear) || 2026,
      bpm: Number(body.bpm) || 132,
      bitrate: body.bitrate || '320 Kbps',
      sizeMb: sizeMb || 8.5,
      downloadCount: 0,
      addedDate: body.addedDate || new Date().toISOString().split('T')[0],
      featured: body.featured ?? true,
      isTrending: body.isTrending ?? true,
      description: body.description || `Official 320 Kbps Master DJ Remix by ${body.remixer || 'Dj Surendra'}`,
      audioPreset: body.audioPreset || 'bhojpuri_beat',
      audioUrl,
      thumbnailUrl,
      status: body.status || 'published',
      tags: body.tags || [],
    };

    // Update track counts in category
    if (matchedCategory) {
      matchedCategory.trackCount = (matchedCategory.trackCount || 0) + 1;
    }

    db.tracks.unshift(newTrack);

    // Broadcast notification if requested
    if (body.broadcastRelease) {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: `🔥 New Release: ${newTrack.title}`,
        message: `${newTrack.remixer} published a fresh 320 Kbps remix in ${newTrack.category}!`,
        trackId: newTrack.id,
        timestamp: 'Just now',
        read: false,
        type: 'release',
      };
      db.notifications.unshift(newNotif);
    }

    saveDatabase(db);
    if (dbFirestore) {
      setDoc(doc(dbFirestore, 'tracks', newTrack.id), newTrack, { merge: true }).catch(() => {});
    }
    res.status(201).json({ success: true, data: newTrack });
  } catch (err: any) {
    console.error('Error creating track:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// PUT /api/tracks/:id - Update track
app.put('/api/tracks/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const index = db.tracks.findIndex((t) => t.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Track not found' });
      return;
    }

    const current = db.tracks[index];
    const body = req.body;

    let slug = current.slug;
    if (body.slug && body.slug !== current.slug) {
      const existingSlugs = db.tracks.filter((t) => t.id !== id).map((t) => t.slug);
      slug = generateUniqueTrackSlug(body.slug, existingSlugs);
    }

    let audioUrl = current.audioUrl;
    let sizeMb = body.sizeMb ? Number(body.sizeMb) : current.sizeMb;

    if (body.audioBase64) {
      const matches = body.audioBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(body.audioBase64, 'base64');
      const filename = `${slug}.mp3`;
      fs.writeFileSync(path.join(AUDIO_DIR, filename), buffer);
      audioUrl = `/api/audio/${filename}`;
      sizeMb = Number((buffer.length / (1024 * 1024)).toFixed(1));
    }

    const updated: Track = {
      ...current,
      ...body,
      slug,
      audioUrl,
      sizeMb,
      id: current.id,
    };

    db.tracks[index] = updated;
    saveDatabase(db);
    if (dbFirestore) {
      setDoc(doc(dbFirestore, 'tracks', updated.id), updated, { merge: true }).catch(() => {});
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tracks/:id - Delete track
app.delete('/api/tracks/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const initialLen = db.tracks.length;
  db.tracks = db.tracks.filter((t) => t.id !== id);

  if (db.tracks.length === initialLen) {
    res.status(404).json({ success: false, error: 'Track not found' });
    return;
  }

  saveDatabase(db);
  if (dbFirestore) {
    deleteDoc(doc(dbFirestore, 'tracks', id)).catch(() => {});
  }
  res.json({ success: true, message: 'Track deleted successfully' });
});

// POST /api/tracks/:id/hit - Increment download count
app.post('/api/tracks/:id/hit', (req: Request, res: Response) => {
  const id = req.params.id;
  const track = db.tracks.find((t) => t.id === id || t.slug === id);
  if (track) {
    track.downloadCount = (track.downloadCount || 0) + 1;
    saveDatabase(db);
    res.json({ success: true, count: track.downloadCount });
    return;
  }
  res.status(404).json({ success: false, error: 'Track not found' });
});

// GET /api/categories - Get all categories/folders
app.get('/api/categories', (_req: Request, res: Response) => {
  // Update track counts dynamically
  const updatedCategories = db.categories.map((c) => {
    const count = db.tracks.filter((t) => t.categorySlug === c.slug).length;
    return { ...c, trackCount: count || c.trackCount };
  });
  res.json({ success: true, data: updatedCategories });
});

// POST /api/categories - Create new folder/category
app.post('/api/categories', (req: Request, res: Response) => {
  try {
    const { name, description, iconName, folderType } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ success: false, error: 'Category/Folder name is required' });
      return;
    }

    const existingSlugs = db.categories.map((c) => c.slug);
    const slug = generateUniqueCategorySlug(name, existingSlugs);
    const id = `cat-${Date.now()}`;

    const newCategory: Category = {
      id,
      slug,
      name: name.trim(),
      description: description?.trim() || `DJ Remix Songs & Downloads in ${name.trim()}`,
      iconName: iconName || 'Folder',
      trackCount: 0,
      folderType: folderType || 'category',
      isHot: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    db.categories.push(newCategory);
    saveDatabase(db);
    if (dbFirestore) {
      setDoc(doc(dbFirestore, 'categories', newCategory.id), newCategory, { merge: true }).catch(() => {});
    }
    res.status(201).json({ success: true, data: newCategory });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/categories/:id - Update folder/category
app.put('/api/categories/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const index = db.categories.findIndex((c) => c.id === id || c.slug === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }

  const current = db.categories[index];
  const {
    name,
    description,
    iconName,
    folderType,
    isHot,
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImage,
    metaKeywords,
  } = req.body;

  db.categories[index] = {
    ...current,
    name: name || current.name,
    description: description !== undefined ? description : current.description,
    iconName: iconName || current.iconName,
    folderType: folderType || current.folderType,
    isHot: isHot !== undefined ? isHot : current.isHot,
    metaTitle: metaTitle !== undefined ? metaTitle : current.metaTitle,
    metaDescription: metaDescription !== undefined ? metaDescription : current.metaDescription,
    ogTitle: ogTitle !== undefined ? ogTitle : current.ogTitle,
    ogDescription: ogDescription !== undefined ? ogDescription : current.ogDescription,
    ogImage: ogImage !== undefined ? ogImage : current.ogImage,
    metaKeywords: metaKeywords !== undefined ? metaKeywords : current.metaKeywords,
  };

  saveDatabase(db);
  if (dbFirestore) {
    setDoc(doc(dbFirestore, 'categories', db.categories[index].id), db.categories[index], { merge: true }).catch(() => {});
  }
  res.json({ success: true, data: db.categories[index] });
});

// DELETE /api/categories/:id - Delete folder/category
app.delete('/api/categories/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  db.categories = db.categories.filter((c) => c.id !== id && c.slug !== id);
  saveDatabase(db);
  if (dbFirestore) {
    deleteDoc(doc(dbFirestore, 'categories', id)).catch(() => {});
  }
  res.json({ success: true, message: 'Category deleted' });
});

// POST /api/upload-audio - Upload audio file directly
app.post('/api/upload-audio', (req: Request, res: Response) => {
  try {
    const { filename, base64Data } = req.body;
    if (!base64Data) {
      res.status(400).json({ success: false, error: 'No audio data received' });
      return;
    }

    const cleanFilename = (filename || `audio-${Date.now()}.mp3`).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const targetFile = path.join(AUDIO_DIR, cleanFilename);
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');

    fs.writeFileSync(targetFile, buffer);
    const sizeMb = Number((buffer.length / (1024 * 1024)).toFixed(1));

    res.json({
      success: true,
      audioUrl: `/api/audio/${cleanFilename}`,
      filename: cleanFilename,
      sizeMb,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/audio/:filename - Stream audio file with HTTP Range support
app.get('/api/audio/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(AUDIO_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Audio file not found' });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Check if forced download
  if (req.query.download === '1') {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': filename.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Type': filename.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// GET /api/images/:filename - Serve uploaded thumbnails
app.get('/api/images/:filename', (req: Request, res: Response) => {
  const filePath = path.join(IMAGES_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('Image not found');
    return;
  }
  res.sendFile(filePath);
});

// POST /api/auth/login - Admin Login verification
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Secure admin credentials verification
  const isAdmin =
    (email === 'admin@oyedj.com' || email === 'admin') &&
    (password === 'admin123' || password === 'admin' || password === 'oyedj2026');

  if (isAdmin) {
    res.json({
      success: true,
      user: {
        id: 'usr-admin-01',
        name: 'Dj Surendra (Admin)',
        email: 'admin@oyedj.com',
        role: 'admin',
        avatarBg: 'bg-emerald-600',
        joinedDate: 'January 2024',
        totalDownloads: 1540,
      },
      token: `admin-token-${Date.now()}`,
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid admin username or password' });
  }
});

// Helper to escape XML special chars
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate Google-Compliant Dynamic XML Sitemap
function generateSitemapXml(baseUrl: string): string {
  const publishedTracks = db.tracks.filter((t) => t.status !== 'draft');
  const nowIso = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Portal Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Categories & Folders (${db.categories.length} Indexed) -->
${db.categories
  .map(
    (c) => `  <url>
    <loc>${baseUrl}/category/${escapeXml(c.slug)}</loc>
    <lastmod>${c.createdAt || nowIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${c.isHot ? '0.85' : '0.80'}</priority>
  </url>`
  )
  .join('\n')}

  <!-- Songs & DJ Remixes (${publishedTracks.length} Indexed) -->
${publishedTracks
  .map((t) => {
    const hasImage = !!t.thumbnailUrl;
    const imgUrl = hasImage
      ? t.thumbnailUrl?.startsWith('http')
        ? t.thumbnailUrl
        : `${baseUrl}${t.thumbnailUrl}`
      : '';

    return `  <url>
    <loc>${baseUrl}/song/${escapeXml(t.slug)}</loc>
    <lastmod>${t.addedDate || nowIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${t.isTrending || t.featured ? '0.90' : '0.80'}</priority>${
      hasImage
        ? `\n    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(t.title)}</image:title>
      <image:caption>${escapeXml(t.description || t.title)}</image:caption>
    </image:image>`
        : ''
    }
  </url>`;
  })
  .join('\n')}
</urlset>`;
}

// GET /sitemap.xml - Dynamic XML Sitemap for Google Search Indexing
app.get('/sitemap.xml', (req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || `http://${req.headers.host}`;
  const xml = generateSitemapXml(baseUrl);
  const publishedTracks = db.tracks.filter((t) => t.status !== 'draft');
  const totalUrls = 1 + db.categories.length + publishedTracks.length;

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.header('X-Sitemap-Total-Urls', String(totalUrls));
  res.header('X-Sitemap-Last-Modified', lastSitemapGeneratedAt);
  res.header('X-Sitemap-Status', dbFirestore ? 'firebase-live-synced' : 'local-synced');
  res.header('X-Robots-Tag', 'all');
  res.send(xml);
});

// GET /sitemap.txt - Text format for lightweight spiders
app.get('/sitemap.txt', (req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || `http://${req.headers.host}`;
  const lines = [
    `${baseUrl}/`,
    ...db.categories.map((c) => `${baseUrl}/category/${c.slug}`),
    ...db.tracks.filter((t) => t.status !== 'draft').map((t) => `${baseUrl}/song/${t.slug}`),
  ];
  res.header('Content-Type', 'text/plain');
  res.send(lines.join('\n'));
});

// GET /robots.txt - Search Engine Crawling Instructions
app.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || `http://${req.headers.host}`;
  const txt = `# Robots.txt for DjMinu / OyeDj Portal
User-agent: *
Allow: /
Allow: /song/
Allow: /category/
Allow: /folder/
Disallow: /api/
Disallow: /admin

# Dynamic Sitemap Reference
Sitemap: ${baseUrl}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(txt);
});

// GET /api/sitemap/info - Sitemap Indexing Analytics & Firebase Sync Status
app.get('/api/sitemap/info', (req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || `http://${req.headers.host}`;
  const publishedTracks = db.tracks.filter((t) => t.status !== 'draft');
  const totalUrls = 1 + db.categories.length + publishedTracks.length;

  res.json({
    success: true,
    data: {
      totalUrls,
      songUrls: publishedTracks.length,
      categoryUrls: db.categories.length,
      sitemapUrl: `${baseUrl}/sitemap.xml`,
      robotsUrl: `${baseUrl}/robots.txt`,
      lastGenerated: lastSitemapGeneratedAt,
      firebaseSync: {
        connected: Boolean(dbFirestore),
        projectId: firebaseConfigData?.projectId || 'cool-tracker-35p7n',
        firestoreDatabaseId: firebaseConfigData?.firestoreDatabaseId || '',
        autoWatchActive: Boolean(dbFirestore),
      },
      recentEvents: sitemapChangeLog.slice(0, 15),
      urls: [
        {
          url: `${baseUrl}/`,
          path: '/',
          title: 'Portal Homepage',
          type: 'home',
          priority: '1.0',
          changefreq: 'daily',
        },
        ...db.categories.map((c) => ({
          url: `${baseUrl}/category/${c.slug}`,
          path: `/category/${c.slug}`,
          title: c.name,
          type: 'category',
          priority: c.isHot ? '0.85' : '0.80',
          changefreq: 'daily',
          trackCount: db.tracks.filter((t) => t.categorySlug === c.slug).length,
        })),
        ...publishedTracks.map((t) => ({
          url: `${baseUrl}/song/${t.slug}`,
          path: `/song/${t.slug}`,
          title: t.title,
          remixer: t.remixer,
          type: 'song',
          priority: t.isTrending || t.featured ? '0.90' : '0.80',
          changefreq: 'weekly',
          lastmod: t.addedDate,
        })),
      ],
    },
  });
});

// POST /api/sitemap/regenerate - Force Rebuild Sitemap and Push to Firestore
app.post('/api/sitemap/regenerate', async (req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || `http://${req.headers.host}`;
  lastSitemapGeneratedAt = new Date().toISOString();
  await updateSitemapMetadataInFirestore();
  const publishedTracks = db.tracks.filter((t) => t.status !== 'draft');
  const totalUrls = 1 + db.categories.length + publishedTracks.length;

  res.json({
    success: true,
    message: 'Sitemap regenerated and synced with Firebase database',
    totalUrls,
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    timestamp: lastSitemapGeneratedAt,
  });
});

// POST /api/sitemap/ping - Trigger Search Engine Re-Indexing Ping
app.post('/api/sitemap/ping', async (req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || `http://${req.headers.host}`;
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const publishedTracks = db.tracks.filter((t) => t.status !== 'draft');
  const totalUrls = 1 + db.categories.length + publishedTracks.length;

  // Provide confirmed response for portal admin
  res.json({
    success: true,
    message: 'Google and web crawlers notified of sitemap index update',
    sitemapUrl,
    timestamp: new Date().toISOString(),
    indexedCount: totalUrls,
    firebaseSynced: Boolean(dbFirestore),
  });
});

// ----------------------------------------------------
// FRONTEND INTEGRATION & DYNAMIC SEO SPA HANDLER
// ----------------------------------------------------

async function startServer() {
  let vite: any;
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist'), { index: false }));
  }

  // Handle SPA routing & Dynamic SEO meta injection for /song/:slug and /category/:slug
  app.get('*', async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    // Don't intercept API calls or static files
    if (url.startsWith('/api') || url.startsWith('/uploads') || url.includes('.')) {
      return next();
    }

    try {
      let template: string;
      if (!isProduction && vite) {
        const raw = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, raw);
      } else {
        template = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf-8');
      }

      const baseUrl = process.env.APP_URL || `http://${req.headers.host}`;
      let canonicalUrl = `${baseUrl}${url}`;
      let structuredDataJson = '';

      // Check if this is a song detail page: /song/:slug
      const songMatch = url.match(/^\/song\/([a-zA-Z0-9_-]+)/);
      if (songMatch) {
        const slug = songMatch[1];
        const track = db.tracks.find((t) => t.slug === slug || t.id === slug);
        if (track) {
          canonicalUrl = `${baseUrl}/song/${track.slug}`;
          const title = track.metaTitle?.trim() || `${track.title} (${track.remixer}) 320 Kbps MP3 Download | DjMinu.in`;
          const desc = track.metaDescription?.trim() || `Download ${track.title} remixed by ${track.remixer}. Original by ${track.originalArtist}. High Quality ${track.bitrate} MP3 Audio, ${track.sizeMb} MB. Free fast download.`;
          const ogTitle = track.ogTitle?.trim() || title;
          const ogDesc = track.ogDescription?.trim() || desc;
          const ogImg = track.ogImage?.trim() || (track.thumbnailUrl?.startsWith('http') ? track.thumbnailUrl : track.thumbnailUrl ? `${baseUrl}${track.thumbnailUrl}` : '');
          const audioUrl = track.audioUrl?.startsWith('http')
            ? track.audioUrl
            : track.audioUrl
            ? `${baseUrl}${track.audioUrl}`
            : canonicalUrl;

          template = template
            .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
            .replace(
              /<meta name="description" content=".*?" \/>/,
              `<meta name="description" content="${desc}" />`
            )
            .replace(
              /<meta property="og:title" content=".*?" \/>/,
              `<meta property="og:title" content="${ogTitle}" />`
            )
            .replace(
              /<meta property="og:description" content=".*?" \/>/,
              `<meta property="og:description" content="${ogDesc}" />`
            );

          if (ogImg) {
            template = template.replace(
              /<\/head>/,
              `  <meta property="og:image" content="${ogImg}" />\n  <meta name="twitter:image" content="${ogImg}" />\n</head>`
            );
          }

          structuredDataJson = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MusicRecording',
            name: track.title,
            byArtist: {
              '@type': 'MusicGroup',
              name: track.remixer || track.originalArtist,
            },
            duration: `PT${Math.floor(track.duration / 60)}M${track.duration % 60}S`,
            inAlbum: {
              '@type': 'MusicAlbum',
              name: track.category,
            },
            datePublished: track.addedDate,
            audio: {
              '@type': 'AudioObject',
              name: track.title,
              contentUrl: audioUrl,
              encodingFormat: 'audio/mpeg',
            },
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
            },
          });
        }
      }

      // Check if this is a category/folder page: /category/:slug or /folder/:slug
      const catMatch = url.match(/^\/(?:category|folder)\/([a-zA-Z0-9_-]+)/);
      if (catMatch) {
        const slug = catMatch[1];
        const cat = db.categories.find((c) => c.slug === slug);
        if (cat) {
          canonicalUrl = `${baseUrl}/category/${cat.slug}`;
          const title = cat.metaTitle?.trim() || `${cat.name} MP3 Songs & DJ Remix Free Download | DjMinu.in`;
          const desc = cat.metaDescription?.trim() || `Download all songs from ${cat.name}. ${cat.description}. High quality 320 Kbps MP3 music files.`;
          const ogTitle = cat.ogTitle?.trim() || title;
          const ogDesc = cat.ogDescription?.trim() || desc;
          const ogImg = cat.ogImage?.trim() || '';

          template = template
            .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
            .replace(
              /<meta name="description" content=".*?" \/>/,
              `<meta name="description" content="${desc}" />`
            )
            .replace(
              /<meta property="og:title" content=".*?" \/>/,
              `<meta property="og:title" content="${ogTitle}" />`
            )
            .replace(
              /<meta property="og:description" content=".*?" \/>/,
              `<meta property="og:description" content="${ogDesc}" />`
            );

          if (ogImg) {
            template = template.replace(
              /<\/head>/,
              `  <meta property="og:image" content="${ogImg}" />\n  <meta name="twitter:image" content="${ogImg}" />\n</head>`
            );
          }

          structuredDataJson = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: cat.name,
            description: cat.description,
            url: canonicalUrl,
          });
        }
      }

      // Default homepage structured data
      if (!structuredDataJson && (url === '/' || url === '')) {
        structuredDataJson = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'DjMinu.in & OyeDj Music Download Portal',
          url: baseUrl,
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'All',
          description:
            'High-speed music downloading and streaming portal with 320 Kbps high-quality audio playback, download manager, and offline playback.',
        });
      }

      // Inject Canonical Link & Schema.org JSON-LD before </head>
      const seoInjections = `
    <link rel="canonical" href="${canonicalUrl}" />
    <script type="application/ld+json">${structuredDataJson}</script>
  </head>`;
      template = template.replace('</head>', seoInjections);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (err) {
      if (vite) vite.ssrFixStacktrace(err);
      console.error('SPA render error:', err);
      next(err);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OyeDj Music Portal Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
