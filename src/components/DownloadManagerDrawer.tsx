import React from 'react';
import {
  X,
  Download,
  CheckCircle2,
  Pause,
  Play,
  Trash2,
  HardDrive,
  FileAudio,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { DownloadTask, Track } from '../types/music';

interface DownloadManagerDrawerProps {
  tasks: DownloadTask[];
  isOpen: boolean;
  onClose: () => void;
  onPauseTask: (id: string) => void;
  onResumeTask: (id: string) => void;
  onCancelTask: (id: string) => void;
  onClearCompleted: () => void;
  onPlayDownloadedTrack: (trackId: string) => void;
}

export const DownloadManagerDrawer: React.FC<DownloadManagerDrawerProps> = ({
  tasks,
  isOpen,
  onClose,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onClearCompleted,
  onPlayDownloadedTrack,
}) => {
  if (!isOpen) return null;

  const activeTasks = tasks.filter((t) => t.status === 'downloading' || t.status === 'paused');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">High-Speed Download Manager</h3>
              <p className="text-[10px] text-slate-400">Direct CDN Audio Acceleration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Speed Stats Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-semibold">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Active Queue: {activeTasks.length} Files</span>
          </div>
          <span className="font-mono text-[11px] text-amber-800">
            CDN Speed: ~18.5 MB/s
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Queue */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>In Progress ({activeTasks.length})</span>
            </h4>

            {activeTasks.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 text-center text-xs text-slate-500">
                No active downloads right now. Click "Download" on any song to start!
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {task.trackTitle}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Format: MP3 {task.quality} · {task.sizeMb} MB
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        {task.status === 'downloading' ? (
                          <button
                            onClick={() => onPauseTask(task.id)}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                            title="Pause"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onResumeTask(task.id)}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                            title="Resume"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onCancelTask(task.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                          title="Cancel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{task.progress}% Completed</span>
                        <span>{task.status === 'paused' ? 'Paused' : `${task.speedMb.toFixed(1)} MB/s`}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Downloads */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Completed ({completedTasks.length})
              </h4>
              {completedTasks.length > 0 && (
                <button
                  onClick={onClearCompleted}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                >
                  Clear History
                </button>
              )}
            </div>

            {completedTasks.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-xs text-slate-500">
                Downloaded files will appear here for easy playback and file management.
              </div>
            ) : (
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 truncate">
                          {task.trackTitle}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {task.quality} · {task.sizeMb} MB · Saved
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onPlayDownloadedTrack(task.trackId)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-[11px] shrink-0"
                    >
                      Play
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          Files are automatically saved to your browser downloads folder with full ID3 metadata.
        </div>
      </div>
    </div>
  );
};
