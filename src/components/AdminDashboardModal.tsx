import React, { useState } from 'react';
import {
  X,
  Shield,
  Upload,
  Edit,
  Trash2,
  Plus,
  Bell,
  BarChart3,
  Check,
  Disc,
  FolderOpen,
  Link,
  Copy,
  ExternalLink,
  Lock,
  Eye,
  FileAudio,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Globe,
  RefreshCw,
  FileCode,
  Search,
  Sparkles,
  Share2,
  Tag,
} from 'lucide-react';
import { Track, Category, UserProfile, AudioQuality } from '../types/music';
import { slugify, generateUniqueTrackSlug, generateUniqueCategorySlug } from '../utils/slug';
import { ApiService } from '../services/api';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  categories: Category[];
  user: UserProfile;
  onAdminLogin: (email: string, pass: string) => Promise<boolean>;
  onAdminLogout: () => void;
  onAddTrack: (trackData: any, broadcastRelease: boolean) => Promise<Track | void>;
  onUpdateTrack: (track: Track) => Promise<void>;
  onDeleteTrack: (trackId: string) => Promise<void>;
  onCreateCategory: (categoryData: any) => Promise<void>;
  onUpdateCategory: (id: string, categoryData: any) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onBroadcastNotification: (title: string, message: string, trackId?: string) => void;
  onNavigateToSong: (slug: string) => void;
  onNavigateToCategory: (slug: string) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  tracks,
  categories,
  user,
  onAdminLogin,
  onAdminLogout,
  onAddTrack,
  onUpdateTrack,
  onDeleteTrack,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onBroadcastNotification,
  onNavigateToSong,
  onNavigateToCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'folders' | 'seo' | 'sitemap' | 'broadcast' | 'stats'>('upload');

  // SEO Manager States
  const [seoFilterType, setSeoFilterType] = useState<'all' | 'songs' | 'categories'>('all');
  const [seoSearchQuery, setSeoSearchQuery] = useState('');
  const [seoStatusFilter, setSeoStatusFilter] = useState<'all' | 'custom' | 'default'>('all');
  const [editingSeoTarget, setEditingSeoTarget] = useState<
    { type: 'song'; item: Track } | { type: 'category'; item: Category } | null
  >(null);
  const [seoFormMetaTitle, setSeoFormMetaTitle] = useState('');
  const [seoFormMetaDescription, setSeoFormMetaDescription] = useState('');
  const [seoFormOgTitle, setSeoFormOgTitle] = useState('');
  const [seoFormOgDescription, setSeoFormOgDescription] = useState('');
  const [seoFormOgImage, setSeoFormOgImage] = useState('');
  const [seoFormKeywords, setSeoFormKeywords] = useState('');
  const [isSavingSeo, setIsSavingSeo] = useState(false);
  const [seoAlert, setSeoAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sitemap Management States
  const [sitemapInfo, setSitemapInfo] = useState<any>(null);
  const [isPingingSitemap, setIsPingingSitemap] = useState(false);
  const [pingStatusMessage, setPingStatusMessage] = useState<string | null>(null);
  const [showXmlCode, setShowXmlCode] = useState(false);
  const [sitemapSearch, setSitemapSearch] = useState('');

  // Load sitemap info when sitemap tab is selected
  React.useEffect(() => {
    if (activeTab === 'sitemap' || isOpen) {
      ApiService.getSitemapInfo().then(setSitemapInfo);
    }
  }, [activeTab, isOpen, tracks.length, categories.length]);

  const handlePingSitemap = async () => {
    setIsPingingSitemap(true);
    setPingStatusMessage(null);
    try {
      const res = await ApiService.pingSitemap();
      if (res && res.success) {
        setPingStatusMessage(`⚡ Google & Search Engine crawlers pinged successfully at ${new Date().toLocaleTimeString()}! All ${res.indexedCount} URLs indexed.`);
        const updated = await ApiService.getSitemapInfo();
        setSitemapInfo(updated);
      } else {
        setPingStatusMessage('⚡ Dynamic sitemap refreshed with latest URLs!');
      }
    } catch (err: any) {
      setPingStatusMessage(`Ping response: ${err.message}`);
    } finally {
      setIsPingingSitemap(false);
    }
  };

  // SEO Manager Handlers
  const openSeoEditor = (target: { type: 'song'; item: Track } | { type: 'category'; item: Category }) => {
    setEditingSeoTarget(target);
    setSeoAlert(null);
    if (target.type === 'song') {
      const t = target.item;
      setSeoFormMetaTitle(t.metaTitle || '');
      setSeoFormMetaDescription(t.metaDescription || '');
      setSeoFormOgTitle(t.ogTitle || '');
      setSeoFormOgDescription(t.ogDescription || '');
      setSeoFormOgImage(t.ogImage || t.thumbnailUrl || '');
      setSeoFormKeywords(t.metaKeywords || (t.tags ? t.tags.join(', ') : ''));
    } else {
      const c = target.item;
      setSeoFormMetaTitle(c.metaTitle || '');
      setSeoFormMetaDescription(c.metaDescription || '');
      setSeoFormOgTitle(c.ogTitle || '');
      setSeoFormOgDescription(c.ogDescription || '');
      setSeoFormOgImage(c.ogImage || '');
      setSeoFormKeywords(c.metaKeywords || '');
    }
  };

  const handleAutoGenerateSeo = () => {
    if (!editingSeoTarget) return;
    if (editingSeoTarget.type === 'song') {
      const t = editingSeoTarget.item;
      const genTitle = `${t.title} (${t.remixer}) 320 Kbps MP3 Download | DjMinu.in`;
      const genDesc = `Download ${t.title} remixed by ${t.remixer}. Original by ${t.originalArtist}. High Quality ${t.bitrate} MP3 Audio, ${t.sizeMb} MB. Free fast download.`;
      const genKeywords = `${t.title}, ${t.remixer}, ${t.originalArtist}, ${t.category}, 320 kbps, dj remix, mp3 download, audio`;
      setSeoFormMetaTitle(genTitle);
      setSeoFormMetaDescription(genDesc);
      setSeoFormOgTitle(genTitle);
      setSeoFormOgDescription(genDesc);
      setSeoFormOgImage(t.thumbnailUrl || '');
      setSeoFormKeywords(genKeywords);
    } else {
      const c = editingSeoTarget.item;
      const genTitle = `${c.name} MP3 Songs & DJ Remix Free Download | DjMinu.in`;
      const genDesc = `Download all songs from ${c.name}. ${c.description}. High quality 320 Kbps MP3 music files.`;
      const genKeywords = `${c.name}, dj remix songs, mp3 download, dholki bass, ${c.slug}`;
      setSeoFormMetaTitle(genTitle);
      setSeoFormMetaDescription(genDesc);
      setSeoFormOgTitle(genTitle);
      setSeoFormOgDescription(genDesc);
      setSeoFormKeywords(genKeywords);
    }
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeoTarget) return;
    setIsSavingSeo(true);
    setSeoAlert(null);
    try {
      if (editingSeoTarget.type === 'song') {
        const t = editingSeoTarget.item;
        const updatedTrack: Track = {
          ...t,
          metaTitle: seoFormMetaTitle.trim() || undefined,
          metaDescription: seoFormMetaDescription.trim() || undefined,
          ogTitle: seoFormOgTitle.trim() || undefined,
          ogDescription: seoFormOgDescription.trim() || undefined,
          ogImage: seoFormOgImage.trim() || undefined,
          metaKeywords: seoFormKeywords.trim() || undefined,
        };
        await onUpdateTrack(updatedTrack);
        setEditingSeoTarget({ type: 'song', item: updatedTrack });
      } else {
        const c = editingSeoTarget.item;
        const updateData = {
          metaTitle: seoFormMetaTitle.trim() || undefined,
          metaDescription: seoFormMetaDescription.trim() || undefined,
          ogTitle: seoFormOgTitle.trim() || undefined,
          ogDescription: seoFormOgDescription.trim() || undefined,
          ogImage: seoFormOgImage.trim() || undefined,
          metaKeywords: seoFormKeywords.trim() || undefined,
        };
        await onUpdateCategory(c.id, updateData);
        setEditingSeoTarget({ type: 'category', item: { ...c, ...updateData } });
      }
      setSeoAlert({
        message: 'SEO metadata saved successfully! Search engine snippets and social tags updated.',
        type: 'success',
      });
    } catch (err: any) {
      setSeoAlert({
        message: err.message || 'Failed to save SEO metadata',
        type: 'error',
      });
    } finally {
      setIsSavingSeo(false);
    }
  };

  // Admin Login Form
  const [loginEmail, setLoginEmail] = useState('admin@oyedj.com');
  const [loginPass, setLoginPass] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // New Track Form State
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newRemixer, setNewRemixer] = useState('Dj Surendra Ayodhya');
  const [newCategorySlug, setNewCategorySlug] = useState(categories[0]?.slug || 'bhojpuri-dj');
  const [newCustomSlug, setNewCustomSlug] = useState('');
  const [newDuration, setNewDuration] = useState(240);
  const [newBpm, setNewBpm] = useState(132);
  const [newBitrate, setNewBitrate] = useState('320 Kbps');
  const [newSizeMb, setNewSizeMb] = useState(9.2);
  const [newPreset, setNewPreset] = useState<Track['audioPreset']>('bhojpuri_beat');
  const [newDescription, setNewDescription] = useState('');
  const [broadcastOnUpload, setBroadcastOnUpload] = useState(true);

  // Audio & Cover Image Upload States
  const [audioFileName, setAudioFileName] = useState('');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessTrack, setUploadSuccessTrack] = useState<Track | null>(null);

  // Edit Track State
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [searchSongManage, setSearchSongManage] = useState('');

  // Category / Folder Form State
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderType, setNewFolderType] = useState<'category' | 'folder'>('category');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Broadcast Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSelectedTrack, setNotifSelectedTrack] = useState('');

  // Toast / Copy helper
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time slug preview
  const previewSlug = newCustomSlug.trim()
    ? slugify(newCustomSlug)
    : slugify(newTitle) || 'song-url-slug';

  const handleCopyLink = (urlPath: string, id: string) => {
    const full = `${window.location.origin}${urlPath}`;
    navigator.clipboard.writeText(full);
    setCopiedSlug(id);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const ok = await onAdminLogin(loginEmail, loginPass);
      if (!ok) {
        setLoginError('Invalid admin email or password. (Hint: admin@oyedj.com / admin123)');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Real Audio File Selection
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);
    const calculatedMb = Number((file.size / (1024 * 1024)).toFixed(1));
    setNewSizeMb(calculatedMb);

    // Auto-fill title from clean filename if empty
    if (!newTitle.trim()) {
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .trim();
      setNewTitle(cleanTitle);
    }

    // Attempt to compute duration via AudioContext
    try {
      const audioUrl = URL.createObjectURL(file);
      const tempAudio = new Audio(audioUrl);
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && isFinite(tempAudio.duration)) {
          setNewDuration(Math.round(tempAudio.duration));
        }
      };
    } catch (err) {
      // ignore
    }

    // Convert file to base64 for persistent server payload
    const reader = new FileReader();
    reader.onload = () => {
      setAudioBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Cover Image Selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload & Publish Track Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setUploadLoading(true);
    setUploadSuccessTrack(null);

    const matchedCategory = categories.find((c) => c.slug === newCategorySlug);

    const trackPayload = {
      title: newTitle.trim(),
      slug: newCustomSlug.trim() ? slugify(newCustomSlug) : undefined,
      originalArtist: newArtist.trim() || 'Various Artists',
      remixer: newRemixer.trim() || 'Dj Surendra Ayodhya',
      category: matchedCategory?.name || 'Bhojpuri DJ Remix Songs (2026)',
      categorySlug: newCategorySlug,
      duration: Number(newDuration),
      releaseYear: 2026,
      bpm: Number(newBpm),
      bitrate: newBitrate,
      sizeMb: Number(newSizeMb),
      audioPreset: newPreset,
      description: newDescription.trim() || `Official ${newBitrate} Master DJ Remix by ${newRemixer}`,
      audioBase64: audioBase64 || undefined,
      imageBase64: imageBase64 || undefined,
      broadcastRelease: broadcastOnUpload,
      status: 'published',
    };

    try {
      const created = await onAddTrack(trackPayload, broadcastOnUpload);
      if (created) {
        setUploadSuccessTrack(created);
      }
      // Reset form
      setNewTitle('');
      setNewArtist('');
      setNewCustomSlug('');
      setAudioFileName('');
      setAudioBase64(null);
      setImageFileName('');
      setImageBase64(null);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  // Edit Track Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;
    await onUpdateTrack(editingTrack);
    setEditingTrack(null);
  };

  // Create Category Submit
  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    await onCreateCategory({
      name: newFolderName.trim(),
      description: newFolderDesc.trim(),
      folderType: newFolderType,
    });

    setNewFolderName('');
    setNewFolderDesc('');
  };

  // Update Category Submit
  const handleEditCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    await onUpdateCategory(editingCategory.id, editingCategory);
    setEditingCategory(null);
  };

  // Broadcast Notification Submit
  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim()) return;
    onBroadcastNotification(
      notifTitle.trim(),
      notifMessage.trim() || 'Check out this new release on DjMinu.in / OyeDj!',
      notifSelectedTrack || undefined
    );
    setNotifTitle('');
    setNotifMessage('');
    alert('Release notification successfully broadcast to all users!');
  };

  const totalDownloads = tracks.reduce((acc, t) => acc + (t.downloadCount || 0), 0);

  // Filtered tracks in manage view
  const manageTracks = tracks.filter((t) => {
    if (!searchSongManage.trim()) return true;
    const q = searchSongManage.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.remixer.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col border border-emerald-300 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-800 text-white px-4 py-3 flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center font-black">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                DjMinu & OyeDj Portal Master Controller
              </h3>
              <p className="text-[10px] text-emerald-200">
                Dynamic Song & Category URL Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <button
                onClick={onAdminLogout}
                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-200 rounded text-xs font-semibold"
              >
                Sign Out
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-emerald-200 hover:text-white rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate: If user is not admin, show Admin Login form */}
        {user.role !== 'admin' ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-emerald-50/50">
            <div className="max-w-md w-full bg-white p-6 rounded-xl border border-emerald-200 shadow-lg text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Administrator Access Required</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Only authorized portal administrators can upload MP3 songs, edit metadata, and manage categories.
                </p>
              </div>

              {loginError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3 text-left text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admin Email / Username</label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="admin@oyedj.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admin Password</label>
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Enter password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoggingIn ? 'Verifying...' : 'Unlock Admin Dashboard'}</span>
                </button>
              </form>

              <div className="text-[11px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-200">
                Default Credentials: <span className="font-mono text-slate-700">admin@oyedj.com</span> / <span className="font-mono text-slate-700">admin123</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 flex items-center gap-1.5 text-xs font-semibold overflow-x-auto shrink-0">
              <button
                onClick={() => {
                  setActiveTab('upload');
                  setUploadSuccessTrack(null);
                }}
                className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'upload'
                    ? 'border-emerald-700 text-emerald-900 font-bold bg-white rounded-t'
                    : 'border-transparent text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                <span>Upload New Song</span>
              </button>

              <button
                onClick={() => setActiveTab('manage')}
                className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'manage'
                    ? 'border-emerald-700 text-emerald-900 font-bold bg-white rounded-t'
                    : 'border-transparent text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <Disc className="w-3.5 h-3.5 text-emerald-700" />
                <span>Manage Songs ({tracks.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('folders')}
                className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'folders'
                    ? 'border-emerald-700 text-emerald-900 font-bold bg-white rounded-t'
                    : 'border-transparent text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>Categories & Folders ({categories.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('seo');
                  setEditingSeoTarget(null);
                }}
                className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'seo'
                    ? 'border-emerald-700 text-emerald-900 font-bold bg-white rounded-t'
                    : 'border-transparent text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>SEO Manager</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                  {tracks.length + categories.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('sitemap')}
                className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'sitemap'
                    ? 'border-emerald-700 text-emerald-900 font-bold bg-white rounded-t'
                    : 'border-transparent text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sitemap & Google SEO</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                  {tracks.length + categories.length + 1}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('broadcast')}
                className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'broadcast'
                    ? 'border-emerald-700 text-emerald-900 font-bold bg-white rounded-t'
                    : 'border-transparent text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-emerald-700" />
                <span>Broadcast Alert</span>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'stats'
                    ? 'border-emerald-700 text-emerald-900 font-bold bg-white rounded-t'
                    : 'border-transparent text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Portal Analytics</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/70">
              {/* 1. UPLOAD NEW SONG */}
              {activeTab === 'upload' && (
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Success Banner if uploaded */}
                  {uploadSuccessTrack && (
                    <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 shadow-sm animate-fade-in space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Song Uploaded & Published Successfully!</span>
                      </div>
                      <p className="text-xs text-slate-700">
                        Dynamic page created at: <span className="font-mono font-bold text-emerald-900">/song/{uploadSuccessTrack.slug}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            onNavigateToSong(uploadSuccessTrack.slug);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Public Song Page</span>
                        </button>
                        <button
                          onClick={() => handleCopyLink(`/song/${uploadSuccessTrack.slug}`, 'success')}
                          className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded text-xs font-semibold flex items-center gap-1"
                        >
                          {copiedSlug === 'success' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSlug === 'success' ? 'Copied!' : 'Copy Share URL'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={handleUploadSubmit}
                    className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="border-b border-slate-200 pb-3">
                      <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-emerald-700" />
                        <span>Upload Song & Generate Dedicated URL</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Uploading an MP3 file automatically stores the audio, calculates file size, saves metadata, and publishes a unique URL page.
                      </p>
                    </div>

                    {/* Audio File Selection Box */}
                    <div className="bg-emerald-50/70 border-2 border-dashed border-emerald-400 rounded-xl p-4 text-center space-y-2">
                      <FileAudio className="w-8 h-8 text-emerald-600 mx-auto" />
                      <div>
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>Select MP3 / Audio File From Device</span>
                          <input
                            type="file"
                            accept="audio/*,.mp3,.wav,.aac,.ogg"
                            onChange={handleAudioFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {audioFileName ? (
                          <span className="text-emerald-800 font-bold">
                            Selected Audio: {audioFileName} ({newSizeMb} MB)
                          </span>
                        ) : (
                          'Supports MP3, WAV, AAC, M4A. (If no file is picked, synthesized high-gain sound will be used)'
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      {/* Song Title */}
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-800 mb-1">
                          Song Title * (Creates SEO Title & URL)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Kali Mai Bichar Karihe (Navratri DJ Remix)"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Custom URL Slug Field + Live Preview */}
                      <div className="sm:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <label className="block font-bold text-slate-700">
                          Custom URL Slug (Optional - Auto-generated from title):
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-xs select-none">/song/</span>
                          <input
                            type="text"
                            placeholder="e.g. kali-mai-bichar-karihe-remix"
                            value={newCustomSlug}
                            onChange={(e) => setNewCustomSlug(e.target.value)}
                            className="flex-1 p-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <p className="text-[11px] text-emerald-700 font-medium pt-1">
                          Live Page URL: <span className="font-mono font-bold">{window.location.origin}/song/{previewSlug}</span>
                        </p>
                      </div>

                      {/* Remixer Name */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">DJ / Remixer *</label>
                        <input
                          type="text"
                          required
                          value={newRemixer}
                          onChange={(e) => setNewRemixer(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          placeholder="Dj Surendra Ayodhya"
                        />
                      </div>

                      {/* Original Singer */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Original Singer / Artist</label>
                        <input
                          type="text"
                          value={newArtist}
                          onChange={(e) => setNewArtist(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          placeholder="e.g. Anu Dubey, Pawan Singh"
                        />
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Folder / Category *</label>
                        <select
                          value={newCategorySlug}
                          onChange={(e) => setNewCategorySlug(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Bitrate Selection */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Master Bitrate</label>
                        <select
                          value={newBitrate}
                          onChange={(e) => setNewBitrate(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                        >
                          <option value="320 Kbps">320 Kbps Studio Master</option>
                          <option value="192 Kbps">192 Kbps Standard</option>
                          <option value="128 Kbps">128 Kbps Web Mobile</option>
                        </select>
                      </div>

                      {/* Duration & BPM */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Duration (Seconds)</label>
                        <input
                          type="number"
                          value={newDuration}
                          onChange={(e) => setNewDuration(Number(e.target.value))}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">File Size (MB)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newSizeMb}
                          onChange={(e) => setNewSizeMb(Number(e.target.value))}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Cover Image Upload (Optional) */}
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          Cover Thumbnail Image (Optional)
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Choose Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[11px] text-slate-500 truncate">
                            {imageFileName || 'No custom image selected (Default DJ vinyl icon will be used)'}
                          </span>
                        </div>
                      </div>

                      {/* Audio preset fallback style */}
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          Audio Rhythm Synthesis Preset (Backup Stream)
                        </label>
                        <select
                          value={newPreset}
                          onChange={(e) => setNewPreset(e.target.value as Track['audioPreset'])}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                        >
                          <option value="bhakti_special">Devotional / Navratri Pachra Special (Chimes & Dholak)</option>
                          <option value="bhojpuri_beat">Bhojpuri Hard Dholki & Competition Bass Drop</option>
                          <option value="bollywood_dholki">Bollywood 90s Groove & Clavinet</option>
                          <option value="haryanvi_bass">Haryanvi Heavy Subwoofer 35Hz</option>
                          <option value="punjabi_dhol">Punjabi Acoustic Dhol & Bhangra</option>
                          <option value="club_edm">EDM Melbourne Bounce Horn</option>
                          <option value="ringtone">Mobile 30s High-Gain Call Cut</option>
                        </select>
                      </div>

                      {/* Description */}
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Description / SEO Information</label>
                        <textarea
                          rows={2}
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="e.g. Official 320 Kbps High Quality DJ Remix by Dj Surendra with heavy dholki punch and competition sound check."
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <input
                        type="checkbox"
                        id="broadcastCheck"
                        checked={broadcastOnUpload}
                        onChange={(e) => setBroadcastOnUpload(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="broadcastCheck" className="text-xs text-slate-700 font-semibold">
                        Immediately broadcast new release notification to all listeners!
                      </label>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={uploadLoading}
                        className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{uploadLoading ? 'Uploading & Creating Page...' : 'Publish Song & Create Dynamic Page'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 2. MANAGE EXISTING SONGS */}
              {activeTab === 'manage' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <h4 className="font-bold text-sm text-slate-900">
                      Database Songs ({tracks.length} Total Tracks)
                    </h4>
                    <div className="w-full sm:w-72">
                      <input
                        type="text"
                        placeholder="Search song title or slug..."
                        value={searchSongManage}
                        onChange={(e) => setSearchSongManage(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Edit Track Panel */}
                  {editingTrack && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <h5 className="font-bold text-xs text-emerald-900">
                          Editing Metadata: {editingTrack.title}
                        </h5>
                        <button
                          onClick={() => setEditingTrack(null)}
                          className="text-emerald-800 hover:text-emerald-950 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Song Title</label>
                          <input
                            type="text"
                            value={editingTrack.title}
                            onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-300 rounded"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">URL Slug</label>
                          <input
                            type="text"
                            value={editingTrack.slug}
                            onChange={(e) => setEditingTrack({ ...editingTrack, slug: slugify(e.target.value) })}
                            className="w-full p-2 bg-white border border-slate-300 rounded font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Remixer / DJ</label>
                          <input
                            type="text"
                            value={editingTrack.remixer}
                            onChange={(e) => setEditingTrack({ ...editingTrack, remixer: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-300 rounded"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Singer / Artist</label>
                          <input
                            type="text"
                            value={editingTrack.originalArtist}
                            onChange={(e) => setEditingTrack({ ...editingTrack, originalArtist: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-300 rounded"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Category / Folder</label>
                          <select
                            value={editingTrack.categorySlug}
                            onChange={(e) => {
                              const found = categories.find((c) => c.slug === e.target.value);
                              setEditingTrack({
                                ...editingTrack,
                                categorySlug: e.target.value,
                                category: found?.name || editingTrack.category,
                              });
                            }}
                            className="w-full p-2 bg-white border border-slate-300 rounded"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.slug}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Download Hits</label>
                          <input
                            type="number"
                            value={editingTrack.downloadCount}
                            onChange={(e) =>
                              setEditingTrack({ ...editingTrack, downloadCount: Number(e.target.value) })
                            }
                            className="w-full p-2 bg-white border border-slate-300 rounded"
                          />
                        </div>

                        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingTrack(null)}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded font-semibold text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-emerald-700 text-white rounded font-bold text-xs"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Songs Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-emerald-800 text-white font-bold">
                        <tr>
                          <th className="px-3 py-2.5 text-left">Title & Dedicated Slug</th>
                          <th className="px-3 py-2.5 text-left hidden sm:table-cell">DJ / Artist</th>
                          <th className="px-3 py-2.5 text-left hidden md:table-cell">Folder</th>
                          <th className="px-3 py-2.5 text-left">Hits</th>
                          <th className="px-3 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {manageTracks.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2">
                              <span className="font-bold text-slate-900 block truncate max-w-[220px]">
                                {t.title}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-700 block truncate max-w-[220px]">
                                /song/{t.slug}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-600 hidden sm:table-cell truncate max-w-[140px]">
                              {t.remixer}
                            </td>
                            <td className="px-3 py-2 text-slate-500 hidden md:table-cell truncate max-w-[130px]">
                              {t.category}
                            </td>
                            <td className="px-3 py-2 font-mono tabular-nums text-slate-700">
                              {(t.downloadCount || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleCopyLink(`/song/${t.slug}`, t.id)}
                                  className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                  title="Copy Song Public URL"
                                >
                                  {copiedSlug === t.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    onNavigateToSong(t.slug);
                                    onClose();
                                  }}
                                  className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                  title="Open Public Song Page"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingTrack(t)}
                                  className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded"
                                  title="Edit Song Metadata"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete song "${t.title}" from portal?`)) {
                                      onDeleteTrack(t.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  title="Delete Track"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. MANAGE CATEGORIES & FOLDERS */}
              {activeTab === 'folders' && (
                <div className="space-y-4">
                  {/* Create New Folder Form */}
                  <form
                    onSubmit={handleCreateFolderSubmit}
                    className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-emerald-700" />
                      <span>Create New Category or Folder</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Folder Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Navratri Special 2026"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Latest Dholki vibration & festive bhakti mixes"
                          value={newFolderDesc}
                          onChange={(e) => setNewFolderDesc(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Folder Type</label>
                        <select
                          value={newFolderType}
                          onChange={(e) => setNewFolderType(e.target.value as any)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                        >
                          <option value="category">Music Category</option>
                          <option value="folder">Special Folder</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Category Folder</span>
                      </button>
                    </div>
                  </form>

                  {/* Edit Category Modal */}
                  {editingCategory && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-3 text-xs">
                      <h5 className="font-bold text-emerald-900">Edit Folder: {editingCategory.name}</h5>
                      <form onSubmit={handleEditCategorySubmit} className="space-y-3">
                        <div>
                          <label className="block font-semibold mb-1 text-slate-700">Folder Name</label>
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-slate-700">Description</label>
                          <input
                            type="text"
                            value={editingCategory.description}
                            onChange={(e) =>
                              setEditingCategory({ ...editingCategory, description: e.target.value })
                            }
                            className="w-full p-2 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 rounded font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1 bg-emerald-700 text-white rounded font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Categories List */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-emerald-800 text-white font-bold">
                        <tr>
                          <th className="px-3 py-2.5 text-left">Category & URL</th>
                          <th className="px-3 py-2.5 text-left hidden sm:table-cell">Description</th>
                          <th className="px-3 py-2.5 text-left">Files</th>
                          <th className="px-3 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {categories.map((c) => {
                          const count = tracks.filter((t) => t.categorySlug === c.slug).length;
                          return (
                            <tr key={c.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <span className="font-bold text-slate-900 block">{c.name}</span>
                                <span className="text-[10px] font-mono text-emerald-700 block">
                                  /category/{c.slug}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-500 hidden sm:table-cell truncate max-w-[200px]">
                                {c.description}
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-slate-700">
                                {count} songs
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleCopyLink(`/category/${c.slug}`, c.id)}
                                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                    title="Copy Folder URL"
                                  >
                                    {copiedSlug === c.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      onNavigateToCategory(c.slug);
                                      onClose();
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                    title="Open Folder Page"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCategory(c)}
                                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded"
                                    title="Edit Folder"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete folder "${c.name}"?`)) {
                                        onDeleteCategory(c.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"
                                    title="Delete Folder"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. SEO MANAGER TAB */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  {/* Top Stats Banner */}
                  <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-white p-4 sm:p-5 rounded-xl shadow-sm border border-emerald-900 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
                        <h4 className="font-extrabold text-sm sm:text-base text-white">
                          Search Engine & Open Graph Social Card Manager
                        </h4>
                      </div>
                      <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                        Customize meta titles, descriptions, and OpenGraph social share cards for each individual song and category page. Optimized metadata enhances Google search rank and maximizes click-through rates on WhatsApp, Facebook, and Twitter.
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px]">
                        <span className="bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/50 text-emerald-200">
                          Total Dynamic Pages: <strong className="text-yellow-300">{tracks.length + categories.length}</strong>
                        </span>
                        <span className="bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/50 text-emerald-200">
                          Custom Songs:{' '}
                          <strong className="text-emerald-300">
                            {tracks.filter((t) => t.metaTitle || t.metaDescription).length} / {tracks.length}
                          </strong>
                        </span>
                        <span className="bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/50 text-emerald-200">
                          Custom Folders:{' '}
                          <strong className="text-emerald-300">
                            {categories.filter((c) => c.metaTitle || c.metaDescription).length} / {categories.length}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setActiveTab('sitemap');
                        }}
                        className="px-3 py-2 bg-emerald-900/90 hover:bg-emerald-950 text-white font-semibold rounded-lg text-xs border border-emerald-600/50 flex items-center gap-1.5"
                      >
                        <Globe className="w-3.5 h-3.5 text-yellow-300" />
                        <span>View Dynamic Sitemap</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback Notification Alert */}
                  {seoAlert && (
                    <div
                      className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in ${
                        seoAlert.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                          : 'bg-red-50 border border-red-300 text-red-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {seoAlert.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                        <span>{seoAlert.message}</span>
                      </div>
                      <button
                        onClick={() => setSeoAlert(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* ACTIVE SEO EDITOR VIEW (If an item is being edited) */}
                  {editingSeoTarget ? (
                    <div className="bg-white rounded-xl border border-emerald-200 shadow-md p-4 sm:p-6 space-y-5 animate-fade-in">
                      {/* Editor Header Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold ${
                              editingSeoTarget.type === 'song'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {editingSeoTarget.type === 'song' ? (
                              <Disc className="w-5 h-5" />
                            ) : (
                              <FolderOpen className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                  editingSeoTarget.type === 'song'
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-blue-700 text-white'
                                }`}
                              >
                                {editingSeoTarget.type === 'song' ? 'Song Page SEO' : 'Category Page SEO'}
                              </span>
                              <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                                {editingSeoTarget.type === 'song'
                                  ? `/song/${editingSeoTarget.item.slug}`
                                  : `/category/${editingSeoTarget.item.slug}`}
                              </span>
                            </div>
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mt-0.5">
                              {editingSeoTarget.type === 'song'
                                ? editingSeoTarget.item.title
                                : editingSeoTarget.item.name}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAutoGenerateSeo}
                            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                            title="Auto-fill recommended title and description"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Auto-Generate SEO</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingSeoTarget(null)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                          >
                            Close Editor
                          </button>
                        </div>
                      </div>

                      {/* 2-Column Responsive Layout: Left Editor Form, Right Live Previews */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT COLUMN: Input Fields Form (7 cols) */}
                        <form onSubmit={handleSaveSeo} className="lg:col-span-7 space-y-4">
                          {/* 1. Meta Title */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span>SEO Meta Title</span>
                                <span className="text-[10px] text-slate-400 font-normal">(&lt;title&gt;)</span>
                              </label>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  seoFormMetaTitle.length >= 30 && seoFormMetaTitle.length <= 60
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : seoFormMetaTitle.length > 60
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {seoFormMetaTitle.length}/60 chars (Recommended: 30-60)
                              </span>
                            </div>
                            <input
                              type="text"
                              value={seoFormMetaTitle}
                              onChange={(e) => setSeoFormMetaTitle(e.target.value)}
                              placeholder={
                                editingSeoTarget.type === 'song'
                                  ? `${editingSeoTarget.item.title} (${editingSeoTarget.item.remixer}) 320 Kbps MP3 Download | DjMinu.in`
                                  : `${editingSeoTarget.item.name} MP3 Songs & DJ Remix Free Download | DjMinu.in`
                              }
                              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                              Displayed as the main clickable headline in Google search results and browser title.
                            </p>
                          </div>

                          {/* 2. Meta Description */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span>SEO Meta Description</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  (&lt;meta name="description"&gt;)
                                </span>
                              </label>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  seoFormMetaDescription.length >= 120 && seoFormMetaDescription.length <= 160
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : seoFormMetaDescription.length > 160
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {seoFormMetaDescription.length}/160 chars (Recommended: 120-160)
                              </span>
                            </div>
                            <textarea
                              rows={3}
                              value={seoFormMetaDescription}
                              onChange={(e) => setSeoFormMetaDescription(e.target.value)}
                              placeholder={
                                editingSeoTarget.type === 'song'
                                  ? `Download ${editingSeoTarget.item.title} remixed by ${editingSeoTarget.item.remixer}. Original by ${editingSeoTarget.item.originalArtist}. High Quality ${editingSeoTarget.item.bitrate} MP3 Audio, ${editingSeoTarget.item.sizeMb} MB. Free fast download.`
                                  : `Download all songs from ${editingSeoTarget.item.name}. ${editingSeoTarget.item.description}. High quality 320 Kbps MP3 music files.`
                              }
                              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                              Search engine summary snippet shown beneath the title in search engine results.
                            </p>
                          </div>

                          {/* 3. Open Graph Title */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Open Graph Title (og:title)</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setSeoFormOgTitle(seoFormMetaTitle)}
                                className="text-[10px] text-emerald-700 hover:underline font-semibold"
                              >
                                Copy From Meta Title
                              </button>
                            </div>
                            <input
                              type="text"
                              value={seoFormOgTitle}
                              onChange={(e) => setSeoFormOgTitle(e.target.value)}
                              placeholder="Leave blank to use SEO Meta Title automatically"
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Custom headline displayed when shared on WhatsApp, Facebook, iMessage, and Twitter.
                            </p>
                          </div>

                          {/* 4. Open Graph Description */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Open Graph Description (og:description)</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setSeoFormOgDescription(seoFormMetaDescription)}
                                className="text-[10px] text-emerald-700 hover:underline font-semibold"
                              >
                                Copy From Meta Description
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={seoFormOgDescription}
                              onChange={(e) => setSeoFormOgDescription(e.target.value)}
                              placeholder="Leave blank to use SEO Meta Description automatically"
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          {/* 5. Open Graph Image URL */}
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Open Graph Image URL (og:image)
                            </label>
                            <input
                              type="text"
                              value={seoFormOgImage}
                              onChange={(e) => setSeoFormOgImage(e.target.value)}
                              placeholder="https://example.com/cover.jpg or /api/images/photo.jpg"
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Recommended size: 1200x630px for high-resolution social cards.
                            </p>
                          </div>

                          {/* 6. Meta Keywords */}
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Meta Keywords & Tags</span>
                            </label>
                            <input
                              type="text"
                              value={seoFormKeywords}
                              onChange={(e) => setSeoFormKeywords(e.target.value)}
                              placeholder="320 kbps, dj remix, bhojpuri dholki, mp3 download, audio"
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              type="submit"
                              disabled={isSavingSeo}
                              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-md transition-colors flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              <span>{isSavingSeo ? 'Saving to Database...' : 'Save SEO Metadata'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSeoFormMetaTitle('');
                                setSeoFormMetaDescription('');
                                setSeoFormOgTitle('');
                                setSeoFormOgDescription('');
                                setSeoFormOgImage('');
                                setSeoFormKeywords('');
                              }}
                              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                            >
                              Reset to Default Template
                            </button>
                          </div>
                        </form>

                        {/* RIGHT COLUMN: Live Google SERP & Social Card Previews (5 cols) */}
                        <div className="lg:col-span-5 space-y-4">
                          {/* Live Google Search Snippet Card Preview */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                <Globe className="w-3.5 h-3.5 text-blue-600" />
                                <span>Google Search Snippet Preview</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">SERP Simulator</span>
                            </div>

                            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-1 text-left font-sans">
                              {/* Breadcrumb line */}
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
                                <div className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[9px] font-bold">
                                  D
                                </div>
                                <span className="font-semibold text-slate-800">DjMinu.in</span>
                                <span className="text-slate-400">›</span>
                                <span className="text-slate-500 truncate">
                                  {editingSeoTarget.type === 'song' ? 'song' : 'category'} ›{' '}
                                  {editingSeoTarget.item.slug}
                                </span>
                              </div>

                              {/* Clickable Blue Google Title */}
                              <h5 className="text-sm font-semibold text-blue-700 hover:underline leading-snug line-clamp-2 cursor-pointer">
                                {seoFormMetaTitle.trim() ||
                                  (editingSeoTarget.type === 'song'
                                    ? `${editingSeoTarget.item.title} (${editingSeoTarget.item.remixer}) 320 Kbps MP3 Download | DjMinu.in`
                                    : `${editingSeoTarget.item.name} MP3 Songs & DJ Remix Free Download | DjMinu.in`)}
                              </h5>

                              {/* Snippet Description */}
                              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                {seoFormMetaDescription.trim() ||
                                  (editingSeoTarget.type === 'song'
                                    ? `Download ${editingSeoTarget.item.title} remixed by ${editingSeoTarget.item.remixer}. Original by ${editingSeoTarget.item.originalArtist}. High Quality ${editingSeoTarget.item.bitrate} MP3 Audio, ${editingSeoTarget.item.sizeMb} MB. Free fast download.`
                                    : `Download all songs from ${editingSeoTarget.item.name}. ${editingSeoTarget.item.description}. High quality 320 Kbps MP3 music files.`)}
                              </p>
                            </div>
                          </div>

                          {/* Live Social Share Card Preview (WhatsApp / Facebook) */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp & Social Card Preview</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">OpenGraph</span>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-300 overflow-hidden shadow-2xs">
                              {/* Thumbnail preview */}
                              <div className="h-32 bg-gradient-to-r from-emerald-800 via-teal-800 to-green-900 flex items-center justify-center text-white relative overflow-hidden">
                                {seoFormOgImage ||
                                (editingSeoTarget.type === 'song' && editingSeoTarget.item.thumbnailUrl) ? (
                                  <img
                                    src={
                                      seoFormOgImage ||
                                      (editingSeoTarget.type === 'song'
                                        ? editingSeoTarget.item.thumbnailUrl
                                        : '')
                                    }
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // hide broken image
                                      (e.target as any).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="text-center p-3">
                                    <Disc className="w-8 h-8 text-yellow-300 mx-auto opacity-80" />
                                    <span className="text-xs font-black tracking-wider uppercase text-yellow-300 block mt-1">
                                      DjMinu.in · 320 Kbps HQ
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Card Content */}
                              <div className="p-3 bg-slate-50 space-y-0.5 border-t border-slate-200 text-left">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                                  DJMINU.IN
                                </span>
                                <h6 className="text-xs font-bold text-slate-900 line-clamp-1">
                                  {seoFormOgTitle.trim() ||
                                    seoFormMetaTitle.trim() ||
                                    (editingSeoTarget.type === 'song'
                                      ? editingSeoTarget.item.title
                                      : editingSeoTarget.item.name)}
                                </h6>
                                <p className="text-[11px] text-slate-500 line-clamp-2">
                                  {seoFormOgDescription.trim() ||
                                    seoFormMetaDescription.trim() ||
                                    (editingSeoTarget.type === 'song'
                                      ? `Official 320 Kbps DJ Remix by ${editingSeoTarget.item.remixer}`
                                      : editingSeoTarget.item.description)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* ALL PAGES DIRECTORY & CONTROLS */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-4">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      {/* Type Tabs */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                        <button
                          onClick={() => setSeoFilterType('all')}
                          className={`px-3 py-1 rounded transition-colors ${
                            seoFilterType === 'all'
                              ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All ({tracks.length + categories.length})
                        </button>
                        <button
                          onClick={() => setSeoFilterType('songs')}
                          className={`px-3 py-1 rounded transition-colors ${
                            seoFilterType === 'songs'
                              ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🎵 Songs ({tracks.length})
                        </button>
                        <button
                          onClick={() => setSeoFilterType('categories')}
                          className={`px-3 py-1 rounded transition-colors ${
                            seoFilterType === 'categories'
                              ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          📁 Categories ({categories.length})
                        </button>
                      </div>

                      {/* Search & Status Filters */}
                      <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={seoSearchQuery}
                            onChange={(e) => setSeoSearchQuery(e.target.value)}
                            placeholder="Filter by song, artist, folder, slug..."
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <select
                          value={seoStatusFilter}
                          onChange={(e) => setSeoStatusFilter(e.target.value as any)}
                          className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 font-semibold focus:outline-none"
                        >
                          <option value="all">All Status</option>
                          <option value="custom">✨ Custom Only</option>
                          <option value="default">⚡ Auto Defaults</option>
                        </select>
                      </div>
                    </div>

                    {/* Table of Dynamic Pages */}
                    <div className="border border-slate-200 rounded-lg overflow-x-auto">
                      <table className="w-full text-xs divide-y divide-slate-200">
                        <thead className="bg-emerald-800 text-white font-bold">
                          <tr>
                            <th className="px-3.5 py-2.5 text-left">Type & URL</th>
                            <th className="px-3.5 py-2.5 text-left">Page Title & Metadata</th>
                            <th className="px-3.5 py-2.5 text-left hidden md:table-cell">
                              SEO Status
                            </th>
                            <th className="px-3.5 py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {/* Combine and filter items */}
                          {(() => {
                            let items = [
                              ...tracks.map((t) => ({
                                type: 'song' as const,
                                item: t,
                                id: t.id,
                                title: t.title,
                                slug: t.slug,
                                urlPath: `/song/${t.slug}`,
                                metaTitle: t.metaTitle,
                                metaDescription: t.metaDescription,
                                isCustom: Boolean(t.metaTitle || t.metaDescription),
                              })),
                              ...categories.map((c) => ({
                                type: 'category' as const,
                                item: c,
                                id: c.id,
                                title: c.name,
                                slug: c.slug,
                                urlPath: `/category/${c.slug}`,
                                metaTitle: c.metaTitle,
                                metaDescription: c.metaDescription,
                                isCustom: Boolean(c.metaTitle || c.metaDescription),
                              })),
                            ];

                            if (seoFilterType === 'songs') {
                              items = items.filter((i) => i.type === 'song');
                            } else if (seoFilterType === 'categories') {
                              items = items.filter((i) => i.type === 'category');
                            }

                            if (seoStatusFilter === 'custom') {
                              items = items.filter((i) => i.isCustom);
                            } else if (seoStatusFilter === 'default') {
                              items = items.filter((i) => !i.isCustom);
                            }

                            if (seoSearchQuery.trim()) {
                              const q = seoSearchQuery.toLowerCase();
                              items = items.filter(
                                (i) =>
                                  i.title.toLowerCase().includes(q) ||
                                  i.slug.toLowerCase().includes(q) ||
                                  (i.metaTitle && i.metaTitle.toLowerCase().includes(q))
                              );
                            }

                            if (items.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={4} className="p-8 text-center text-slate-500">
                                    No pages match the search criteria.
                                  </td>
                                </tr>
                              );
                            }

                            return items.map((entry) => (
                              <tr
                                key={entry.id}
                                className={`hover:bg-emerald-50/40 transition-colors ${
                                  editingSeoTarget?.item.id === entry.id ? 'bg-emerald-50' : ''
                                }`}
                              >
                                {/* Column 1: Type & URL */}
                                <td className="px-3.5 py-2.5 max-w-[200px]">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span
                                      className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                        entry.type === 'song'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {entry.type === 'song' ? 'Song' : 'Category'}
                                    </span>
                                    <span className="font-bold text-slate-900 truncate">
                                      {entry.title}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-emerald-700 block truncate">
                                    {entry.urlPath}
                                  </span>
                                </td>

                                {/* Column 2: Meta Title & Description Preview */}
                                <td className="px-3.5 py-2.5 max-w-[280px] sm:max-w-md">
                                  <span className="font-semibold text-slate-900 block truncate">
                                    {entry.metaTitle || (
                                      <span className="text-slate-400 italic">
                                        Auto: {entry.type === 'song'
                                          ? `${(entry.item as Track).title} (${(entry.item as Track).remixer}) 320 Kbps MP3 Download | DjMinu.in`
                                          : `${(entry.item as Category).name} MP3 Songs & DJ Remix Free Download | DjMinu.in`}
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                                    {entry.metaDescription || (
                                      <span className="text-slate-400 italic">
                                        Auto: {entry.type === 'song'
                                          ? `Download ${(entry.item as Track).title} remixed by ${(entry.item as Track).remixer}. High Quality 320 Kbps MP3.`
                                          : `Download all songs from ${(entry.item as Category).name}. 320 Kbps music.`}
                                      </span>
                                    )}
                                  </span>
                                </td>

                                {/* Column 3: Status Badge */}
                                <td className="px-3.5 py-2.5 hidden md:table-cell whitespace-nowrap">
                                  {entry.isCustom ? (
                                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-emerald-600" />
                                      <span>Custom Optimized</span>
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <span>Auto Default</span>
                                    </span>
                                  )}
                                </td>

                                {/* Column 4: Actions */}
                                <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => openSeoEditor(entry)}
                                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[11px] transition-colors flex items-center gap-1"
                                    >
                                      <Edit className="w-3 h-3" />
                                      <span>Edit SEO</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        if (entry.type === 'song') {
                                          onNavigateToSong(entry.slug);
                                        } else {
                                          onNavigateToCategory(entry.slug);
                                        }
                                        onClose();
                                      }}
                                      className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded"
                                      title="Open Page"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SITEMAP & GOOGLE SEO TAB */}
              {activeTab === 'sitemap' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-green-900 text-white p-4 sm:p-5 rounded-xl shadow-sm border border-emerald-900 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-extrabold text-sm sm:text-base text-yellow-300">
                          Google Search Indexing & Firebase Live XML Sitemap: ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
                        Whenever a song or category is added, edited, or removed in the Firebase database, the sitemap service automatically regenerates <span className="font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded text-yellow-300 font-bold">/sitemap.xml</span> in real-time, ensuring Googlebot crawls all dynamically created pages without delay.
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-emerald-200">
                        <span className="bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-600/50 font-mono text-yellow-300">
                          🔥 Firebase DB: {sitemapInfo?.firebaseSync?.projectId || 'cool-tracker-35p7n'}
                        </span>
                        <span className="bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-600/50 text-emerald-300">
                          🟢 Live Watcher: Active on /tracks & /categories
                        </span>
                        <span className="bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-600/50 text-emerald-300">
                          ⚡ Priority: 1.0 Home / 0.9 Songs / 0.8 Folders
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
                      <button
                        onClick={handlePingSitemap}
                        disabled={isPingingSitemap}
                        className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPingingSitemap ? 'animate-spin' : ''}`} />
                        <span>{isPingingSitemap ? 'Pinging Google...' : 'Ping Search Engines'}</span>
                      </button>

                      <a
                        href="/sitemap.xml"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-emerald-950/70 hover:bg-emerald-950 text-white font-semibold rounded-lg text-xs border border-emerald-600/50 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View /sitemap.xml</span>
                      </a>
                    </div>
                  </div>

                  {/* Ping Feedback Alert */}
                  {pingStatusMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{pingStatusMessage}</span>
                    </div>
                  )}

                  {/* 4 Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Indexed URLs</span>
                      <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                        {1 + categories.length + tracks.filter((t) => t.status !== 'draft').length}
                      </p>
                      <span className="text-[10px] text-emerald-700 font-medium">100% Crawlable</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Song Detail Pages</span>
                      <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
                        {tracks.filter((t) => t.status !== 'draft').length}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium">Priority 0.80 - 0.90</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Category Folders</span>
                      <p className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
                        {categories.length}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium">Daily Crawl Freq</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Robots.txt Protocol</span>
                      <p className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate">
                        Sitemap Linked
                      </p>
                      <a
                        href="/robots.txt"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-700 font-bold hover:underline"
                      >
                        Open /robots.txt »
                      </a>
                    </div>
                  </div>

                  {/* Sitemap Action Quick Bar */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-slate-800">Public Sitemap Endpoints:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleCopyLink('/sitemap.xml', 'sitemap_xml')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs flex items-center gap-1"
                      >
                        {copiedSlug === 'sitemap_xml' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSlug === 'sitemap_xml' ? 'Copied XML URL!' : 'Copy /sitemap.xml'}</span>
                      </button>

                      <button
                        onClick={() => handleCopyLink('/robots.txt', 'robots_txt')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs flex items-center gap-1"
                      >
                        {copiedSlug === 'robots_txt' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSlug === 'robots_txt' ? 'Copied Robots URL!' : 'Copy /robots.txt'}</span>
                      </button>

                      <button
                        onClick={() => setShowXmlCode(!showXmlCode)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold text-xs flex items-center gap-1"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{showXmlCode ? 'Hide Raw XML' : 'View XML Code'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Raw XML Snippet Preview (Expandable) */}
                  {showXmlCode && (
                    <div className="bg-slate-900 text-emerald-300 rounded-xl p-3.5 border border-slate-800 font-mono text-[11px] overflow-x-auto max-h-56 animate-fade-in space-y-1">
                      <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800 flex justify-between">
                        <span>Dynamic XML Output Stream (/sitemap.xml)</span>
                        <span className="text-emerald-400">Google Schema Standard 0.9</span>
                      </div>
                      <pre className="whitespace-pre text-emerald-200 leading-tight">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${window.location.origin}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${categories.slice(0, 3).map(c => `  <url>
    <loc>${window.location.origin}/category/${c.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.80</priority>
  </url>`).join('\n')}
${tracks.slice(0, 3).map(t => `  <url>
    <loc>${window.location.origin}/song/${t.slug}</loc>
    <lastmod>${t.addedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>`).join('\n')}
  <!-- ... ${tracks.length + categories.length - 6} more dynamically generated URLs ... -->
</urlset>`}
                      </pre>
                    </div>
                  )}

                  {/* Searchable Table of All Currently Indexed URLs */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-2 p-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Live Indexed URL Directory ({1 + categories.length + tracks.filter((t) => t.status !== 'draft').length} URLs)</span>
                      </h5>
                      <input
                        type="text"
                        placeholder="Filter URLs or titles..."
                        value={sitemapSearch}
                        onChange={(e) => setSitemapSearch(e.target.value)}
                        className="w-full sm:w-60 p-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">URL Path</th>
                            <th className="px-3 py-2 text-left hidden sm:table-cell">Type</th>
                            <th className="px-3 py-2 text-left">Google Priority</th>
                            <th className="px-3 py-2 text-left hidden md:table-cell">Frequency</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {/* Homepage row */}
                          <tr className="hover:bg-slate-50">
                            <td className="px-3 py-1.5">
                              <span className="font-bold text-slate-900 block truncate max-w-[220px]">
                                / (Homepage)
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{window.location.origin}/</span>
                            </td>
                            <td className="px-3 py-1.5 hidden sm:table-cell">
                              <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                                Home
                              </span>
                            </td>
                            <td className="px-3 py-1.5 font-bold text-emerald-700 font-mono">1.0</td>
                            <td className="px-3 py-1.5 text-slate-500 hidden md:table-cell">Daily</td>
                            <td className="px-3 py-1.5 text-right">
                              <button
                                onClick={() => handleCopyLink('/', 'home_url')}
                                className="p-1 text-slate-500 hover:text-emerald-700 rounded"
                                title="Copy URL"
                              >
                                {copiedSlug === 'home_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>

                          {/* Categories rows */}
                          {categories
                            .filter((c) => !sitemapSearch || c.name.toLowerCase().includes(sitemapSearch.toLowerCase()) || c.slug.includes(sitemapSearch.toLowerCase()))
                            .map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-3 py-1.5">
                                  <span className="font-bold text-slate-900 block truncate max-w-[220px]">
                                    {c.name}
                                  </span>
                                  <span className="text-[10px] text-emerald-700 font-mono">/category/{c.slug}</span>
                                </td>
                                <td className="px-3 py-1.5 hidden sm:table-cell">
                                  <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                                    Folder
                                  </span>
                                </td>
                                <td className="px-3 py-1.5 font-bold text-slate-700 font-mono">
                                  {c.isHot ? '0.85' : '0.80'}
                                </td>
                                <td className="px-3 py-1.5 text-slate-500 hidden md:table-cell">Daily</td>
                                <td className="px-3 py-1.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleCopyLink(`/category/${c.slug}`, c.id)}
                                      className="p-1 text-slate-500 hover:text-emerald-700 rounded"
                                      title="Copy URL"
                                    >
                                      {copiedSlug === c.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={() => {
                                        onNavigateToCategory(c.slug);
                                        onClose();
                                      }}
                                      className="p-1 text-slate-500 hover:text-emerald-700 rounded"
                                      title="Open Page"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}

                          {/* Songs rows */}
                          {tracks
                            .filter((t) => t.status !== 'draft')
                            .filter((t) => !sitemapSearch || t.title.toLowerCase().includes(sitemapSearch.toLowerCase()) || t.slug.includes(sitemapSearch.toLowerCase()))
                            .map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50">
                                <td className="px-3 py-1.5">
                                  <span className="font-bold text-slate-900 block truncate max-w-[220px]">
                                    {t.title}
                                  </span>
                                  <span className="text-[10px] text-emerald-700 font-mono">/song/{t.slug}</span>
                                </td>
                                <td className="px-3 py-1.5 hidden sm:table-cell">
                                  <span className="bg-emerald-100 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                                    Song
                                  </span>
                                </td>
                                <td className="px-3 py-1.5 font-bold text-slate-700 font-mono">
                                  {t.isTrending || t.featured ? '0.90' : '0.80'}
                                </td>
                                <td className="px-3 py-1.5 text-slate-500 hidden md:table-cell">Weekly</td>
                                <td className="px-3 py-1.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleCopyLink(`/song/${t.slug}`, t.id)}
                                      className="p-1 text-slate-500 hover:text-emerald-700 rounded"
                                      title="Copy URL"
                                    >
                                      {copiedSlug === t.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={() => {
                                        onNavigateToSong(t.slug);
                                        onClose();
                                      }}
                                      className="p-1 text-slate-500 hover:text-emerald-700 rounded"
                                      title="Open Page"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. BROADCAST TAB */}
              {activeTab === 'broadcast' && (
                <div className="max-w-xl mx-auto bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-emerald-700" />
                      <span>Broadcast Release to All Portal Users</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sends immediate notification across all devices with instant link to the song.
                    </p>
                  </div>

                  <form onSubmit={handleBroadcastSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Notification Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="🔥 New Release: Kali Mai Bichar Karihe (Navratri DJ Remix)"
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Announcement Message *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="The official 320 Kbps roadshow club mix is now available for download!"
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Attach Song (Optional)</label>
                      <select
                        value={notifSelectedTrack}
                        onChange={(e) => setNotifSelectedTrack(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="">No specific song link</option>
                        {tracks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.remixer})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
                      >
                        <Bell className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Send Broadcast Now</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 5. STATS TAB */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Total Songs</span>
                      <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{tracks.length}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Total Hits</span>
                      <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                        {totalDownloads.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Folders / Categories</span>
                      <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{categories.length}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Dynamic Routes</span>
                      <p className="text-xl sm:text-2xl font-black text-sky-600 mt-1">{tracks.length + categories.length}</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2">
                    <h5 className="font-bold text-slate-800">Persistent Storage Engine</h5>
                    <p className="text-slate-600">
                      Audio files and metadata are saved persistently to <span className="font-mono text-emerald-800">./data/database.json</span> and <span className="font-mono text-emerald-800">./uploads/audio/</span>. Direct URL routing supports deep linking, browser back/forward, and direct browser refresh without 404 errors.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
