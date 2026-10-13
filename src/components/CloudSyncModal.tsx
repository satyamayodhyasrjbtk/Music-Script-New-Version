import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  Laptop,
  Layers,
  Heart,
  Download,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastSynced: string;
  devicesCount: number;
  playlistsCount: number;
  favoritesCount: number;
  downloadsCount: number;
  onTriggerSync: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  lastSynced,
  devicesCount,
  playlistsCount,
  favoritesCount,
  downloadsCount,
  onTriggerSync,
}) => {
  const [syncing, setSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSyncClick = () => {
    setSyncing(true);
    setTimeout(() => {
      onTriggerSync();
      setSyncing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-bold text-sm">Multi-Device Cloud Synchronization</h3>
              <p className="text-[10px] text-slate-400">Seamless listening across phone, tablet & PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="p-4 bg-sky-50 border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-600">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                {syncing ? 'Syncing In Progress...' : 'All Audio Data Synced'}
              </span>
              <p className="text-[11px] text-slate-500">
                Last updated: {lastSynced}
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncClick}
            disabled={syncing}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {/* Sync Items Checklist */}
        <div className="p-4 space-y-3 text-xs">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Synchronized Items
          </h4>

          <div className="space-y-2">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Layers className="w-4 h-4 text-amber-600" />
                <span className="font-medium">User Playlists</span>
              </div>
              <span className="font-bold text-slate-900">{playlistsCount} Playlists</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-medium">Liked / Favorite Tracks</span>
              </div>
              <span className="font-bold text-slate-900">{favoritesCount} Songs</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Download className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Download History</span>
              </div>
              <span className="font-bold text-slate-900">{downloadsCount} Files</span>
            </div>
          </div>

          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pt-2">
            Connected Devices ({devicesCount})
          </h4>

          <div className="space-y-1.5">
            <div className="p-2 bg-slate-50 rounded flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-slate-700">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <span>Android Chrome (Active Current Device)</span>
              </div>
              <span className="text-emerald-700 font-bold">Online</span>
            </div>

            <div className="p-2 bg-slate-50 rounded flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-slate-700">
                <Laptop className="w-3.5 h-3.5 text-slate-500" />
                <span>Windows 11 PC (Last sync: 2 hours ago)</span>
              </div>
              <span className="text-slate-400">Idle</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          Audio playback positions and playlists sync automatically whenever you make changes.
        </div>
      </div>
    </div>
  );
};
