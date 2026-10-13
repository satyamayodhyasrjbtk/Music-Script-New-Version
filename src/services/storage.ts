import { Track, Playlist, NotificationItem, UserProfile, CachedOfflineTrack } from '../types/music';
import { INITIAL_TRACKS, INITIAL_NOTIFICATIONS } from '../data/initialSongs';

const STORAGE_KEYS = {
  TRACKS: 'oyedj_custom_tracks_v1',
  PLAYLISTS: 'oyedj_playlists_v1',
  LIKED_TRACKS: 'oyedj_liked_tracks_v1',
  DOWNLOAD_HISTORY: 'oyedj_downloads_v1',
  CURRENT_USER: 'oyedj_user_v1',
  NOTIFICATIONS: 'oyedj_notifications_v1',
  OFFLINE_CACHE: 'oyedj_offline_cache_v1',
  CLOUD_SYNC: 'oyedj_cloud_sync_v1',
};

export const DEFAULT_USER: UserProfile = {
  id: 'usr-guest-01',
  name: 'DJ Music Fan',
  email: 'listener@oyedj.com',
  role: 'user',
  avatarBg: 'bg-indigo-600',
  joinedDate: 'October 2026',
  totalDownloads: 14,
};

export const ADMIN_USER: UserProfile = {
  id: 'usr-admin-01',
  name: 'Dj Surendra (Admin)',
  email: 'admin@oyedj.com',
  role: 'admin',
  avatarBg: 'bg-amber-600',
  joinedDate: 'January 2024',
  totalDownloads: 1540,
};

export class StorageService {
  // Tracks
  public static getTracks(): Track[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRACKS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return INITIAL_TRACKS;
  }

  public static saveTracks(tracks: Track[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(tracks));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }

  // Playlists
  public static getPlaylists(): Playlist[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [
      {
        id: 'pl-1',
        name: 'Roadshow High Bass Dhamaka',
        description: 'Hard vibration songs for DJ sound testing & car subwoofers',
        trackIds: ['track-101', 'track-102', 'track-104'],
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
    ];
  }

  public static savePlaylists(playlists: Playlist[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }

  // Liked tracks
  public static getLikedTracks(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LIKED_TRACKS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(e);
    }
    return ['track-101', 'track-102'];
  }

  public static toggleLikedTrack(trackId: string): string[] {
    const current = this.getLikedTracks();
    const exists = current.includes(trackId);
    const updated = exists ? current.filter((id) => id !== trackId) : [...current, trackId];
    try {
      localStorage.setItem(STORAGE_KEYS.LIKED_TRACKS, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    return updated;
  }

  // Download history
  public static getDownloadHistory(): { trackId: string; quality: string; downloadedAt: string }[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DOWNLOAD_HISTORY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(e);
    }
    return [
      { trackId: 'track-101', quality: '320kbps', downloadedAt: 'Yesterday' },
      { trackId: 'track-104', quality: '192kbps', downloadedAt: '2 days ago' },
    ];
  }

  public static recordDownload(trackId: string, quality: string) {
    const list = this.getDownloadHistory();
    const updated = [{ trackId, quality, downloadedAt: 'Just now' }, ...list.slice(0, 49)];
    try {
      localStorage.setItem(STORAGE_KEYS.DOWNLOAD_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  }

  // User
  public static getUser(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_USER;
  }

  public static saveUser(user: UserProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
  }

  // Notifications
  public static getNotifications(): NotificationItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_NOTIFICATIONS;
  }

  public static saveNotifications(notifs: NotificationItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    } catch (e) {
      console.warn(e);
    }
  }

  // Offline Caching
  public static getOfflineTracks(): CachedOfflineTrack[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_CACHE);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(e);
    }
    return [];
  }

  public static saveOfflineTrack(track: Track): CachedOfflineTrack[] {
    const list = this.getOfflineTracks();
    if (list.some((item) => item.trackId === track.id)) return list;
    const item: CachedOfflineTrack = {
      trackId: track.id,
      track,
      cachedAt: new Date().toLocaleDateString(),
      sizeMb: track.sizeMb,
    };
    const updated = [item, ...list];
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_CACHE, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    return updated;
  }

  public static removeOfflineTrack(trackId: string): CachedOfflineTrack[] {
    const list = this.getOfflineTracks();
    const updated = list.filter((i) => i.trackId !== trackId);
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_CACHE, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    return updated;
  }

  // Cloud Sync Info
  public static getCloudSyncInfo(): { lastSynced: string; devicesCount: number; status: 'synced' | 'syncing' | 'error' } {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLOUD_SYNC);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(e);
    }
    return {
      lastSynced: 'Just now',
      devicesCount: 2,
      status: 'synced',
    };
  }

  public static updateCloudSync(info: { lastSynced: string; devicesCount: number; status: 'synced' | 'syncing' | 'error' }) {
    try {
      localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC, JSON.stringify(info));
    } catch (e) {
      console.warn(e);
    }
  }
}
