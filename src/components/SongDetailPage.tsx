import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Share2,
  Heart,
  ChevronRight,
  Disc,
  Folder,
  Music,
  Check,
  QrCode,
  Smartphone,
  Calendar,
  User,
  Volume2,
  Clock,
  HardDrive,
  FileText,
  Flame,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Track, AudioQuality, Category } from '../types/music';
import { ApiService } from '../services/api';

interface SongDetailPageProps {
  track: Track;
  category?: Category;
  relatedTracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  isCurrentPlayingThis: boolean;
  isLiked: boolean;
  isOfflineCached: boolean;
  onPlayTrack: (track: Track) => void;
  onPauseTrack: () => void;
  onStartDownload: (track: Track, quality: AudioQuality) => void;
  onToggleLike: (trackId: string) => void;
  onToggleOffline: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onNavigateToTrack: (slug: string) => void;
  onNavigateToCategory: (slug: string) => void;
  onBackToHome: () => void;
}

export const SongDetailPage: React.FC<SongDetailPageProps> = ({
  track,
  category,
  relatedTracks,
  currentTrackId,
  isPlaying,
  isCurrentPlayingThis,
  isLiked,
  isOfflineCached,
  onPlayTrack,
  onPauseTrack,
  onStartDownload,
  onToggleLike,
  onToggleOffline,
  onOpenAddToPlaylist,
  onNavigateToTrack,
  onNavigateToCategory,
  onBackToHome,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Artist tracks state for 'More by this Artist' section
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [isLoadingArtistTracks, setIsLoadingArtistTracks] = useState<boolean>(true);
  const [artistFetchError, setArtistFetchError] = useState<string | null>(null);

  // Determine artist name for display and search
  const displayArtistName =
    track.originalArtist && track.originalArtist.trim() !== '' && track.originalArtist !== 'Various Artists'
      ? track.originalArtist
      : track.remixer || 'Artist';

  // Fetch 5 additional tracks by this artist
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingArtistTracks(true);
    setArtistFetchError(null);

    const loadArtistTracks = async () => {
      try {
        const results = await ApiService.getTracksByArtist(displayArtistName, track.id);
        if (!isCancelled) {
          setArtistTracks(results.slice(0, 5));
          setIsLoadingArtistTracks(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to load artist tracks:', err);
          setArtistFetchError('Could not load artist tracks');
          setIsLoadingArtistTracks(false);
        }
      }
    };

    loadArtistTracks();

    return () => {
      isCancelled = true;
    };
  }, [track.id, displayArtistName]);

  // Sync document title and meta description dynamically
  useEffect(() => {
    const originalTitle = document.title;
    const pageTitle = track.metaTitle?.trim() || `${track.title} - DjMinu.in | 320 Kbps MP3 Download`;
    const pageDesc =
      track.metaDescription?.trim() ||
      `Download ${track.title} remixed by ${track.remixer}. Original by ${track.originalArtist}. 320 Kbps HQ MP3 download at DjMinu.in`;
    const ogTitle = track.ogTitle?.trim() || pageTitle;
    const ogDesc = track.ogDescription?.trim() || pageDesc;
    const ogImg = track.ogImage?.trim() || track.thumbnailUrl || '';

    document.title = pageTitle;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update meta tags in DOM
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
  }, [track]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getFullShareUrl = () => {
    return `${window.location.origin}/song/${track.slug}`;
  };

  const handleCopyLink = () => {
    const url = getFullShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = getFullShareUrl();
    const text = `🎵 Listen & Download "${track.title}" (Remixed by ${track.remixer}) in 320 Kbps HQ at DjMinu.in / OyeDj:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const url = getFullShareUrl();
    const text = `Download "${track.title}" (320 Kbps HQ DJ Remix) by ${track.remixer}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 space-y-4">
      {/* Back button & Breadcrumbs bar */}
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
          <button
            onClick={() => onNavigateToCategory(track.categorySlug)}
            className="hover:text-emerald-700 font-semibold truncate max-w-[150px] sm:max-w-xs"
          >
            {track.category}
          </button>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-emerald-800 font-bold truncate max-w-[160px] sm:max-w-xs">
            {track.title}
          </span>
        </div>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold transition-colors border border-emerald-200"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Link Copied!' : 'Copy Song Link'}</span>
        </button>
      </div>

      {/* Main Song Box (Classic DjMinu Design: Emerald Heading Banner, Thumbnail, Play, Red Download Button) */}
      <div className="bg-white border-2 border-emerald-600 rounded-xl shadow-md overflow-hidden">
        {/* Emerald Header Title Banner */}
        <div className="bg-gradient-to-r from-emerald-700 to-green-700 text-white px-4 py-3 border-b border-emerald-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <Music className="w-5 h-5 text-yellow-300 shrink-0" />
            <h1 className="font-extrabold text-sm sm:text-base truncate tracking-tight">
              {track.title}
            </h1>
          </div>
          <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase shrink-0 shadow-2xs">
            {track.releaseYear} HQ
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Top Section: Icon / Cover Image + Title & Remixer Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            {/* Song Thumbnail or Icon */}
            <div className="relative group shrink-0">
              {track.thumbnailUrl ? (
                <img
                  src={track.thumbnailUrl}
                  alt={track.title}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-2 border-emerald-500 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-800 text-white flex items-center justify-center border-2 border-emerald-400/50 shadow-md">
                  <Disc className={`w-14 h-14 text-yellow-300 ${isCurrentPlayingThis ? 'animate-spin' : ''}`} />
                </div>
              )}

              {/* Inline play/pause overlay trigger */}
              <button
                onClick={() => {
                  if (isCurrentPlayingThis) onPauseTrack();
                  else onPlayTrack(track);
                }}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
                title={isCurrentPlayingThis ? 'Pause' : 'Play Online'}
              >
                {isCurrentPlayingThis ? (
                  <Pause className="w-9 h-9 text-white drop-shadow" />
                ) : (
                  <Play className="w-9 h-9 text-white ml-1 drop-shadow" />
                )}
              </button>
            </div>

            {/* Title & Metadata Badges */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
                <span className="bg-emerald-700 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                  DJ Track
                </span>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {track.bitrate} Studio
                </span>
                {track.isTrending && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Flame className="w-3 h-3" />
                    Trending
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                {track.title}
              </h2>

              <p className="text-xs sm:text-sm text-emerald-800 font-bold mt-1">
                Remixed By: <span className="underline decoration-emerald-500">{track.remixer}</span>
              </p>

              <p className="text-xs text-slate-600 mt-0.5">
                Original Singer: <span className="font-semibold text-slate-800">{track.originalArtist}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-500 mt-2">
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                  📁 {track.category}
                </span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                  ⏱ {formatDuration(track.duration)}
                </span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-emerald-700">
                  ⬇ {track.downloadCount.toLocaleString()} Hits
                </span>
              </div>
            </div>
          </div>

          {/* Quick Play Audio Controller Bar */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isCurrentPlayingThis) onPauseTrack();
                  else onPlayTrack(track);
                }}
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-transform hover:scale-105 font-bold shadow-md"
              >
                {isCurrentPlayingThis ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{isCurrentPlayingThis ? 'Now Streaming Audio Online' : 'Listen Song Online (High Quality)'}</span>
                  {isCurrentPlayingThis && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </p>
                <p className="text-[11px] text-emerald-300">
                  {formatDuration(track.duration)} · 44.1 kHz Stereo · {track.bitrate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleOffline(track)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  isOfflineCached
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-600/40'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isOfflineCached ? 'Saved Offline' : 'Save Offline'}</span>
              </button>

              <button
                onClick={() => onToggleLike(track.id)}
                className={`p-2 rounded-lg border transition-colors ${
                  isLiked
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
                title="Favorite"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* SIGNATURE RED "DOWNLOAD FILE HERE" BUTTON (Exactly matching the DjMinu screenshot requested!) */}
          <div className="bg-red-50/80 border-2 border-red-500 rounded-xl p-4 sm:p-5 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-700 font-bold uppercase tracking-wider">
              <span>⚡ Fast Direct Server Download Link</span>
            </div>

            {/* Primary Massive Red Download Button */}
            <button
              onClick={() => onStartDownload(track, '320kbps')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-red-600 via-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download className="w-5 h-5 animate-bounce" />
              <span>[ Download File Here (320 Kbps HQ) ]</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                {track.sizeMb} MB
              </span>
            </button>

            <p className="text-[11px] text-slate-600 font-medium">
              Click the red button to download the original master audio file without any ads or survey.
            </p>

            {/* Other Quality Bitrate Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-red-200">
              <button
                onClick={() => onStartDownload(track, '192kbps')}
                className="p-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-between px-3 transition-colors"
              >
                <span>Download 192 Kbps</span>
                <span className="text-[10px] text-slate-300">
                  {(track.sizeMb * 0.6).toFixed(1)} MB
                </span>
              </button>

              <button
                onClick={() => onStartDownload(track, '128kbps')}
                className="p-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-between px-3 transition-colors"
              >
                <span>Download 128 Kbps</span>
                <span className="text-[10px] text-slate-300">
                  {(track.sizeMb * 0.4).toFixed(1)} MB
                </span>
              </button>

              <button
                onClick={() => onStartDownload(track, 'ringtone')}
                className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-between px-3 transition-colors"
              >
                <span>Call Ringtone (30s)</span>
                <span className="text-[10px] text-amber-200">1.2 MB</span>
              </button>
            </div>
          </div>

          {/* Technical Specifications Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-emerald-700 text-white px-3.5 py-2 font-bold text-xs sm:text-sm flex items-center justify-between">
              <span>Song Technical Specifications & Info</span>
              <span className="text-[11px] text-emerald-200 font-normal">Slug: /song/{track.slug}</span>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium w-1/3">Song Title:</td>
                  <td className="px-3 py-2 text-slate-900 font-bold">{track.title}</td>
                </tr>
                <tr className="bg-emerald-50/40">
                  <td className="px-3 py-2 text-slate-500 font-medium">DJ / Remixer:</td>
                  <td className="px-3 py-2 text-emerald-800 font-bold">{track.remixer}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium">Original Singer:</td>
                  <td className="px-3 py-2 text-slate-900">{track.originalArtist}</td>
                </tr>
                <tr className="bg-emerald-50/40">
                  <td className="px-3 py-2 text-slate-500 font-medium">Category / Folder:</td>
                  <td className="px-3 py-2 text-slate-900 font-semibold">{track.category}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium">File Size:</td>
                  <td className="px-3 py-2 text-slate-900 font-bold text-emerald-700">{track.sizeMb} MB</td>
                </tr>
                <tr className="bg-emerald-50/40">
                  <td className="px-3 py-2 text-slate-500 font-medium">Audio Bitrate:</td>
                  <td className="px-3 py-2 text-slate-900">{track.bitrate} Constant Bit Rate (CBR)</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium">Duration:</td>
                  <td className="px-3 py-2 text-slate-900">{formatDuration(track.duration)}</td>
                </tr>
                <tr className="bg-emerald-50/40">
                  <td className="px-3 py-2 text-slate-500 font-medium">Total Downloads:</td>
                  <td className="px-3 py-2 text-slate-900 font-bold">{track.downloadCount.toLocaleString()} Hits</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium">Release Year & Date:</td>
                  <td className="px-3 py-2 text-slate-900">{track.releaseYear} ({track.addedDate})</td>
                </tr>
                <tr className="bg-emerald-50/40">
                  <td className="px-3 py-2 text-slate-500 font-medium">Tempo & Rhythm:</td>
                  <td className="px-3 py-2 text-slate-900">{track.bpm} BPM (Heavy Dance Drop)</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium">Direct Song URL:</td>
                  <td className="px-3 py-2 text-emerald-700 font-mono text-[11px] break-all select-all">
                    {getFullShareUrl()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Social Sharing & QR Code Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800">Share This Song:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleShareTelegram}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <span>Telegram</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : null}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={() => setShowQr(!showQr)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  <QrCode className="w-3.5 h-3.5 inline mr-1" />
                  <span>{showQr ? 'Hide QR' : 'Mobile QR'}</span>
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            {showQr && (
              <div className="p-4 bg-white border border-slate-200 rounded-lg text-center space-y-2 animate-fade-in">
                <div className="w-36 h-36 mx-auto bg-slate-900 p-2 rounded-lg flex items-center justify-center">
                  <div className="w-full h-full bg-white p-2 rounded flex flex-col items-center justify-center">
                    <div className="grid grid-cols-6 gap-1 w-full h-full">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`${
                            (i % 2 === 0 || i % 7 === 0 || i < 6 || i > 30) ? 'bg-slate-950' : 'bg-transparent'
                          } rounded-2xs`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Scan to open <span className="font-mono text-emerald-700">{track.slug}</span> on your phone!
                </p>
              </div>
            )}
          </div>

          {/* MORE BY THIS ARTIST SECTION */}
          <div className="space-y-2 pt-2">
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-4 h-4 text-yellow-300 shrink-0" />
                <span className="truncate">
                  More by this Artist: <span className="text-yellow-300 font-extrabold">{displayArtistName}</span>
                </span>
              </div>
              <span className="bg-black/30 border border-emerald-400/30 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">
                {isLoadingArtistTracks ? 'Loading...' : `${artistTracks.length} Tracks`}
              </span>
            </div>

            {/* Content: Loading Skeleton or Track List */}
            {isLoadingArtistTracks ? (
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5 shadow-2xs">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="flex items-center gap-3 animate-pulse">
                    <div className="w-7 h-7 rounded-md bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                    </div>
                    <div className="w-16 h-6 bg-slate-200 rounded shrink-0" />
                  </div>
                ))}
              </div>
            ) : artistTracks.length > 0 ? (
              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                {artistTracks.map((aTrack, idx) => {
                  const isTrackPlaying =
                    (currentTrackId === aTrack.id || (isCurrentPlayingThis && aTrack.id === track.id)) && isPlaying;
                  return (
                    <div
                      key={aTrack.id}
                      className="p-2.5 sm:px-3 hover:bg-emerald-50/50 flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-4 text-center text-[10px] font-bold text-slate-400 shrink-0">
                          {idx + 1}
                        </span>

                        <button
                          onClick={() => {
                            if (isTrackPlaying) onPauseTrack();
                            else onPlayTrack(aTrack);
                          }}
                          className={`w-7 h-7 rounded flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                            isTrackPlaying
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-700 hover:text-white'
                          }`}
                          title={isTrackPlaying ? 'Pause Audio' : 'Play Song Online'}
                        >
                          {isTrackPlaying ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>

                        <button
                          onClick={() => onNavigateToTrack(aTrack.slug)}
                          className="font-bold text-slate-900 hover:text-emerald-700 truncate text-left min-w-0"
                        >
                          <span className="block truncate text-slate-900 font-bold hover:underline">
                            {aTrack.title}
                          </span>
                          <span className="block text-[10px] text-slate-500 font-normal truncate mt-0.5">
                            <span className="text-emerald-800 font-semibold">{aTrack.originalArtist}</span>
                            <span className="text-slate-300 mx-1">·</span>
                            <span>{aTrack.remixer}</span>
                            <span className="text-slate-300 mx-1">·</span>
                            <span className="text-amber-700 font-semibold">{aTrack.bitrate}</span>
                            <span className="text-slate-300 mx-1">·</span>
                            <span>{aTrack.sizeMb} MB</span>
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onNavigateToTrack(aTrack.slug)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-semibold text-[11px] transition-colors"
                        >
                          View Page
                        </button>
                        <button
                          onClick={() => onStartDownload(aTrack, '320kbps')}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] transition-colors shadow-2xs flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-center text-xs text-slate-500">
                No additional songs found for {displayArtistName}.
              </div>
            )}
          </div>

          {/* Related DJ Songs in this Category/Folder */}
          {relatedTracks.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="bg-emerald-800 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between">
                <span>More DJ Songs From "{track.category}"</span>
                <button
                  onClick={() => onNavigateToCategory(track.categorySlug)}
                  className="text-[11px] text-yellow-300 hover:underline"
                >
                  View All »
                </button>
              </div>

              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg overflow-hidden">
                {relatedTracks.slice(0, 5).map((rTrack) => {
                  const isRPlaying =
                    (currentTrackId === rTrack.id || (isCurrentPlayingThis && rTrack.id === track.id)) && isPlaying;
                  return (
                    <div
                      key={rTrack.id}
                      className="p-2.5 sm:px-3 hover:bg-emerald-50/50 flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => {
                            if (isRPlaying) onPauseTrack();
                            else onPlayTrack(rTrack);
                          }}
                          className={`w-7 h-7 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isRPlaying
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-700 hover:text-white'
                          }`}
                        >
                          {isRPlaying ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onNavigateToTrack(rTrack.slug)}
                          className="font-bold text-slate-900 hover:text-emerald-700 truncate text-left"
                        >
                          {rTrack.title}
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {rTrack.remixer} · {rTrack.bitrate} · {rTrack.sizeMb} MB
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onNavigateToTrack(rTrack.slug)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px] transition-colors"
                        >
                          View Page
                        </button>
                        <button
                          onClick={() => onStartDownload(rTrack, '320kbps')}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] transition-colors"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
