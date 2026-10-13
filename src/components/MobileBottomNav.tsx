import React from 'react';
import {
  Home,
  FolderOpen,
  Search,
  Smartphone,
  Download,
  Layers,
} from 'lucide-react';

interface MobileBottomNavProps {
  onHomeClick: () => void;
  onOpenCategories: () => void;
  onFocusSearch: () => void;
  onOpenOffline: () => void;
  onOpenDownloads: () => void;
  onOpenPlaylists: () => void;
  activeDownloadsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onHomeClick,
  onOpenCategories,
  onFocusSearch,
  onOpenOffline,
  onOpenDownloads,
  onOpenPlaylists,
  activeDownloadsCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex items-center justify-around py-1.5 px-2 md:hidden">
      <button
        onClick={onHomeClick}
        className="flex flex-col items-center justify-center p-1 text-slate-300 hover:text-amber-400 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="text-[10px] mt-0.5 font-medium">Home</span>
      </button>

      <button
        onClick={onOpenCategories}
        className="flex flex-col items-center justify-center p-1 text-slate-300 hover:text-amber-400 transition-colors"
      >
        <FolderOpen className="w-4 h-4" />
        <span className="text-[10px] mt-0.5 font-medium">Folders</span>
      </button>

      <button
        onClick={onFocusSearch}
        className="flex flex-col items-center justify-center p-1 text-slate-300 hover:text-amber-400 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="text-[10px] mt-0.5 font-medium">Search</span>
      </button>

      <button
        onClick={onOpenPlaylists}
        className="flex flex-col items-center justify-center p-1 text-slate-300 hover:text-amber-400 transition-colors"
      >
        <Layers className="w-4 h-4" />
        <span className="text-[10px] mt-0.5 font-medium">Playlists</span>
      </button>

      <button
        onClick={onOpenOffline}
        className="flex flex-col items-center justify-center p-1 text-slate-300 hover:text-amber-400 transition-colors"
      >
        <Smartphone className="w-4 h-4" />
        <span className="text-[10px] mt-0.5 font-medium">Offline</span>
      </button>

      <button
        onClick={onOpenDownloads}
        className="relative flex flex-col items-center justify-center p-1 text-slate-300 hover:text-amber-400 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="text-[10px] mt-0.5 font-medium">Downloads</span>
        {activeDownloadsCount > 0 && (
          <span className="absolute 0 -top-0.5 right-2 bg-amber-500 text-slate-950 font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {activeDownloadsCount}
          </span>
        )}
      </button>
    </nav>
  );
};
