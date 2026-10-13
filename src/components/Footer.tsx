import React from 'react';
import { ShieldCheck, Mail, Send, Radio, Music } from 'lucide-react';
import { Category } from '../types/music';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ categories, onSelectCategory }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-12 pb-24 md:pb-16 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-white font-black text-base mb-2">
              <span className="text-yellow-400">DjMinu.in</span> & <span className="text-emerald-400">OyeDjSurendra</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              India's premier high-definition MP3 song & DJ remix downloading hub. Delivering 320 Kbps studio quality master audio tracks with heavy sub-bass lines, roadshow dholki mixes, and instant mobile ringtones with dedicated song URLs.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-2">Popular Categories</h4>
            <div className="flex flex-wrap gap-1.5">
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.slug)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-2">Legal & DMCA Disclaimer</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              All audio files and DJ remixes available on this portal are for promotional and entertainment use only. We respect copyright holders. If you are an artist or label with inquiries, please contact our support team.
            </p>
          </div>
        </div>

        {/* Bottom Copyright & Links */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © 2026 OyeDjSurendra.com - All Rights Reserved. Engineered for High Quality Sound.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>·</span>
            <span className="hover:text-slate-400 cursor-pointer">DMCA Notice</span>
            <span>·</span>
            <span className="hover:text-slate-400 cursor-pointer">Contact DJ Surendra</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
