import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NoticeBoard } from './components/NoticeBoard';
import { CategoryBrowser } from './components/CategoryBrowser';
import { TrackTable } from './components/TrackTable';
import { SongDetailPage } from './components/SongDetailPage';
import { CategoryDetailPage } from './components/CategoryDetailPage';
import { TrackDetailModal } from './components/TrackDetailModal';
import { AudioPlayer } from './components/AudioPlayer';
import { DownloadManagerDrawer } from './components/DownloadManagerDrawer';
import { PlaylistModal } from './components/PlaylistModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { OfflineLibraryModal } from './components/OfflineLibraryModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AuthModal } from './components/AuthModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';

import {
  Track,
  Category,
  Playlist,
  NotificationItem,
  UserProfile,
  DownloadTask,
  AudioQuality,
  CachedOfflineTrack,
} from './types/music';

import { INITIAL_CATEGORIES } from './data/initialSongs';
import { StorageService } from './services/storage';
import { audioEngine } from './services/audioEngine';
import { ApiService } from './services/api';
import { SitemapGeneratorService } from './services/sitemapService';

export default function App() {
  // Main Data States
  const [tracks, setTracks] = useState<Track[]>(() => StorageService.getTracks());
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => StorageService.getPlaylists());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    StorageService.getNotifications()
  );
  const [user, setUser] = useState<UserProfile>(() => StorageService.getUser());
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(() => StorageService.getLikedTracks());
  const [offlineTracks, setOfflineTracks] = useState<CachedOfflineTrack[]>(() =>
    StorageService.getOfflineTracks()
  );
  const [cloudSyncInfo, setCloudSyncInfo] = useState(() => StorageService.getCloudSyncInfo());

  // Dynamic Routing State
  // routeView: 'home' | 'song' | 'category'
  const [currentRoute, setCurrentRoute] = useState<{
    view: 'home' | 'song' | 'category';
    slug?: string;
  }>({ view: 'home' });

  // Filter & Search States
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Audio Playback States
  const [currentTrack, setCurrentTrack] = useState<Track | null>(tracks[0] || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Download Manager States
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [isDownloadDrawerOpen, setIsDownloadDrawerOpen] = useState<boolean>(false);

  // Active Modals
  const [detailModalTrack, setDetailModalTrack] = useState<Track | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Offline Simulation Mode State
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // Toast Notification Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // ----------------------------------------------------
  // ROUTE PARSING & HISTORY API
  // ----------------------------------------------------
  const syncRouteFromPath = useCallback(() => {
    const pathname = window.location.pathname;

    const songMatch = pathname.match(/^\/song\/([a-zA-Z0-9_-]+)/);
    if (songMatch) {
      setCurrentRoute({ view: 'song', slug: songMatch[1] });
      return;
    }

    const catMatch = pathname.match(/^\/(?:category|folder)\/([a-zA-Z0-9_-]+)/);
    if (catMatch) {
      setCurrentRoute({ view: 'category', slug: catMatch[1] });
      return;
    }

    if (pathname === '/admin') {
      setIsAdminModalOpen(true);
      setCurrentRoute({ view: 'home' });
      return;
    }

    setCurrentRoute({ view: 'home' });
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    syncRouteFromPath();
  };

  // Sync route on popstate and initial load
  useEffect(() => {
    syncRouteFromPath();
    const handlePopState = () => syncRouteFromPath();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncRouteFromPath]);

  // Load server data on mount and start Firebase Real-time Sitemap service
  useEffect(() => {
    const unsubSitemap = SitemapGeneratorService.initRealtimeListener();

    const loadServerData = async () => {
      try {
        const [serverTracks, serverCategories] = await Promise.all([
          ApiService.getTracks(),
          ApiService.getCategories(),
        ]);
        if (serverTracks && serverTracks.length > 0) {
          setTracks(serverTracks);
          if (!currentTrack) {
            setCurrentTrack(serverTracks[0]);
          }
        }
        if (serverCategories && serverCategories.length > 0) {
          setCategories(serverCategories);
        }
        if (serverTracks && serverCategories) {
          SitemapGeneratorService.setSeedData(serverTracks, serverCategories);
        }
      } catch (err) {
        console.warn('Failed to load server data:', err);
      }
    };
    loadServerData();

    return () => {
      unsubSitemap();
    };
  }, []);

  // Playback Control Handlers
  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      audioEngine.resume();
      setIsPlaying(true);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      audioEngine.playTrack(
        track,
        0,
        undefined,
        () => handleNextTrack()
      );
    }
  };

  const handlePauseTrack = () => {
    audioEngine.pause();
    setIsPlaying(false);
  };

  const handleNextTrack = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    handlePlayTrack(tracks[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handlePlayTrack(tracks[prevIndex]);
  };

  // Liked Tracks Handler
  const handleToggleLike = (trackId: string) => {
    const updated = StorageService.toggleLikedTrack(trackId);
    setLikedTrackIds(updated);
    showToast(updated.includes(trackId) ? 'Added to favorites ❤️' : 'Removed from favorites');
  };

  // Offline Caching Handler
  const handleToggleOffline = (track: Track) => {
    const isCached = offlineTracks.some((item) => item.trackId === track.id);
    if (isCached) {
      const updated = StorageService.removeOfflineTrack(track.id);
      setOfflineTracks(updated);
      showToast(`Removed "${track.title}" from offline storage`);
    } else {
      const updated = StorageService.saveOfflineTrack(track);
      setOfflineTracks(updated);
      showToast(`Saved "${track.title}" for offline playback! 📲`);
    }
  };

  const handleRemoveCachedTrack = (trackId: string) => {
    const updated = StorageService.removeOfflineTrack(trackId);
    setOfflineTracks(updated);
  };

  // Fast Download Manager Logic
  const handleStartDownload = async (track: Track, quality: AudioQuality = '320kbps') => {
    const taskId = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const calcSizeMb =
      quality === '320kbps'
        ? track.sizeMb
        : quality === '192kbps'
        ? Number((track.sizeMb * 0.6).toFixed(1))
        : quality === '128kbps'
        ? Number((track.sizeMb * 0.4).toFixed(1))
        : 1.2;

    const newTask: DownloadTask = {
      id: taskId,
      trackId: track.id,
      trackTitle: track.title,
      quality,
      sizeMb: calcSizeMb,
      progress: 5,
      speedMb: 14.5 + Math.random() * 6.5,
      status: 'downloading',
      startedAt: Date.now(),
    };

    setDownloadTasks((prev) => [newTask, ...prev]);
    setIsDownloadDrawerOpen(true);
    showToast(`Downloading "${track.title}" (${quality})... ⬇️`);

    // Increment track download hits on server and client
    ApiService.hitDownload(track.id);
    const updatedTracks = tracks.map((t) =>
      t.id === track.id ? { ...t, downloadCount: (t.downloadCount || 0) + 1 } : t
    );
    setTracks(updatedTracks);
    StorageService.saveTracks(updatedTracks);
    StorageService.recordDownload(track.id, quality);

    // Simulate fast progressive download steps
    let currentProgress = 5;
    const interval = setInterval(async () => {
      currentProgress += Math.floor(Math.random() * 25) + 20;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);

        // Generate actual playable Audio Blob and trigger real browser download
        try {
          const blob = await audioEngine.generateAudioBlob(track, quality);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const cleanName = track.title.replace(/[^a-zA-Z0-9_-]/g, '_');
          a.download = `${cleanName}_${quality}_DjMinu.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (err) {
          console.warn('Real blob generation fallback', err);
        }

        setDownloadTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, progress: 100, status: 'completed' } : t
          )
        );
        showToast(`Download finished: "${track.title}" saved to disk! ✅`);
      } else {
        setDownloadTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  progress: currentProgress,
                  speedMb: 14 + Math.random() * 8,
                }
              : t
          )
        );
      }
    }, 400);
  };

  const handlePauseDownloadTask = (id: string) => {
    setDownloadTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'paused' } : t))
    );
  };

  const handleResumeDownloadTask = (id: string) => {
    setDownloadTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'downloading' } : t))
    );
  };

  const handleCancelDownloadTask = (id: string) => {
    setDownloadTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearCompletedDownloads = () => {
    setDownloadTasks((prev) => prev.filter((t) => t.status !== 'completed'));
  };

  // Playlists Handlers
  const handleCreatePlaylist = (name: string, description: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description,
      trackIds: selectedTrackForPlaylist ? [selectedTrackForPlaylist.id] : [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      coverGradient: 'from-amber-500 to-orange-600',
    };
    const updated = [newPl, ...playlists];
    setPlaylists(updated);
    StorageService.savePlaylists(updated);
    showToast(`Created playlist "${name}"`);
  };

  const handleDeletePlaylist = (id: string) => {
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    StorageService.savePlaylists(updated);
    showToast('Playlist deleted');
  };

  const handleAddTrackToPlaylist = (playlistId: string, trackId: string) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId && !p.trackIds.includes(trackId)) {
        return { ...p, trackIds: [...p.trackIds, trackId] };
      }
      return p;
    });
    setPlaylists(updated);
    StorageService.savePlaylists(updated);
    showToast('Track added to playlist! 🎵');
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        return { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) };
      }
      return p;
    });
    setPlaylists(updated);
    StorageService.savePlaylists(updated);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    const firstTrack = tracks.find((t) => playlist.trackIds.includes(t.id));
    if (firstTrack) {
      handlePlayTrack(firstTrack);
      showToast(`Playing playlist: "${playlist.name}"`);
    } else {
      showToast('Playlist has no tracks yet');
    }
  };

  // Admin Actions Handlers
  const handleAdminLogin = async (email: string, pass: string): Promise<boolean> => {
    const res = await ApiService.adminLogin(email, pass);
    if (res.success && res.user) {
      setUser(res.user);
      StorageService.saveUser(res.user);
      showToast('Admin logged in successfully! 🛡️');
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    const guestUser: UserProfile = {
      id: 'usr-guest',
      name: 'Guest Listener',
      email: 'guest@oyedj.com',
      role: 'user',
      avatarBg: 'bg-slate-600',
      joinedDate: 'Just now',
      totalDownloads: 0,
    };
    setUser(guestUser);
    StorageService.saveUser(guestUser);
    showToast('Admin signed out');
  };

  const handleAddTrackAdmin = async (trackData: any, broadcastRelease: boolean): Promise<Track | void> => {
    try {
      const created = await ApiService.createTrack({
        ...trackData,
        broadcastRelease,
      });

      const updated = [created, ...tracks.filter((t) => t.id !== created.id)];
      setTracks(updated);

      // Update category track counts
      const updatedCats = categories.map((c) =>
        c.slug === created.categorySlug ? { ...c, trackCount: (c.trackCount || 0) + 1 } : c
      );
      setCategories(updatedCats);

      if (broadcastRelease) {
        handleBroadcastNotification(
          `🔥 New Release: ${created.title}`,
          `${created.remixer} has just published this fresh DJ mix in 320 Kbps HQ!`,
          created.id
        );
      }
      showToast(`Song "${created.title}" published! Dedicated URL: /song/${created.slug} 🚀`);
      return created;
    } catch (err: any) {
      showToast(`Upload error: ${err.message}`);
    }
  };

  const handleUpdateTrackAdmin = async (updatedTrack: Track) => {
    try {
      const saved = await ApiService.updateTrack(updatedTrack.id, updatedTrack);
      const updated = tracks.map((t) => (t.id === saved.id ? saved : t));
      setTracks(updated);
      showToast('Track metadata updated');
    } catch (err: any) {
      showToast('Update failed');
    }
  };

  const handleDeleteTrackAdmin = async (trackId: string) => {
    try {
      await ApiService.deleteTrack(trackId);
      const updated = tracks.filter((t) => t.id !== trackId);
      setTracks(updated);
      showToast('Track deleted from database');
      if (currentRoute.view === 'song') {
        navigateTo('/');
      }
    } catch (err: any) {
      showToast('Delete failed');
    }
  };

  const handleCreateCategoryAdmin = async (categoryData: any) => {
    try {
      const created = await ApiService.createCategory(categoryData);
      setCategories([...categories, created]);
      showToast(`Folder "${created.name}" created at /category/${created.slug}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create category');
    }
  };

  const handleUpdateCategoryAdmin = async (id: string, categoryData: any) => {
    try {
      const updated = await ApiService.updateCategory(id, categoryData);
      setCategories(categories.map((c) => (c.id === id || c.slug === id ? updated : c)));
      showToast('Category updated');
    } catch (err: any) {
      showToast('Update failed');
    }
  };

  const handleDeleteCategoryAdmin = async (id: string) => {
    try {
      await ApiService.deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id && c.slug !== id));
      showToast('Category deleted');
      if (currentRoute.view === 'category' && currentRoute.slug === id) {
        navigateTo('/');
      }
    } catch (err: any) {
      showToast('Delete failed');
    }
  };

  const handleBroadcastNotification = (title: string, message: string, trackId?: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      trackId,
      timestamp: 'Just now',
      read: false,
      type: 'release',
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    StorageService.saveNotifications(updated);
    showToast(`📢 Announcement sent: ${title}`);
  };

  // Notifications Handlers
  const handleMarkAllNotifsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleClearNotifs = () => {
    setNotifications([]);
    StorageService.saveNotifications([]);
  };

  const handleSelectTrackNotification = (trackId: string) => {
    const found = tracks.find((t) => t.id === trackId);
    if (found) {
      navigateTo(`/song/${found.slug}`);
      handlePlayTrack(found);
    }
  };

  // Cloud Sync Handler
  const handleTriggerCloudSync = () => {
    const updatedInfo = {
      lastSynced: 'Just now',
      devicesCount: 2,
      status: 'synced' as const,
    };
    setCloudSyncInfo(updatedInfo);
    StorageService.updateCloudSync(updatedInfo);
    showToast('Playlists & favorites synced with cloud! ☁️');
  };

  // Filtered Tracks for Home view
  const filteredTracks = tracks.filter((t) => {
    if (isOfflineMode) {
      const isCached = offlineTracks.some((off) => off.trackId === t.id);
      if (!isCached) return false;
    }

    if (selectedCategorySlug && t.categorySlug !== selectedCategorySlug) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchArtist = t.originalArtist.toLowerCase().includes(q);
      const matchRemixer = t.remixer.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      return matchTitle || matchArtist || matchRemixer || matchCat;
    }

    return true;
  });

  const selectedCategoryObj = categories.find((c) => c.slug === selectedCategorySlug);
  const activeDownloadsCount = downloadTasks.filter((t) => t.status === 'downloading').length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  // Active Song for Route /song/:slug
  const activeRouteSong = currentRoute.view === 'song'
    ? tracks.find((t) => t.slug === currentRoute.slug || t.id === currentRoute.slug)
    : null;

  // Active Category for Route /category/:slug
  const activeRouteCategory = currentRoute.view === 'category'
    ? categories.find((c) => c.slug === currentRoute.slug || c.id === currentRoute.slug)
    : null;

  const activeRouteCategoryTracks = activeRouteCategory
    ? tracks.filter((t) => t.categorySlug === activeRouteCategory.slug)
    : [];

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans pb-28 md:pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 bg-emerald-950 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-emerald-700 animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Emerald Green Top Header */}
      <Header
        user={user}
        categories={categories}
        searchQuery={searchQuery}
        selectedCategorySlug={selectedCategorySlug}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (currentRoute.view !== 'home') {
            navigateTo('/');
          }
        }}
        onCategoryFilterChange={(slug) => {
          if (slug) {
            navigateTo(`/category/${slug}`);
          } else {
            navigateTo('/');
            setSelectedCategorySlug('');
          }
        }}
        unreadNotifsCount={unreadNotifsCount}
        activeDownloadsCount={activeDownloadsCount}
        isOfflineMode={isOfflineMode}
        cloudSyncStatus={cloudSyncInfo.status}
        onToggleOfflineMode={() => {
          setIsOfflineMode(!isOfflineMode);
          showToast(
            !isOfflineMode
              ? 'Offline playback simulation activated! 📲'
              : 'Online connection restored 🌐'
          );
        }}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        onOpenDownloadManager={() => setIsDownloadDrawerOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
        onOpenPlaylists={() => {
          setSelectedTrackForPlaylist(null);
          setIsPlaylistModalOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAdminDashboard={() => setIsAdminModalOpen(true)}
        onHomeClick={() => {
          navigateTo('/');
          setSelectedCategorySlug('');
          setSearchQuery('');
        }}
      />

      {/* Offline Mode Banner Warning (if active) */}
      {isOfflineMode && (
        <div className="bg-amber-600 text-white text-xs py-1.5 px-4 text-center font-bold flex items-center justify-center gap-2">
          <span>⚠️ SIMULATED OFFLINE MODE: Showing {offlineTracks.length} tracks cached in IndexedDB. Internet disconnected.</span>
          <button
            onClick={() => setIsOfflineMode(false)}
            className="underline text-amber-100 hover:text-white"
          >
            Turn Back Online
          </button>
        </div>
      )}

      {/* MAIN VIEW SWITCHER */}
      <div className="flex-1">
        {/* VIEW 1: DEDICATED SONG DETAIL PAGE (/song/:slug) */}
        {currentRoute.view === 'song' && activeRouteSong ? (
          <SongDetailPage
            track={activeRouteSong}
            category={categories.find((c) => c.slug === activeRouteSong.categorySlug)}
            relatedTracks={tracks.filter(
              (t) => t.categorySlug === activeRouteSong.categorySlug && t.id !== activeRouteSong.id
            )}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            isCurrentPlayingThis={currentTrack?.id === activeRouteSong.id && isPlaying}
            isLiked={likedTrackIds.includes(activeRouteSong.id)}
            isOfflineCached={offlineTracks.some((i) => i.trackId === activeRouteSong.id)}
            onPlayTrack={handlePlayTrack}
            onPauseTrack={handlePauseTrack}
            onStartDownload={handleStartDownload}
            onToggleLike={handleToggleLike}
            onToggleOffline={handleToggleOffline}
            onOpenAddToPlaylist={(track) => {
              setSelectedTrackForPlaylist(track);
              setIsPlaylistModalOpen(true);
            }}
            onNavigateToTrack={(slug) => navigateTo(`/song/${slug}`)}
            onNavigateToCategory={(slug) => navigateTo(`/category/${slug}`)}
            onBackToHome={() => navigateTo('/')}
          />
        ) : currentRoute.view === 'song' ? (
          /* Fallback if song slug not found */
          <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Song Not Found</h2>
            <p className="text-xs text-slate-500">
              The requested track "{currentRoute.slug}" does not exist in the database or may have been renamed.
            </p>
            <button
              onClick={() => navigateTo('/')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs"
            >
              Return to Homepage Catalog
            </button>
          </div>
        ) : null}

        {/* VIEW 2: DEDICATED CATEGORY / FOLDER PAGE (/category/:slug) */}
        {currentRoute.view === 'category' && activeRouteCategory ? (
          <CategoryDetailPage
            category={activeRouteCategory}
            tracks={activeRouteCategoryTracks}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            offlineTrackIds={offlineTracks.map((i) => i.trackId)}
            onPlayTrack={handlePlayTrack}
            onPauseTrack={handlePauseTrack}
            onNavigateToTrack={(slug) => navigateTo(`/song/${slug}`)}
            onStartDownload={handleStartDownload}
            onToggleLike={handleToggleLike}
            onOpenAddToPlaylist={(track) => {
              setSelectedTrackForPlaylist(track);
              setIsPlaylistModalOpen(true);
            }}
            onBackToHome={() => navigateTo('/')}
          />
        ) : currentRoute.view === 'category' ? (
          <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Folder Not Found</h2>
            <p className="text-xs text-slate-500">
              The category "{currentRoute.slug}" could not be located.
            </p>
            <button
              onClick={() => navigateTo('/')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs"
            >
              Return to Homepage
            </button>
          </div>
        ) : null}

        {/* VIEW 3: HOMEPAGE PORTAL VIEW (/) */}
        {currentRoute.view === 'home' && (
          <main className="max-w-6xl mx-auto w-full px-3 sm:px-6 py-4 space-y-4">
            {/* Notice Board & Quick Access */}
            <NoticeBoard
              onCategorySelect={(slug) => navigateTo(`/category/${slug}`)}
              onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
            />

            {/* Directory Categorized Folders (Classic PHP Portal layout) */}
            {!searchQuery && !selectedCategorySlug && (
              <CategoryBrowser
                categories={categories}
                selectedCategorySlug={selectedCategorySlug}
                onSelectCategory={(slug) => {
                  if (slug) navigateTo(`/category/${slug}`);
                  else setSelectedCategorySlug('');
                }}
                totalTracks={tracks.length}
              />
            )}

            {/* Filter Breadcrumbs if Category or Search is selected on homepage */}
            {(selectedCategorySlug || searchQuery) && (
              <div className="bg-white border border-emerald-200 rounded-md px-3.5 py-2 flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {selectedCategorySlug
                      ? `Category: ${selectedCategoryObj?.name}`
                      : `Search Results: "${searchQuery}"`}
                  </span>
                  <span className="text-slate-400">({filteredTracks.length} songs found)</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategorySlug('');
                    setSearchQuery('');
                  }}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline"
                >
                  Back to All Categories
                </button>
              </div>
            )}

            {/* Songs Table */}
            <TrackTable
              tracks={filteredTracks}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              likedTrackIds={likedTrackIds}
              offlineTrackIds={offlineTracks.map((i) => i.trackId)}
              activeCategoryName={selectedCategoryObj?.name}
              searchQuery={searchQuery}
              onPlayTrack={handlePlayTrack}
              onPauseTrack={handlePauseTrack}
              onOpenTrackDetail={(track) => navigateTo(`/song/${track.slug}`)}
              onNavigateToTrack={(slug) => navigateTo(`/song/${slug}`)}
              onStartDownload={handleStartDownload}
              onToggleLike={handleToggleLike}
              onOpenAddToPlaylist={(track) => {
                setSelectedTrackForPlaylist(track);
                setIsPlaylistModalOpen(true);
              }}
              onToggleOfflineSave={handleToggleOffline}
              onResetFilters={() => {
                setSelectedCategorySlug('');
                setSearchQuery('');
              }}
            />
          </main>
        )}
      </div>

      {/* Floating Bottom Audio Player */}
      <AudioPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        onPlay={() => {
          if (currentTrack) handlePlayTrack(currentTrack);
        }}
        onPause={handlePauseTrack}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        onOpenTrackDetail={(track) => navigateTo(`/song/${track.slug}`)}
        onStartDownload={handleStartDownload}
        onOpenAddToPlaylist={(track) => {
          setSelectedTrackForPlaylist(track);
          setIsPlaylistModalOpen(true);
        }}
        onToggleLike={handleToggleLike}
        isLiked={currentTrack ? likedTrackIds.includes(currentTrack.id) : false}
      />

      {/* Mobile Bottom Thumb Navigation */}
      <MobileBottomNav
        onHomeClick={() => {
          navigateTo('/');
          setSelectedCategorySlug('');
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCategories={() => {
          navigateTo('/');
          setSelectedCategorySlug('');
          setSearchQuery('');
          window.scrollTo({ top: 180, behavior: 'smooth' });
        }}
        onFocusSearch={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOffline={() => setIsOfflineModalOpen(true)}
        onOpenDownloads={() => setIsDownloadDrawerOpen(true)}
        onOpenPlaylists={() => {
          setSelectedTrackForPlaylist(null);
          setIsPlaylistModalOpen(true);
        }}
        activeDownloadsCount={activeDownloadsCount}
      />

      {/* Modals */}
      {/* 1. Quick Track Detail Modal (if opened directly) */}
      {detailModalTrack && (
        <TrackDetailModal
          track={detailModalTrack}
          isPlaying={isPlaying}
          isCurrentPlayingThis={currentTrack?.id === detailModalTrack.id && isPlaying}
          isLiked={likedTrackIds.includes(detailModalTrack.id)}
          isOfflineCached={offlineTracks.some((i) => i.trackId === detailModalTrack.id)}
          relatedTracks={tracks.filter(
            (t) =>
              t.categorySlug === detailModalTrack.categorySlug &&
              t.id !== detailModalTrack.id
          )}
          onClose={() => setDetailModalTrack(null)}
          onPlayTrack={handlePlayTrack}
          onPauseTrack={handlePauseTrack}
          onStartDownload={handleStartDownload}
          onToggleLike={handleToggleLike}
          onToggleOffline={handleToggleOffline}
          onOpenAddToPlaylist={(track) => {
            setSelectedTrackForPlaylist(track);
            setIsPlaylistModalOpen(true);
          }}
          onSelectRelatedTrack={(rTrack) => {
            setDetailModalTrack(rTrack);
            navigateTo(`/song/${rTrack.slug}`);
          }}
        />
      )}

      {/* 2. Download Manager Drawer */}
      <DownloadManagerDrawer
        tasks={downloadTasks}
        isOpen={isDownloadDrawerOpen}
        onClose={() => setIsDownloadDrawerOpen(false)}
        onPauseTask={handlePauseDownloadTask}
        onResumeTask={handleResumeDownloadTask}
        onCancelTask={handleCancelDownloadTask}
        onClearCompleted={handleClearCompletedDownloads}
        onPlayDownloadedTrack={(trackId) => {
          const found = tracks.find((t) => t.id === trackId);
          if (found) handlePlayTrack(found);
        }}
      />

      {/* 3. Playlist Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => {
          setIsPlaylistModalOpen(false);
          setSelectedTrackForPlaylist(null);
        }}
        playlists={playlists}
        allTracks={tracks}
        onPlayPlaylist={handlePlayPlaylist}
        onCreatePlaylist={handleCreatePlaylist}
        onDeletePlaylist={handleDeletePlaylist}
        onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
        selectedTrackToAdd={selectedTrackForPlaylist}
        onAddTrackToPlaylist={handleAddTrackToPlaylist}
      />

      {/* 4. Admin Dashboard Modal */}
      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        tracks={tracks}
        categories={categories}
        user={user}
        onAdminLogin={handleAdminLogin}
        onAdminLogout={handleAdminLogout}
        onAddTrack={handleAddTrackAdmin}
        onUpdateTrack={handleUpdateTrackAdmin}
        onDeleteTrack={handleDeleteTrackAdmin}
        onCreateCategory={handleCreateCategoryAdmin}
        onUpdateCategory={handleUpdateCategoryAdmin}
        onDeleteCategory={handleDeleteCategoryAdmin}
        onBroadcastNotification={handleBroadcastNotification}
        onNavigateToSong={(slug) => navigateTo(`/song/${slug}`)}
        onNavigateToCategory={(slug) => navigateTo(`/category/${slug}`)}
      />

      {/* 5. Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotifsRead}
        onClearNotifications={handleClearNotifs}
        onSelectTrackNotification={handleSelectTrackNotification}
      />

      {/* 6. Offline Library Modal */}
      <OfflineLibraryModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        cachedTracks={offlineTracks}
        isOfflineMode={isOfflineMode}
        onToggleOfflineMode={() => setIsOfflineMode(!isOfflineMode)}
        onPlayTrack={handlePlayTrack}
        onRemoveCachedTrack={handleRemoveCachedTrack}
      />

      {/* 7. Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        lastSynced={cloudSyncInfo.lastSynced}
        devicesCount={cloudSyncInfo.devicesCount}
        playlistsCount={playlists.length}
        favoritesCount={likedTrackIds.length}
        downloadsCount={StorageService.getDownloadHistory().length}
        onTriggerSync={handleTriggerCloudSync}
      />

      {/* 8. User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onLogin={(newUser) => {
          setUser(newUser);
          StorageService.saveUser(newUser);
          showToast(`Logged in as ${newUser.name} (${newUser.role})`);
        }}
        onLogout={() => {
          handleAdminLogout();
        }}
      />

      {/* Portal Footer */}
      <Footer
        categories={categories}
        onSelectCategory={(slug) => {
          navigateTo(`/category/${slug}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
