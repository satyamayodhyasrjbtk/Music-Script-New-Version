import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Heart,
  Plus,
  Zap,
  Sliders,
  RotateCcw,
  X,
  Disc,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { Track, AudioQuality } from '../types/music';
import { audioEngine, EQ_BANDS } from '../services/audioEngine';

interface AudioPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenTrackDetail: (track: Track) => void;
  onStartDownload: (track: Track, quality: AudioQuality) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  isLiked: boolean;
}

const EQ_PRESETS = [
  { name: 'Flat', values: [0, 0, 0, 0, 0] },
  { name: 'DJ Bass Boost', values: [9, 6, 0, 2, 4] },
  { name: 'Club Dance', values: [7, 4, -1, 3, 6] },
  { name: 'Vocal Clarity', values: [-2, 0, 6, 4, 2] },
  { name: 'Treble Air', values: [-3, -1, 1, 5, 8] },
  { name: 'Subwoofer Car', values: [11, 7, -2, 1, 3] },
];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  isPlaying,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onOpenTrackDetail,
  onStartDownload,
  onOpenAddToPlaylist,
  onToggleLike,
  isLiked,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [bassBoost, setBassBoost] = useState(false);
  const [quality, setQuality] = useState<AudioQuality>('320kbps');
  const [isExpanded, setIsExpanded] = useState(false);

  // 5-Band Equalizer States (-12dB to +12dB)
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0]);
  const [activePreset, setActivePreset] = useState<string>('Flat');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync current time from audio engine
  useEffect(() => {
    if (!track) return;
    const interval = setInterval(() => {
      setCurrentTime(audioEngine.getCurrentTime());
    }, 500);
    return () => clearInterval(interval);
  }, [track]);

  // Handle Equalizer Changes
  const handleEqBandChange = (index: number, val: number) => {
    const next = [...eqGains];
    next[index] = val;
    setEqGains(next);
    setActivePreset('Custom');
    audioEngine.setEqualizerBand(index, val);
  };

  const applyPreset = (preset: { name: string; values: number[] }) => {
    setEqGains([...preset.values]);
    setActivePreset(preset.name);
    audioEngine.setAllEqualizerBands(preset.values);
  };

  const resetEq = () => {
    applyPreset(EQ_PRESETS[0]);
  };

  // Handle Canvas spectrum visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderSpectrum = () => {
      const analyser = audioEngine.getAnalyser();
      if (!analyser || !isPlaying) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw resting bar line
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, canvas.height / 2 - 1, canvas.width, 2);
        animFrameRef.current = requestAnimationFrame(renderSpectrum);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Gradient for amber DJ theme
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, '#d97706');
        grad.addColorStop(1, '#f59e0b');

        ctx.fillStyle = grad;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1.5;
      }

      animFrameRef.current = requestAnimationFrame(renderSpectrum);
    };

    renderSpectrum();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  if (!track) return null;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    audioEngine.seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    audioEngine.setVolume(newVol);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume || 0.8);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  const toggleBass = () => {
    const nextVal = !bassBoost;
    setBassBoost(nextVal);
    audioEngine.toggleBassBoost(nextVal);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white border-t border-slate-800 shadow-2xl backdrop-blur-md">
      {/* Visual 5-Band Equalizer Tray */}
      {isEqOpen && (
        <div className="bg-slate-950 border-b border-slate-800 px-3 sm:px-6 py-4 shadow-2xl animate-fade-in">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Equalizer Header & Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                    <span>5-Band Master Audio Equalizer</span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                      Preset: {activePreset}
                    </span>
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">
                    Adjust frequency gains (-12 dB to +12 dB) to shape custom audio curves in real time.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={resetEq}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs font-semibold transition-colors"
                  title="Reset all bands to 0 dB Flat"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Reset (0 dB)</span>
                </button>
                <button
                  onClick={() => setIsEqOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  title="Close Equalizer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Presets Quick Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-slate-400 font-medium mr-1 shrink-0">Presets:</span>
              {EQ_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${
                    activePreset === p.name
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Visual Frequency Response Curve SVG */}
            <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 relative overflow-hidden">
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1 px-2">
                <span>+12 dB</span>
                <span>0 dB (Flat)</span>
                <span>-12 dB</span>
              </div>
              <svg viewBox="0 0 500 70" className="w-full h-14 overflow-visible">
                <defs>
                  <linearGradient id="eqGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* 0dB Reference Line */}
                <line x1="0" y1="35" x2="500" y2="35" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                {/* Response Area Fill */}
                <path
                  d={`M 50 35 
                      C 100 ${35 - (eqGains[0] / 12) * 26}, 120 ${35 - (eqGains[1] / 12) * 26}, 150 ${35 - (eqGains[1] / 12) * 26}
                      C 180 ${35 - (eqGains[1] / 12) * 26}, 220 ${35 - (eqGains[2] / 12) * 26}, 250 ${35 - (eqGains[2] / 12) * 26}
                      C 280 ${35 - (eqGains[2] / 12) * 26}, 320 ${35 - (eqGains[3] / 12) * 26}, 350 ${35 - (eqGains[3] / 12) * 26}
                      C 380 ${35 - (eqGains[3] / 12) * 26}, 420 ${35 - (eqGains[4] / 12) * 26}, 450 ${35 - (eqGains[4] / 12) * 26}
                      L 450 70 L 50 70 Z`}
                  fill="url(#eqGradient)"
                />
                {/* Response Stroke Curve */}
                <path
                  d={`M 50 ${35 - (eqGains[0] / 12) * 26}
                      C 100 ${35 - (eqGains[0] / 12) * 26}, 120 ${35 - (eqGains[1] / 12) * 26}, 150 ${35 - (eqGains[1] / 12) * 26}
                      C 180 ${35 - (eqGains[1] / 12) * 26}, 220 ${35 - (eqGains[2] / 12) * 26}, 250 ${35 - (eqGains[2] / 12) * 26}
                      C 280 ${35 - (eqGains[2] / 12) * 26}, 320 ${35 - (eqGains[3] / 12) * 26}, 350 ${35 - (eqGains[3] / 12) * 26}
                      C 380 ${35 - (eqGains[3] / 12) * 26}, 420 ${35 - (eqGains[4] / 12) * 26}, 450 ${35 - (eqGains[4] / 12) * 26}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
                {/* 5 Anchor Nodes */}
                {eqGains.map((gain, i) => {
                  const x = 50 + i * 100;
                  const y = 35 - (gain / 12) * 26;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-amber-400 stroke-slate-900 stroke-2"
                    />
                  );
                })}
              </svg>
            </div>

            {/* 5 Frequency Band Sliders Grid */}
            <div className="grid grid-cols-5 gap-2 sm:gap-4 pt-1">
              {EQ_BANDS.map((band, idx) => {
                const gain = eqGains[idx];
                const gainDisplay = gain > 0 ? `+${gain} dB` : `${gain} dB`;

                return (
                  <div
                    key={band.label}
                    className="flex flex-col items-center bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-lg p-2 sm:p-3 transition-colors"
                  >
                    {/* Gain dB Readout */}
                    <span
                      className={`text-[11px] font-mono font-bold tabular-nums mb-2 ${
                        gain > 0
                          ? 'text-amber-400'
                          : gain < 0
                          ? 'text-sky-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {gainDisplay}
                    </span>

                    {/* Vertical Slider Controller */}
                    <div className="h-28 flex items-center justify-center relative py-1">
                      {/* Zero Center Line */}
                      <div className="absolute w-4 h-0.5 bg-slate-700/80 pointer-events-none top-1/2 -translate-y-1/2 z-0" />
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={1}
                        value={gain}
                        onChange={(e) => handleEqBandChange(idx, Number(e.target.value))}
                        className="h-24 w-3 accent-amber-500 cursor-pointer [appearance:slider-vertical] z-10"
                        title={`${band.label} (${gainDisplay})`}
                      />
                    </div>

                    {/* Quick Step Buttons */}
                    <div className="flex items-center gap-1 my-2">
                      <button
                        onClick={() => handleEqBandChange(idx, Math.max(-12, gain - 1))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold"
                        title="-1 dB"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleEqBandChange(idx, 0)}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                        title="Reset this band to 0 dB"
                      >
                        0
                      </button>
                      <button
                        onClick={() => handleEqBandChange(idx, Math.min(12, gain + 1))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold"
                        title="+1 dB"
                      >
                        +
                      </button>
                    </div>

                    {/* Frequency & Sublabel */}
                    <span className="text-xs font-extrabold text-white mt-0.5 tracking-tight">
                      {band.label}
                    </span>
                    <span className="text-[10px] text-slate-400 text-center truncate max-w-full">
                      {band.sublabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Seek Progress Bar */}
      <div className="relative group w-full h-1.5 bg-slate-800 cursor-pointer">
        <input
          type="range"
          min={0}
          max={track.duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-r transition-all"
          style={{ width: `${(currentTime / (track.duration || 1)) * 100}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Track Information & Album Art */}
        <div className="flex items-center gap-3 min-w-0 max-w-[260px] sm:max-w-xs">
          <div
            onClick={() => onOpenTrackDetail(track)}
            className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 cursor-pointer relative"
          >
            <Disc className={`w-6 h-6 ${isPlaying ? 'animate-spin' : ''}`} />
          </div>

          <div className="truncate">
            <button
              onClick={() => onOpenTrackDetail(track)}
              className="font-bold text-xs sm:text-sm text-white hover:text-amber-400 transition-colors truncate block text-left"
            >
              {track.title}
            </button>
            <p className="text-[11px] text-amber-300 font-medium truncate">
              {track.remixer}
            </p>
          </div>

          {/* Like button */}
          <button
            onClick={() => onToggleLike(track.id)}
            className={`p-1.5 rounded transition-colors hidden sm:block ${
              isLiked ? 'text-red-500' : 'text-slate-400 hover:text-white'
            }`}
            title="Like Track"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Controls & Spectrum Canvas */}
        <div className="flex-1 flex flex-col items-center max-w-md">
          {/* Main Playback Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onPrev}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (isPlaying) onPause();
                else onPlay();
              }}
              className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-transform hover:scale-105 shadow-md font-bold"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Bass Boost Toggle */}
            <button
              onClick={toggleBass}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                bassBoost
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="DJ Heavy Bass Subwoofer Boost"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{bassBoost ? 'BASS ON' : 'BASS'}</span>
            </button>

            {/* 5-Band Equalizer Toggle */}
            <button
              onClick={() => setIsEqOpen(!isEqOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                isEqOpen
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                  : activePreset !== 'Flat'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Open 5-Band Visual Equalizer"
            >
              <SlidersHorizontal className="w-3 h-3 text-amber-400" />
              <span>EQ</span>
              {activePreset !== 'Flat' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Time & Mini Visualizer */}
          <div className="w-full flex items-center justify-between gap-2 mt-1">
            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              {formatTime(currentTime)}
            </span>

            {/* Waveform Canvas */}
            <div className="flex-1 h-3.5 mx-1 hidden sm:block">
              <canvas
                ref={canvasRef}
                width={160}
                height={16}
                className="w-full h-full rounded"
              />
            </div>

            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              {formatTime(track.duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quality badge */}
          <span className="hidden lg:inline text-[10px] font-bold bg-slate-800 text-amber-400 border border-slate-700 px-1.5 py-0.5 rounded uppercase">
            {track.bitrate}
          </span>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-1.5">
            <button onClick={toggleMute} className="text-slate-400 hover:text-white">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-700 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Add to playlist button */}
          <button
            onClick={() => onOpenAddToPlaylist(track)}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors hidden sm:block"
            title="Add to Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Download button */}
          <button
            onClick={() => onStartDownload(track, '320kbps')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
            title="Download MP3"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
