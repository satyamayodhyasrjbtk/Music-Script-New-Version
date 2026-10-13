import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Trash2,
  Disc,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { NotificationItem, Track } from '../types/music';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onSelectTrackNotification: (trackId: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearNotifications,
  onSelectTrackNotification,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Music Releases & Announcements</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">
            {notifications.filter((n) => !n.read).length} Unread Updates
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onMarkAllAsRead}
              className="text-amber-700 hover:text-amber-900 font-semibold text-[11px]"
            >
              Mark all read
            </button>
            <button
              onClick={onClearNotifications}
              className="text-slate-500 hover:text-rose-600 font-semibold text-[11px]"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No notifications at the moment. You're up to date with all releases!
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.trackId) {
                    onSelectTrackNotification(notif.trackId);
                    onClose();
                  }
                }}
                className={`p-3 rounded-lg transition-colors cursor-pointer ${
                  notif.read ? 'bg-white hover:bg-slate-50' : 'bg-amber-50/60 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                    )}
                    <h4 className="font-bold text-xs text-slate-900">
                      {notif.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {notif.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 pl-3.5">
                  {notif.message}
                </p>

                {notif.trackId && (
                  <div className="mt-2 pl-3.5 flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800">
                    <span>Listen / Download Song</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          Instant notifications for new DJ tracks, festival mashups, and album uploads.
        </div>
      </div>
    </div>
  );
};
