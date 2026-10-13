import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  ArrowLeft,
  ChevronRight,
  Disc,
  Play,
  Pause,
  Download,
  Share2,
  Check,
  Music,
  Plus,
  Flame,
  FileText,
  Heart,
} from 'lucide-react';
import { Category, Track, AudioQuality } from '../types/music';

interface CategoryDetailPageProps {
  category: Category;
  tracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  likedTrackIds: string[];
  offlineTrackIds: string[];
  onPlayTrack: (track: Track) => void;
  onPauseTrack: () => void;
  onNavigateToTrack: (slug: string) => void;
  onStartDownload: (track: Track, quality: AudioQuality) => void;
  onToggleLike: (trackId: string) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onBackToHome: () => void;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({
  category,
  tracks,
  currentTrackId,
  isPlaying,
  likedTrackIds,
  offlineTrackIds,
  onPlayTrack,
  onPauseTrack,
  onNavigateToTrack,
  onStartDownload,
  onToggleLike,
  onOpenAddToPlaylist,
  onBackToHome,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'hits' | 'newest'>('default');

  useEffect(() => {
    const originalTitle = document.title;
    const pageTitle = category.metaTitle?.trim() || `${category.name} MP3 Songs & DJ Remix | DjMinu.in`;
    const pageDesc =
      category.metaDescription?.trim() ||
      `Download all DJ remix songs and MP3 tracks from ${category.name}. High Quality 320 Kbps audio at DjMinu.in`;
    const ogTitle = category.ogTitle?.trim() || pageTitle;
    const ogDesc = category.ogDescription?.trim() || pageDesc;
    const ogImg = category.ogImage?.trim() || '';

    document.title = pageTitle;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const metaDescTag = document.querySelector('meta[name="description"]');
    if (metaDescTag) metaDescTag.setAttribute('content', pageDesc);

    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) ogTitleTag.setAttribute('content', ogTitle);

    const ogDescTag = document.querySelector('meta[property="og:description"]');
    if (ogDescTag) ogDescTag.setAttribute('content', ogDesc);

    let ogImgTag = document.querySelector('meta[property="og:image"]');
    if (ogImg) {
      if (!ogImgTag) {
        ogImgTag = document.createElement('meta');
        ogImgTag.setAttribute('property', 'og:image');
        document.head.appendChild(ogImgTag);
      }
      ogImgTag.setAttribute('content', ogImg);
    }

    return () => {
      document.title = originalTitle;
    };
  }, [category]);

  const handleCopyFolderUrl = () => {
    const url = `${window.location.origin}/category/${category.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    if (sortBy === 'hits') return b.downloadCount - a.downloadCount;
    if (sortBy === 'newest') return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
    return 0;
  });

  return (
    <div className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 space-y-4">
      {/* Breadcrumb Bar */}
      <div className="bg-white border border-emerald-200 rounded-lg p-2.5 shadow-2xs flex items-center justify-between gap-2 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-600 flex-wrap">
          <button
            onClick={onBackToHome}
            className="hover:text-emerald-700 font-semibold flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-emerald-800 font-bold">
            {category.name}
          </span>
        </div>

        <button
          onClick={handleCopyFolderUrl}
          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold transition-colors border border-emerald-200"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Folder Link Copied!' : 'Copy Folder Link'}</span>
        </button>
      </div>

      {/* Category / Folder Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 text-white rounded-xl p-4 sm:p-6 shadow-md border border-emerald-900 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center shrink-0 shadow-inner">
          <FolderOpen className="w-10 h-10 text-yellow-300" />
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
              {category.folderType === 'folder' ? 'Special Folder' : 'Music Category'}
            </span>
            <span className="bg-emerald-950/60 text-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
              /category/{category.slug}
            </span>
          </div>

          <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
            {category.name}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100 mt-1 leading-relaxed">
            {category.description}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-emerald-200 font-medium mt-3">
            <span>📁 {tracks.length} Songs in Directory</span>
            <span>•</span>
            <span>⚡ High Speed 320 Kbps Audio</span>
            <span>•</span>
            <span>Free Direct Download</span>
          </div>
        </div>
      </div>

      {/* Songs Table Header & Sorting */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-yellow-400" />
            <h3 className="font-bold text-xs sm:text-sm">
              Songs List ({tracks.length} Files)
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 mr-1 hidden sm:inline">Sort:</span>
            <button
              onClick={() => setSortBy('default')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                sortBy === 'default' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setSortBy('hits')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                sortBy === 'hits' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Most Downloaded
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                sortBy === 'newest' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Newest
            </button>
          </div>
        </div>

        {/* Empty State */}
        {tracks.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm font-semibold">No songs available in this category yet.</p>
            <p className="text-xs text-slate-400 mt-1">Upload songs from the Admin Panel to populate this folder.</p>
          </div>
        )}

        {/* Track Rows */}
        <div className="divide-y divide-slate-100">
          {sortedTracks.map((track, idx) => {
            const isCurrent = currentTrackId === track.id;
            const isCurrentPlaying = isCurrent && isPlaying;
            const isLiked = likedTrackIds.includes(track.id);

            return (
              <div
                key={track.id}
                className={`p-3 sm:px-4 sm:py-3 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrent ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                }`}
              >
                {/* Left: Play button, Song Title, Meta */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => {
                      if (isCurrentPlaying) onPauseTrack();
                      else onPlayTrack(track);
                    }}
                    className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center transition-all ${
                      isCurrentPlaying
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-600 hover:text-white'
                    }`}
                    title={isCurrentPlaying ? 'Pause Audio' : 'Play Song Online'}
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <button
                        onClick={() => onNavigateToTrack(track.slug)}
                        className="text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1"
                      >
                        {idx + 1}. {track.title}
                      </button>
                      {track.isTrending && (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                          Hit
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 mt-1">
                      <span className="text-emerald-800 font-semibold bg-emerald-100/70 px-1 rounded">
                        DJ: {track.remixer}
                      </span>
                      <span>·</span>
                      <span className="truncate">{track.originalArtist}</span>
                      <span>·</span>
                      <span>{track.bitrate}</span>
                      <span>·</span>
                      <span>{track.sizeMb} MB</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline text-slate-400">
                        {track.downloadCount.toLocaleString()} Hits
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onStartDownload(track, '320kbps')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                    title="Download MP3"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => onNavigateToTrack(track.slug)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Page</span>
                  </button>

                  <button
                    onClick={() => onOpenAddToPlaylist(track)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    title="Add to Playlist"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onToggleLike(track.id)}
                    className={`p-1.5 rounded transition-colors ${
                      isLiked ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
