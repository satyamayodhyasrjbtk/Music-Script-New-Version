import React, { useState } from 'react';
import {
  Play,
  Pause,
  Download,
  Heart,
  Share2,
  Folder,
  Disc,
  Clock,
  HardDrive,
  FileText,
  Flame,
  Plus,
  Music,
} from 'lucide-react';
import { Track } from '../types/music';

interface TrackTableProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  likedTrackIds: string[];
  offlineTrackIds: string[];
  activeCategoryName?: string;
  searchQuery?: string;
  onPlayTrack: (track: Track) => void;
  onPauseTrack: () => void;
  onOpenTrackDetail: (track: Track) => void;
  onNavigateToTrack?: (slug: string) => void;
  onStartDownload: (track: Track, quality: any) => void;
  onToggleLike: (trackId: string) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onToggleOfflineSave: (track: Track) => void;
  onResetFilters: () => void;
}

export const TrackTable: React.FC<TrackTableProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  likedTrackIds,
  offlineTrackIds,
  activeCategoryName,
  searchQuery,
  onPlayTrack,
  onPauseTrack,
  onOpenTrackDetail,
  onNavigateToTrack,
  onStartDownload,
  onToggleLike,
  onOpenAddToPlaylist,
  onToggleOfflineSave,
  onResetFilters,
}) => {
  const [sortBy, setSortBy] = useState<'default' | 'downloads' | 'newest' | 'size'>('default');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    if (sortBy === 'downloads') return b.downloadCount - a.downloadCount;
    if (sortBy === 'newest') return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
    if (sortBy === 'size') return b.sizeMb - a.sizeMb;
    return 0;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Title & Filter Bar */}
      <div className="bg-slate-900 text-white px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-xs sm:text-sm">
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : activeCategoryName
              ? activeCategoryName
              : 'Latest Uploaded Songs & DJ Remixes'}
          </h3>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
            {tracks.length} Files
          </span>
        </div>

        {/* Sorting options */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-400 mr-1 hidden sm:inline">Sort:</span>
          <button
            onClick={() => setSortBy('default')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              sortBy === 'default' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Featured
          </button>
          <button
            onClick={() => setSortBy('downloads')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              sortBy === 'downloads' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Most Hits
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              sortBy === 'newest' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Newest
          </button>
        </div>
      </div>

      {/* Empty State */}
      {tracks.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          <p className="text-sm font-medium">No songs found matching your search or category filter.</p>
          <button
            onClick={onResetFilters}
            className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
          >
            View All Songs
          </button>
        </div>
      )}

      {/* Songs Table / List */}
      <div className="divide-y divide-slate-100">
        {sortedTracks.map((track, idx) => {
          const isCurrent = currentTrackId === track.id;
          const isCurrentPlaying = isCurrent && isPlaying;
          const isLiked = likedTrackIds.includes(track.id);
          const isOffline = offlineTrackIds.includes(track.id);

          return (
            <div
              key={track.id}
              className={`p-3 sm:px-4 sm:py-3 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isCurrent ? 'bg-amber-50/70' : 'hover:bg-slate-50'
              }`}
            >
              {/* Left Column: Number, Play Icon, Song Title, Remixer, Meta */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Index / Play Button */}
                <button
                  onClick={() => {
                    if (isCurrentPlaying) {
                      onPauseTrack();
                    } else {
                      onPlayTrack(track);
                    }
                  }}
                  className={`w-9 h-9 rounded-md shrink-0 flex items-center justify-center transition-all group/btn ${
                    isCurrentPlaying
                      ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400/30'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-600 hover:text-white hover:border-amber-600 shadow-2xs'
                  }`}
                  title={isCurrentPlaying ? 'Pause Audio' : 'Play Song Online'}
                >
                  {isCurrentPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <div className="relative flex items-center justify-center">
                      <Music className="w-4 h-4 transition-transform group-hover/btn:scale-0" />
                      <Play className="w-4 h-4 ml-0.5 absolute inset-0 m-auto scale-0 group-hover/btn:scale-100 transition-transform" />
                    </div>
                  )}
                </button>

                {/* Track Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        if (onNavigateToTrack) onNavigateToTrack(track.slug);
                        else onOpenTrackDetail(track);
                      }}
                      className="text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1"
                    >
                      {idx + 1}. {track.title}
                    </button>
                    {track.isTrending && (
                      <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" />
                        Hit
                      </span>
                    )}
                    {isOffline && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.2 rounded shrink-0">
                        Offline Ready
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 mt-1">
                    <span className="text-emerald-800 font-semibold bg-emerald-100/70 px-1 rounded">
                      DJ: {track.remixer}
                    </span>
                    <span>·</span>
                    <span className="truncate">Singer: {track.originalArtist}</span>
                    <span>·</span>
                    <span>{track.bitrate}</span>
                    <span>·</span>
                    <span>{track.sizeMb} MB</span>
                    <span>·</span>
                    <span>{formatDuration(track.duration)}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline text-slate-400">
                      {track.downloadCount.toLocaleString()} Hits
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions (Fast Download, Detail Page, Playlist, Like) */}
              <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center shrink-0">
                {/* Fast Download Button */}
                <button
                  onClick={() => onStartDownload(track, '320kbps')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                  title="Download MP3 320 Kbps"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                {/* View File Page Button */}
                <button
                  onClick={() => {
                    if (onNavigateToTrack) onNavigateToTrack(track.slug);
                    else onOpenTrackDetail(track);
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                  title="View File Details & Dedicated Page"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden md:inline">View Page</span>
                </button>

                {/* Add to Playlist Button */}
                <button
                  onClick={() => onOpenAddToPlaylist(track)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                  title="Add to Playlist"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Like Button */}
                <button
                  onClick={() => onToggleLike(track.id)}
                  className={`p-1.5 rounded transition-colors ${
                    isLiked
                      ? 'text-red-600 hover:text-red-700 bg-red-50'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
