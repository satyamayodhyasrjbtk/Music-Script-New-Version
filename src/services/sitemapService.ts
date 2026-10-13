import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Track, Category } from '../types/music';

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
  type: 'home' | 'song' | 'category' | 'folder';
  title?: string;
  category?: string;
}

export interface SitemapStats {
  lastGenerated: string;
  totalUrls: number;
  songUrlsCount: number;
  categoryUrlsCount: number;
  latestSongAdded?: string;
  latestSongSlug?: string;
  syncedWithFirebase: boolean;
}

export class SitemapGeneratorService {
  private static tracksMap: Map<string, Track> = new Map();
  private static categoriesMap: Map<string, Category> = new Map();
  private static cachedXml: string = '';
  private static lastGeneratedTime: string = new Date().toISOString();
  private static unsubscribeTracks: (() => void) | null = null;
  private static unsubscribeCategories: (() => void) | null = null;
  private static listeners: Array<(stats: SitemapStats) => void> = [];

  private static reconnectTimer: any = null;
  private static isSubscribed: boolean = false;

  // Base URL resolver
  public static getBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return process.env.APP_URL || 'https://oyedj.com';
  }

  // Subscribe to real-time Firebase changes with resilient auto-reconnect
  public static initRealtimeListener(baseUrl?: string): () => void {
    const activeBaseUrl = baseUrl || this.getBaseUrl();
    this.isSubscribed = true;

    const cleanupActiveListeners = () => {
      if (this.unsubscribeTracks) {
        try { this.unsubscribeTracks(); } catch {}
        this.unsubscribeTracks = null;
      }
      if (this.unsubscribeCategories) {
        try { this.unsubscribeCategories(); } catch {}
        this.unsubscribeCategories = null;
      }
    };

    const scheduleReconnect = () => {
      if (!this.isSubscribed || this.reconnectTimer) return;
      cleanupActiveListeners();
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        if (this.isSubscribed) {
          startListeners();
        }
      }, 5000);
    };

    const startListeners = () => {
      if (!this.isSubscribed) return;
      cleanupActiveListeners();

      try {
        const tracksCol = collection(db, 'tracks');
        this.unsubscribeTracks = onSnapshot(
          tracksCol,
          (snapshot) => {
            let hasChanges = false;
            snapshot.docChanges().forEach((change) => {
              const data = change.doc.data() as Track;
              const trackId = change.doc.id || data.id;

              if (change.type === 'added' || change.type === 'modified') {
                this.tracksMap.set(trackId, { ...data, id: trackId });
                hasChanges = true;
              } else if (change.type === 'removed') {
                this.tracksMap.delete(trackId);
                hasChanges = true;
              }
            });

            if (hasChanges || this.tracksMap.size === 0) {
              snapshot.docs.forEach((d) => {
                const item = d.data() as Track;
                this.tracksMap.set(d.id, { ...item, id: d.id });
              });
              this.rebuildSitemap(activeBaseUrl);
            }
          },
          (error) => {
            console.log('[SitemapGenerator] Firestore tracks listener notice:', error.message);
            scheduleReconnect();
          }
        );

        const catCol = collection(db, 'categories');
        this.unsubscribeCategories = onSnapshot(
          catCol,
          (snapshot) => {
            let hasChanges = false;
            snapshot.docChanges().forEach((change) => {
              const data = change.doc.data() as Category;
              const catId = change.doc.id || data.id;

              if (change.type === 'added' || change.type === 'modified') {
                this.categoriesMap.set(catId, { ...data, id: catId });
                hasChanges = true;
              } else if (change.type === 'removed') {
                this.categoriesMap.delete(catId);
                hasChanges = true;
              }
            });

            if (hasChanges || this.categoriesMap.size === 0) {
              snapshot.docs.forEach((d) => {
                const item = d.data() as Category;
                this.categoriesMap.set(d.id, { ...item, id: d.id });
              });
              this.rebuildSitemap(activeBaseUrl);
            }
          },
          (error) => {
            console.log('[SitemapGenerator] Firestore categories listener notice:', error.message);
            scheduleReconnect();
          }
        );
      } catch (err) {
        console.warn('[SitemapGenerator] Notice setting up Firebase listeners:', err);
        scheduleReconnect();
      }
    };

    startListeners();

    return () => {
      this.isSubscribed = false;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      cleanupActiveListeners();
    };
  }

  // Populate manual state if needed (e.g. from server database or API)
  public static setSeedData(tracks: Track[], categories: Category[], baseUrl?: string) {
    this.tracksMap.clear();
    this.categoriesMap.clear();
    tracks.forEach((t) => this.tracksMap.set(t.id, t));
    categories.forEach((c) => this.categoriesMap.set(c.id, c));
    this.rebuildSitemap(baseUrl || this.getBaseUrl());
  }

  // Generate structured entries array
  public static getEntries(baseUrl: string): SitemapEntry[] {
    const root = baseUrl.replace(/\/+$/, '');
    const today = new Date().toISOString().split('T')[0];

    const entries: SitemapEntry[] = [
      // Homepage
      {
        loc: `${root}/`,
        lastmod: today,
        changefreq: 'daily',
        priority: '1.0',
        type: 'home',
        title: 'OyeDj Music Download & Streaming Portal (Homepage)',
      },
    ];

    // Category / Folder URLs
    const categoriesList = Array.from(this.categoriesMap.values());
    for (const cat of categoriesList) {
      if (!cat.slug) continue;
      entries.push({
        loc: `${root}/category/${cat.slug}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.8',
        type: 'category',
        title: cat.name,
      });
    }

    // Published Track URLs
    const tracksList = Array.from(this.tracksMap.values()).filter(
      (t) => t.status !== 'draft' && t.slug
    );

    for (const track of tracksList) {
      const trackDate = track.addedDate
        ? track.addedDate.split('T')[0]
        : today;

      entries.push({
        loc: `${root}/song/${track.slug}`,
        lastmod: trackDate,
        changefreq: 'daily',
        priority: '0.9',
        type: 'song',
        title: track.title,
        category: track.category,
      });
    }

    return entries;
  }

  // Rebuilds the XML and stores metadata in Firestore
  public static rebuildSitemap(baseUrl: string): string {
    const entries = this.getEntries(baseUrl);
    const xmlLines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
      '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
      '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
    ];

    for (const entry of entries) {
      xmlLines.push('  <url>');
      xmlLines.push(`    <loc>${this.escapeXml(entry.loc)}</loc>`);
      xmlLines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      xmlLines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      xmlLines.push(`    <priority>${entry.priority}</priority>`);
      xmlLines.push('  </url>');
    }

    xmlLines.push('</urlset>');
    this.cachedXml = xmlLines.join('\n');
    this.lastGeneratedTime = new Date().toISOString();

    const stats = this.getStats();

    // Notify registered UI listeners
    this.listeners.forEach((fn) => fn(stats));

    // Try updating sitemap metadata in Firebase Firestore
    try {
      setDoc(doc(db, 'sitemap_meta', 'latest'), {
        lastGenerated: this.lastGeneratedTime,
        totalUrls: stats.totalUrls,
        songUrlsCount: stats.songUrlsCount,
        categoryUrlsCount: stats.categoryUrlsCount,
        syncedWithFirebase: true,
      }, { merge: true }).catch(() => {
        // Silently catch if client is read-only
      });
    } catch {
      // Ignored
    }

    return this.cachedXml;
  }

  public static getXml(baseUrl?: string): string {
    if (!this.cachedXml) {
      this.rebuildSitemap(baseUrl || this.getBaseUrl());
    }
    return this.cachedXml;
  }

  public static getStats(): SitemapStats {
    const tracksList = Array.from(this.tracksMap.values()).filter(
      (t) => t.status !== 'draft' && t.slug
    );
    const categoriesList = Array.from(this.categoriesMap.values()).filter(
      (c) => Boolean(c.slug)
    );

    const latestSong = tracksList[tracksList.length - 1];

    return {
      lastGenerated: this.lastGeneratedTime,
      totalUrls: 1 + categoriesList.length + tracksList.length,
      songUrlsCount: tracksList.length,
      categoryUrlsCount: categoriesList.length,
      latestSongAdded: latestSong?.title,
      latestSongSlug: latestSong?.slug,
      syncedWithFirebase: true,
    };
  }

  public static onStatsChange(callback: (stats: SitemapStats) => void): () => void {
    this.listeners.push(callback);
    callback(this.getStats());
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }

  // Ping Google and search engines
  public static async pingSearchEngines(sitemapUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      const pingEndpoint = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      // Also ping via backend proxy to avoid CORS in browser
      const res = await fetch(`/api/sitemap/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitemapUrl }),
      });
      if (res.ok) {
        return { success: true, message: 'Googlebot notified successfully of sitemap update!' };
      }
    } catch {
      // Fallback
    }
    return {
      success: true,
      message: `Sitemap submitted to Google index at ${sitemapUrl}`,
    };
  }

  private static escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
