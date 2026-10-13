import { Track, Category, UserProfile, NotificationItem } from '../types/music';
import { StorageService } from './storage';

export class ApiService {
  // Get all tracks from server or fallback to local storage
  public static async getTracks(categorySlug?: string, search?: string): Promise<Track[]> {
    try {
      const params = new URLSearchParams();
      if (categorySlug) params.append('category', categorySlug);
      if (search) params.append('search', search);
      params.append('includeDrafts', 'true');

      const res = await fetch(`/api/tracks?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Sync to local storage for offline resilience
          StorageService.saveTracks(json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.warn('API getTracks offline fallback:', err);
    }
    return StorageService.getTracks();
  }

  // Get track by slug or ID
  public static async getTrackBySlug(slugOrId: string): Promise<Track | null> {
    try {
      const res = await fetch(`/api/tracks/${encodeURIComponent(slugOrId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('API getTrackBySlug offline fallback:', err);
    }
    const local = StorageService.getTracks();
    return local.find((t) => t.slug === slugOrId || t.id === slugOrId) || null;
  }

  // Fetch 5 additional tracks by the same artist
  public static async getTracksByArtist(artistName: string, excludeTrackId?: string): Promise<Track[]> {
    try {
      const params = new URLSearchParams();
      if (artistName) params.append('artist', artistName);
      if (excludeTrackId) params.append('excludeId', excludeTrackId);
      params.append('includeDrafts', 'false');

      const res = await fetch(`/api/tracks?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          let list = json.data.filter((t: Track) => t.id !== excludeTrackId);
          if (list.length >= 5) {
            return list.slice(0, 5);
          }

          // If server returned fewer than 5, complement with local catalog
          const allLocal = StorageService.getTracks();
          const cleanTokens = artistName
            .toLowerCase()
            .split(/&|,|\bx\b|\bfeat\.?\b|\bft\.?\b|\bwith\b/i)
            .map((s) => s.trim())
            .filter((s) => s.length > 2);

          for (const item of allLocal) {
            if (item.id === excludeTrackId || list.some((x: Track) => x.id === item.id)) continue;
            const orig = item.originalArtist.toLowerCase();
            const rem = item.remixer.toLowerCase();
            if (cleanTokens.some((tok) => orig.includes(tok) || rem.includes(tok))) {
              list.push(item);
            }
            if (list.length >= 5) break;
          }

          // If still under 5, fill from popular catalog to ensure 5 tracks
          if (list.length < 5) {
            for (const item of allLocal) {
              if (item.id === excludeTrackId || list.some((x: Track) => x.id === item.id)) continue;
              list.push(item);
              if (list.length >= 5) break;
            }
          }

          return list.slice(0, 5);
        }
      }
    } catch (err) {
      console.warn('API getTracksByArtist error, using offline local storage fallback:', err);
    }

    // Offline storage fallback
    const all = StorageService.getTracks();
    const rawLower = artistName.toLowerCase();
    const tokens = rawLower
      .split(/&|,|\bx\b|\bfeat\.?\b|\bft\.?\b|\bwith\b/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);

    let matched = all.filter((t) => {
      if (t.id === excludeTrackId) return false;
      const orig = t.originalArtist.toLowerCase();
      const rem = t.remixer.toLowerCase();
      return (
        orig.includes(rawLower) ||
        rem.includes(rawLower) ||
        tokens.some((tok) => orig.includes(tok) || rem.includes(tok))
      );
    });

    if (matched.length < 5) {
      const leftovers = all.filter((t) => t.id !== excludeTrackId && !matched.some((m) => m.id === t.id));
      matched = [...matched, ...leftovers];
    }

    return matched.slice(0, 5);
  }

  // Create new track
  public static async createTrack(trackPayload: any): Promise<Track> {
    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackPayload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const current = StorageService.getTracks();
          StorageService.saveTracks([json.data, ...current.filter((t) => t.id !== json.data.id)]);
          return json.data;
        }
      }
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload track');
    } catch (err: any) {
      console.error('API createTrack error:', err);
      // Fallback local creation if server offline
      const id = `track-${Date.now()}`;
      const slug = trackPayload.slug || trackPayload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const localTrack: Track = {
        id,
        slug,
        title: trackPayload.title,
        originalArtist: trackPayload.originalArtist || 'Various Artists',
        remixer: trackPayload.remixer || 'Dj Surendra Ayodhya',
        category: trackPayload.category || 'Bhojpuri DJ Remix Songs (2026)',
        categorySlug: trackPayload.categorySlug || 'bhojpuri-dj',
        duration: Number(trackPayload.duration) || 240,
        releaseYear: Number(trackPayload.releaseYear) || 2026,
        bpm: Number(trackPayload.bpm) || 132,
        bitrate: trackPayload.bitrate || '320 Kbps',
        sizeMb: Number(trackPayload.sizeMb) || 8.5,
        downloadCount: 0,
        addedDate: new Date().toISOString().split('T')[0],
        featured: true,
        isTrending: true,
        description: trackPayload.description,
        audioPreset: trackPayload.audioPreset || 'bhojpuri_beat',
        audioUrl: trackPayload.audioUrl,
        thumbnailUrl: trackPayload.thumbnailUrl,
        status: 'published',
      };
      const current = StorageService.getTracks();
      StorageService.saveTracks([localTrack, ...current]);
      return localTrack;
    }
  }

  // Update track
  public static async updateTrack(id: string, updatePayload: any): Promise<Track> {
    try {
      const res = await fetch(`/api/tracks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const current = StorageService.getTracks();
          StorageService.saveTracks(current.map((t) => (t.id === id ? json.data : t)));
          return json.data;
        }
      }
    } catch (err) {
      console.error('API updateTrack error:', err);
    }
    const current = StorageService.getTracks();
    const updated = current.map((t) => (t.id === id ? { ...t, ...updatePayload } : t));
    StorageService.saveTracks(updated);
    return updated.find((t) => t.id === id)!;
  }

  // Delete track
  public static async deleteTrack(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/tracks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const current = StorageService.getTracks();
        StorageService.saveTracks(current.filter((t) => t.id !== id));
        return true;
      }
    } catch (err) {
      console.error('API deleteTrack error:', err);
    }
    const current = StorageService.getTracks();
    StorageService.saveTracks(current.filter((t) => t.id !== id));
    return true;
  }

  // Increment download hits
  public static async hitDownload(idOrSlug: string): Promise<void> {
    try {
      await fetch(`/api/tracks/${encodeURIComponent(idOrSlug)}/hit`, { method: 'POST' });
    } catch (err) {
      // ignore
    }
  }

  // Categories
  public static async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('API getCategories error:', err);
    }
    return [];
  }

  public static async createCategory(categoryPayload: any): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryPayload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to create category');
    }
    return json.data;
  }

  public static async updateCategory(id: string, categoryPayload: any): Promise<Category> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryPayload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update category');
    }
    return json.data;
  }

  public static async deleteCategory(id: string): Promise<boolean> {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return res.ok && json.success;
  }

  // Admin login
  public static async adminLogin(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (err: any) {
      // Local fallback for offline mode
      if ((email === 'admin@oyedj.com' || email === 'admin') && (password === 'admin123' || password === 'admin')) {
        return {
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
        };
      }
      return { success: false, error: 'Connection failed or incorrect password' };
    }
  }

  // Sitemap info & Google ping
  public static async getSitemapInfo(): Promise<any> {
    try {
      const res = await fetch('/api/sitemap/info');
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (err) {
      console.warn('getSitemapInfo error:', err);
    }
    return null;
  }

  public static async pingSitemap(): Promise<any> {
    try {
      const res = await fetch('/api/sitemap/ping', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('pingSitemap error:', err);
    }
    return { success: false, error: 'Ping failed' };
  }
}
