import React from 'react';
import {
  X,
  Smartphone,
  WifiOff,
  Wifi,
  Play,
  Trash2,
  HardDrive,
  CheckCircle2,
  Disc,
} from 'lucide-react';
import { CachedOfflineTrack, Track } from '../types/music';

interface OfflineLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cachedTracks: CachedOfflineTrack[];
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  onPlayTrack: (track: Track) => void;
  onRemoveCachedTrack: (trackId: string) => void;
}

export const OfflineLibraryModal: React.FC<OfflineLibraryModalProps> = ({
  isOpen,
  onClose,
  cachedTracks,
  isOfflineMode,
  onToggleOfflineMode,
  onPlayTrack,
  onRemoveCachedTrack,
}) => {
  if (!isOpen) return null;

  const totalStorageMb = cachedTracks.reduce((acc, t) => acc + t.sizeMb, 0).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Offline Playback Storage</h3>
              <p className="text-[10px] text-slate-400">IndexedDB Device Caching for Mobile & Desktop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline Mode Switch Bar */}
        <div className="bg-emerald-50 border-b border-emerald-200 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isOfflineMode ? (
              <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <Wifi className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <div>
              <span className="font-bold text-xs text-slate-900 block">
                {isOfflineMode ? 'Offline Simulation Active' : 'Online Connected'}
              </span>
              <p className="text-[11px] text-slate-600">
                {isOfflineMode
                  ? 'Playing exclusively from local storage with no internet required'
                  : 'Toggle to test offline playback with zero network usage'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleOfflineMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
              isOfflineMode
                ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-2xs'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
            }`}
          >
            {isOfflineMode ? 'Turn Online' : 'Go Offline'}
          </button>
        </div>

        {/* Storage stats */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-slate-500" />
            <span>Cached Songs: {cachedTracks.length}</span>
          </div>
          <span className="font-mono text-slate-800 font-semibold">
            Storage Used: {totalStorageMb} MB
          </span>
        </div>

        {/* List of Cached Tracks */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {cachedTracks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <p className="font-semibold text-slate-700">No tracks stored offline yet.</p>
              <p className="mt-1 text-[11px]">
                Click "Save for Offline" on any song's detail page to make it available anywhere without internet!
              </p>
            </div>
          ) : (
            cachedTracks.map((item) => (
              <div
                key={item.trackId}
                className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Disc className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 truncate">{item.track.title}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.track.remixer} · {item.sizeMb} MB · Saved {item.cachedAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      onPlayTrack(item.track);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[11px]"
                  >
                    <Play className="w-3 h-3 ml-0.5" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={() => onRemoveCachedTrack(item.trackId)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Remove from offline storage"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          Cached audio buffers are stored in local client cache and play instantly without buffering.
        </div>
      </div>
    </div>
  );
};
