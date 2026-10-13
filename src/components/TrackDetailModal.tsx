import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  Download,
  Share2,
  Heart,
  QrCode,
  Smartphone,
  Check,
  Disc,
  Folder,
  ChevronRight,
  Flame,
  Volume2,
  Radio,
  Plus,
} from 'lucide-react';
import { Track, AudioQuality } from '../types/music';

interface TrackDetailModalProps {
  track: Track;
  isPlaying: boolean;
  isCurrentPlayingThis: boolean;
  isLiked: boolean;
  isOfflineCached: boolean;
  relatedTracks: Track[];
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onPauseTrack: () => void;
  onStartDownload: (track: Track, quality: AudioQuality) => void;
  onToggleLike: (trackId: string) => void;
  onToggleOffline: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onSelectRelatedTrack: (track: Track) => void;
}

export const TrackDetailModal: React.FC<TrackDetailModalProps> = ({
  track,
  isPlaying,
  isCurrentPlayingThis,
  isLiked,
  isOfflineCached,
  relatedTracks,
  onClose,
  onPlayTrack,
  onPauseTrack,
  onStartDownload,
  onToggleLike,
  onToggleOffline,
  onOpenAddToPlaylist,
  onSelectRelatedTrack,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getSongUrl = () => `${window.location.origin}/song/${track.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getSongUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `Listen & Download "${track.title}" (Remix by ${track.remixer}) in 320 Kbps HQ at DjMinu / OyeDj: ${getSongUrl()}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = `Listen & Download "${track.title}" in 320 Kbps HQ:`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(getSongUrl())}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-300 my-auto">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 truncate">
            <Disc className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-xs sm:text-sm truncate">
              File Details & Download Page
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="bg-slate-100 px-4 py-2 text-[11px] sm:text-xs text-slate-600 flex items-center gap-1.5 flex-wrap border-b border-slate-200">
          <span className="font-medium text-slate-800">Home</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-800">{track.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-amber-700 font-semibold truncate max-w-[200px]">{track.title}</span>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Main Track Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-20 h-20 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 relative group shadow-inner">
              <Disc className={`w-12 h-12 ${isCurrentPlayingThis ? 'animate-spin' : ''}`} />
              <button
                onClick={() => {
                  if (isCurrentPlayingThis) {
                    onPauseTrack();
                  } else {
                    onPlayTrack(track);
                  }
                }}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-xl flex items-center justify-center transition-colors"
                title={isCurrentPlayingThis ? 'Pause' : 'Play Online'}
              >
                {isCurrentPlayingThis ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                  MP3 Master
                </span>
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {track.releaseYear} Edition
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
                {track.title}
              </h2>
              <p className="text-xs text-amber-300 font-medium mt-0.5">
                Remixed By: {track.remixer}
              </p>
              <p className="text-[11px] text-slate-300 mt-1">
                Original Singer: {track.originalArtist} · {track.bpm} BPM
              </p>
            </div>
          </div>

          {/* Audio Quick Streamer Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isCurrentPlayingThis) onPauseTrack();
                  else onPlayTrack(track);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isCurrentPlayingThis ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isCurrentPlayingThis ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div>
                <span className="text-xs font-bold text-slate-800">
                  {isCurrentPlayingThis ? 'Streaming Track Now...' : 'Click to Preview Audio'}
                </span>
                <p className="text-[10px] text-slate-500">
                  {formatDuration(track.duration)} · High Quality Sound
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleOffline(track)}
                className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isOfflineCached
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isOfflineCached ? 'Cached Offline' : 'Save for Offline'}</span>
              </button>

              <button
                onClick={() => onToggleLike(track.id)}
                className={`p-2 rounded border border-slate-300 bg-white transition-colors ${
                  isLiked ? 'text-red-600 border-red-200 bg-red-50' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Favorite"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Multiple Bitrate Fast Download Box */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Select Download Quality:</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                ⚡ 100% Virus Free & Super Fast CDN
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* 320 Kbps HQ */}
              <button
                onClick={() => onStartDownload(track, '320kbps')}
                className="flex items-center justify-between p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-xs group"
              >
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span>⚡ Download (320 Kbps HQ)</span>
                    <span className="bg-emerald-800 text-[10px] px-1 py-0.2 rounded font-normal">
                      Best Quality
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-100 font-normal">
                    Original Master Audio
                  </span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded group-hover:scale-105 transition-transform">
                  {track.sizeMb} MB
                </span>
              </button>

              {/* 192 Kbps Standard */}
              <button
                onClick={() => onStartDownload(track, '192kbps')}
                className="flex items-center justify-between p-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-bold transition-all shadow-xs group"
              >
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span>⚡ Download (192 Kbps)</span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-normal">
                    Medium Storage Saver
                  </span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded group-hover:scale-105 transition-transform">
                  {(track.sizeMb * 0.6).toFixed(1)} MB
                </span>
              </button>

              {/* 128 Kbps Fast */}
              <button
                onClick={() => onStartDownload(track, '128kbps')}
                className="flex items-center justify-between p-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition-all shadow-xs group"
              >
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span>⚡ Download (128 Kbps)</span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-normal">
                    Ultra Fast Download
                  </span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded group-hover:scale-105 transition-transform">
                  {(track.sizeMb * 0.4).toFixed(1)} MB
                </span>
              </button>

              {/* 30s Call Ringtone */}
              <button
                onClick={() => onStartDownload(track, 'ringtone')}
                className="flex items-center justify-between p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold transition-all shadow-xs group"
              >
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span>✂ Download Ringtone Cut</span>
                  </div>
                  <span className="text-[10px] text-amber-100 font-normal">
                    30 Sec Amplified Loop
                  </span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded group-hover:scale-105 transition-transform">
                  1.2 MB
                </span>
              </button>
            </div>
          </div>

          {/* Detailed Metadata Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
              <span>Song Technical Specifications</span>
              <span className="text-[11px] text-slate-500 font-normal">ID: {track.id}</span>
            </div>
            <table className="w-full divide-y divide-slate-100">
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium w-1/3">File Name:</td>
                  <td className="px-3 py-2 text-slate-900 font-semibold">{track.title.replace(/\s+/g, '_')}.mp3</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-500 font-medium">DJ / Remixer:</td>
                  <td className="px-3 py-2 text-amber-700 font-bold">{track.remixer}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium">Original Singer:</td>
                  <td className="px-3 py-2 text-slate-900">{track.originalArtist}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-500 font-medium">Category / Album:</td>
                  <td className="px-3 py-2 text-slate-900">{track.category}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium">Duration:</td>
                  <td className="px-3 py-2 text-slate-900">{formatDuration(track.duration)}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-500 font-medium">Audio Bitrate:</td>
                  <td className="px-3 py-2 text-slate-900">{track.bitrate} CBR (44.1 kHz, Stereo)</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium">Total Downloads:</td>
                  <td className="px-3 py-2 text-slate-900 font-bold">{track.downloadCount.toLocaleString()} Hits</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-500 font-medium">Tempo / Rhythm:</td>
                  <td className="px-3 py-2 text-slate-900">{track.bpm} BPM (Heavy Dance Drop)</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 text-slate-500 font-medium">Uploaded Date:</td>
                  <td className="px-3 py-2 text-slate-900">{track.addedDate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Social Sharing & QR Code Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800">Share Track:</span>
              <button
                onClick={handleShareWhatsApp}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
              >
                WhatsApp
              </button>
              <button
                onClick={handleShareTelegram}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-medium transition-colors"
              >
                Telegram
              </button>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium transition-colors flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowQr(!showQr)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded font-medium"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-700" />
              <span>{showQr ? 'Hide QR' : 'Mobile Scan QR'}</span>
            </button>
          </div>

          {/* QR Code Container */}
          {showQr && (
            <div className="p-4 bg-white border border-slate-200 rounded-lg text-center space-y-2">
              <div className="w-36 h-36 mx-auto bg-slate-900 p-2 rounded-lg flex items-center justify-center">
                {/* SVG QR Code Simulation */}
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
                Scan with any mobile camera or QR reader to download instantly on your phone.
              </p>
            </div>
          )}

          {/* Related DJ Songs */}
          {relatedTracks.length > 0 && (
            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-amber-600" />
                <span>More Songs From This Category:</span>
              </h4>
              <div className="space-y-1.5">
                {relatedTracks.slice(0, 3).map((rTrack) => (
                  <button
                    key={rTrack.id}
                    onClick={() => onSelectRelatedTrack(rTrack)}
                    className="w-full text-left p-2 rounded bg-slate-50 hover:bg-amber-50 border border-slate-200 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold text-slate-900 truncate block">
                        {rTrack.title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {rTrack.remixer} · {rTrack.bitrate}
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded shrink-0">
                      View
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
