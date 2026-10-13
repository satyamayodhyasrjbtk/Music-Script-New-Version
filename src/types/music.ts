export type AudioQuality = '320kbps' | '192kbps' | '128kbps' | 'ringtone';

export interface Track {
  id: string;
  slug: string;
  title: string;
  originalArtist: string;
  remixer: string;
  category: string;
  categorySlug: string;
  duration: number; // in seconds
  releaseYear: number;
  bpm: number;
  bitrate: string; // e.g. "320 Kbps"
  sizeMb: number;
  downloadCount: number;
  addedDate: string;
  featured?: boolean;
  isTrending?: boolean;
  description?: string;
  audioPreset: 'bhojpuri_beat' | 'bollywood_dholki' | 'haryanvi_bass' | 'punjabi_dhol' | 'bhakti_special' | 'club_edm' | 'ringtone';
  audioUrl?: string; // real audio file URL (e.g. /api/audio/track-123.mp3)
  thumbnailUrl?: string;
  status?: 'published' | 'draft';
  tags?: string[];
  fileFormat?: string; // e.g. "MP3 (Audio/MPEG)"
  // Custom SEO & Social Metadata
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  metaKeywords?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  trackCount: number;
  isHot?: boolean;
  folderType?: 'category' | 'folder';
  createdAt?: string;
  // Custom SEO & Social Metadata
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  metaKeywords?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
  coverGradient: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  trackId?: string;
  timestamp: string;
  read: boolean;
  type: 'release' | 'announcement' | 'download';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatarBg: string;
  joinedDate: string;
  totalDownloads: number;
}

export interface DownloadTask {
  id: string;
  trackId: string;
  trackTitle: string;
  quality: AudioQuality;
  sizeMb: number;
  progress: number; // 0 to 100
  speedMb: number; // e.g. 11.2 MB/s
  status: 'downloading' | 'paused' | 'completed' | 'failed';
  startedAt: number;
  downloadUrl?: string;
}

export interface CachedOfflineTrack {
  trackId: string;
  track: Track;
  cachedAt: string;
  sizeMb: number;
}
