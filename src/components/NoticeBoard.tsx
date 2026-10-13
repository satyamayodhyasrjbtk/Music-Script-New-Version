import React from 'react';
import { Volume2, Flame, Smartphone, Sparkles, Folder } from 'lucide-react';

interface NoticeBoardProps {
  onCategorySelect?: (slug: string) => void;
  onOpenOfflineModal: () => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ onCategorySelect, onOpenOfflineModal }) => {
  return (
    <div className="space-y-2.5">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 text-white rounded-xl p-3 sm:p-4 shadow-sm border border-emerald-600">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/15 rounded-lg shrink-0 mt-0.5 border border-white/20">
            <Volume2 className="w-5 h-5 text-yellow-300" />
          </div>
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-extrabold tracking-wide flex items-center gap-1.5 flex-wrap">
              <span>★ DjMinu.in & OyeDjSurendra - Official High Quality DJ Portal ★</span>
              <span className="bg-yellow-400 text-slate-950 text-[10px] uppercase font-black px-1.5 py-0.2 rounded shadow-2xs">
                2026 Edition
              </span>
            </p>
            <p className="text-emerald-100 text-[11px] sm:text-xs mt-1 leading-relaxed">
              Welcome to the fastest music downloading network! High Definition 320 Kbps MP3 Audio, competition sound check tracks, car subwoofer bass, Navratri Pachra, and mobile ringtones. Every track has its own dedicated download page and link.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Strip */}
      <div className="bg-white border border-emerald-200 rounded-lg p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
          <Flame className="w-4 h-4 text-emerald-700" />
          <span>Quick Folders:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onCategorySelect && onCategorySelect('bhakti-special')}
            className="px-2.5 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 rounded border border-yellow-200 transition-colors font-bold flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-yellow-600" />
            <span>Navratri 2026 Special</span>
          </button>
          <button
            onClick={() => onCategorySelect && onCategorySelect('bhojpuri-dj')}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded border border-emerald-200 transition-colors font-semibold"
          >
            Bhojpuri DJ Remix
          </button>
          <button
            onClick={() => onCategorySelect && onCategorySelect('bollywood-mashup')}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded border border-slate-200 transition-colors font-semibold"
          >
            Bollywood Mashup
          </button>
          <button
            onClick={() => onCategorySelect && onCategorySelect('ringtones')}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded border border-slate-200 transition-colors font-semibold"
          >
            Call Ringtones
          </button>
          <button
            onClick={onOpenOfflineModal}
            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold transition-colors flex items-center gap-1"
          >
            <Smartphone className="w-3 h-3" />
            <span>Offline Player</span>
          </button>
        </div>
      </div>
    </div>
  );
};
