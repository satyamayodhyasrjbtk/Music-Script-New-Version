import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Lock,
  Mail,
  CheckCircle2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types/music';
import { DEFAULT_USER, ADMIN_USER } from '../services/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: name.trim() || email.split('@')[0],
      email: email.trim(),
      role: email.includes('admin') ? 'admin' : 'user',
      avatarBg: 'bg-emerald-600',
      joinedDate: 'October 2026',
      totalDownloads: 0,
    };

    onLogin(newUser);
    onClose();
  };

  const handleQuickLoginUser = () => {
    onLogin(DEFAULT_USER);
    onClose();
  };

  const handleQuickLoginAdmin = () => {
    onLogin(ADMIN_USER);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">User Authentication & Account</h3>
              <p className="text-[10px] text-slate-400">OyeDjSurendra Music Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Profile Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${currentUser.avatarBg} text-white flex items-center justify-center text-sm font-bold shadow-xs`}>
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">{currentUser.name}</span>
                  <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1.5 rounded hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 1-Click Quick Demo Switch */}
        <div className="p-4 border-b border-slate-200 bg-amber-50/50">
          <span className="text-xs font-bold text-slate-800 block mb-2">
            ⚡ Quick 1-Click Switch Account:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={handleQuickLoginUser}
              className="p-2 bg-white border border-slate-300 hover:border-amber-500 rounded-lg text-left transition-colors group"
            >
              <span className="font-bold text-slate-900 block group-hover:text-amber-700">
                Listener (Guest)
              </span>
              <span className="text-[10px] text-slate-500">Regular MP3 Downloader</span>
            </button>

            <button
              onClick={handleQuickLoginAdmin}
              className="p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-left transition-colors shadow-xs"
            >
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin (DJ Surendra)
              </span>
              <span className="text-[10px] text-slate-300">Upload & Manage Songs</span>
            </button>
          </div>
        </div>

        {/* Manual Sign In / Up Form */}
        <div className="p-4">
          <div className="flex border-b border-slate-200 mb-3 text-xs font-semibold">
            <button
              onClick={() => setMode('signin')}
              className={`pb-2 px-3 border-b-2 transition-colors ${
                mode === 'signin'
                  ? 'border-amber-600 text-amber-700 font-bold'
                  : 'border-transparent text-slate-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`pb-2 px-3 border-b-2 transition-colors ${
                mode === 'signup'
                  ? 'border-amber-600 text-amber-700 font-bold'
                  : 'border-transparent text-slate-500'
              }`}
            >
              Create Free Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {mode === 'signup' && (
              <div>
                <label className="block text-slate-700 font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold transition-colors"
            >
              {mode === 'signin' ? 'Sign In to Portal' : 'Register Free Account'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          Signing in syncs your playlists and high-speed download slots across all devices.
        </div>
      </div>
    </div>
  );
};
