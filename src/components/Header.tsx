import React, { useState } from 'react';
import {
  Music2,
  Search,
  Bell,
  Download,
  Cloud,
  Wifi,
  WifiOff,
  User,
  Shield,
  Layers,
  FolderOpen,
  Home,
} from 'lucide-react';
import { UserProfile, Category } from '../types/music';

interface HeaderProps {
  user: UserProfile;
  categories: Category[];
  searchQuery: string;
  selectedCategorySlug: string;
  onSearchChange: (q: string) => void;
  onCategoryFilterChange: (slug: string) => void;
  unreadNotifsCount: number;
  activeDownloadsCount: number;
  isOfflineMode: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'error';
  onToggleOfflineMode: () => void;
  onOpenNotifications: () => void;
  onOpenDownloadManager: () => void;
  onOpenCloudSync: () => void;
  onOpenPlaylists: () => void;
  onOpenAuthModal: () => void;
  onOpenAdminDashboard: () => void;
  onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  categories,
  searchQuery,
  selectedCategorySlug,
  onSearchChange,
  onCategoryFilterChange,
  unreadNotifsCount,
  activeDownloadsCount,
  isOfflineMode,
  cloudSyncStatus,
  onToggleOfflineMode,
  onOpenNotifications,
  onOpenDownloadManager,
  onOpenCloudSync,
  onOpenPlaylists,
  onOpenAuthModal,
  onOpenAdminDashboard,
  onHomeClick,
}) => {
  const [searchInput, setSearchInput] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  return (
    <header className="sticky top-0 z-40 shadow-md">
      {/* Top Banner & Marquee Notification Ticker */}
      <div className="bg-emerald-950 text-emerald-100 px-3 py-1.5 text-xs flex items-center justify-between gap-4 border-b border-emerald-900">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.5 rounded text-[10px] uppercase shrink-0">
            Updates
          </span>
          <div className="truncate text-[11px] sm:text-xs text-emerald-200 font-medium">
            🔥 DjMinu.in & OyeDj Official 320 Kbps HQ MP3 Portal • All DJ Remixes, Dholki Mix & Hard Bass Available • Fast Cloud CDN Active
          </div>
        </div>

        {/* Status Pills */}
        <div className="hidden sm:flex items-center gap-3 shrink-0 text-[11px]">
          {/* Offline Mode Toggle */}
          <button
            onClick={onToggleOfflineMode}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors font-medium ${
              isOfflineMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-emerald-200 hover:text-white'
            }`}
            title="Toggle offline playback testing"
          >
            {isOfflineMode ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isOfflineMode ? 'Offline Mode ON' : 'Online'}</span>
          </button>

          {/* Cloud Sync Status */}
          <button
            onClick={onOpenCloudSync}
            className="flex items-center gap-1 text-emerald-200 hover:text-white transition-colors"
            title="Cloud Synchronization across devices"
          >
            <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'text-amber-400 animate-spin' : 'text-sky-400'}`} />
            <span>Cloud Sync</span>
          </button>
        </div>
      </div>

      {/* Signature DjMinu Green Header Branding Bar */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-700 text-white border-b border-emerald-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-4">
          {/* Brand / Logo */}
          <div
            onClick={onHomeClick}
            className="cursor-pointer flex items-center gap-2.5 select-none shrink-0 group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
              <Music2 className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-white drop-shadow-xs">
                  Dj<span className="text-yellow-300">Minu</span>.in
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-yellow-400 text-slate-950 rounded shadow-xs uppercase">
                  MP3 Portal
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-100 font-medium">
                OyeDjSurendra • High Quality DJ Songs & MP3 Downloads
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Home Link */}
            <button
              onClick={onHomeClick}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-100 hover:text-white bg-emerald-800/60 hover:bg-emerald-800 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            {/* Playlists Button */}
            <button
              onClick={onOpenPlaylists}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-100 hover:text-white bg-emerald-800/60 hover:bg-emerald-800 transition-colors"
            >
              <Layers className="w-4 h-4 text-emerald-200" />
              <span>Playlists</span>
            </button>

            {/* Fast Download Manager Button */}
            <button
              onClick={onOpenDownloadManager}
              className="relative p-2 rounded-lg bg-emerald-800/70 hover:bg-emerald-800 text-white transition-colors"
              title="Fast Download Manager"
            >
              <Download className="w-4 h-4" />
              {activeDownloadsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {activeDownloadsCount}
                </span>
              )}
            </button>

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg bg-emerald-800/70 hover:bg-emerald-800 text-white transition-colors"
              title="New Releases & Announcements"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Admin Dashboard */}
            <button
              onClick={onOpenAdminDashboard}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                user.role === 'admin'
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 hover:text-white border border-emerald-600'
              }`}
              title={user.role === 'admin' ? 'Open Admin Portal' : 'Admin Login'}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{user.role === 'admin' ? 'Admin Panel' : 'Admin'}</span>
            </button>

            {/* User Profile / Auth Toggle */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-800/50 hover:bg-emerald-800 transition-colors text-xs font-medium text-white border border-emerald-600/40"
            >
              <div className={`w-6 h-6 rounded-full ${user.avatarBg} text-white flex items-center justify-center text-[10px] font-bold shadow-xs`}>
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="block font-semibold text-white truncate max-w-[85px]">{user.name}</span>
                <span className="text-[10px] text-yellow-300 font-bold uppercase">{user.role}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Classic PHP Search Box Bar */}
      <div className="bg-emerald-50 border-b border-emerald-200 px-3 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            {/* Category Select Filter */}
            <div className="w-full sm:w-60 shrink-0">
              <select
                value={selectedCategorySlug}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                className="w-full bg-white border border-emerald-300 rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              >
                <option value="">📁 All Categories & Folders</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name} ({c.trackCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Input & Button */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search song title, singer, DJ remixer (e.g. Kali Mai, Kamariya, Pawan Singh)..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (e.target.value === '') {
                      onSearchChange('');
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-emerald-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold transition-colors shrink-0 shadow-2xs flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};
