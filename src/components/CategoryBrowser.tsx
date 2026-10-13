import React from 'react';
import {
  Folder,
  FolderOpen,
  Flame,
  ChevronRight,
  Music,
  Disc,
  Zap,
  Radio,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { Category } from '../types/music';

interface CategoryBrowserProps {
  categories: Category[];
  selectedCategorySlug: string;
  onSelectCategory: (slug: string) => void;
  totalTracks: number;
}

export const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  categories,
  selectedCategorySlug,
  onSelectCategory,
  totalTracks,
}) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-4 h-4 text-amber-600" />;
      case 'Music':
        return <Music className="w-4 h-4 text-blue-600" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'Disc':
        return <Disc className="w-4 h-4 text-emerald-600" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-yellow-600" />;
      case 'Radio':
        return <Radio className="w-4 h-4 text-purple-600" />;
      case 'Smartphone':
        return <Smartphone className="w-4 h-4 text-rose-500" />;
      default:
        return <Folder className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="bg-white border border-emerald-200 rounded-xl shadow-xs overflow-hidden">
      {/* Category Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-800 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-emerald-900">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-yellow-300" />
          <h2 className="font-extrabold text-xs sm:text-sm tracking-wide">
            Select Music Category / Folder Directory
          </h2>
        </div>
        <span className="text-[11px] text-emerald-200 font-semibold">
          Total Tracks: {totalTracks}
        </span>
      </div>

      {/* Categories List */}
      <div className="divide-y divide-slate-100">
        {/* All Songs Option */}
        <button
          onClick={() => onSelectCategory('')}
          className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
            selectedCategorySlug === ''
              ? 'bg-amber-50 text-amber-900 font-semibold'
              : 'hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs sm:text-sm">★ All DJ Remix & MP3 Songs (Full Catalog)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">[{totalTracks} Files]</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        {/* Individual Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategorySlug === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                isSelected
                  ? 'bg-amber-50/80 text-amber-950 font-semibold'
                  : 'hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="shrink-0">{getCategoryIcon(cat.iconName)}</div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-medium truncate">{cat.name}</span>
                    {cat.isHot && (
                      <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0">
                        Hot
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-400 font-medium">
                  [{cat.trackCount} Files]
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
