import React, { useState } from 'react';
import {
  X,
  Layers,
  Plus,
  Play,
  Trash2,
  Music,
  Check,
  Disc,
} from 'lucide-react';
import { Playlist, Track } from '../types/music';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  allTracks: Track[];
  onPlayPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: (name: string, description: string) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  selectedTrackToAdd?: Track | null;
  onAddTrackToPlaylist?: (playlistId: string, trackId: string) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  playlists,
  allTracks,
  onPlayPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  selectedTrackToAdd,
  onAddTrackToPlaylist,
}) => {
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(
    playlists[0]?.id || null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreatePlaylist(newName.trim(), newDesc.trim() || 'Custom DJ playlist');
    setNewName('');
    setNewDesc('');
    setIsCreating(false);
  };

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0];
  const activeTracks = activePlaylist
    ? allTracks.filter((t) => activePlaylist.trackIds.includes(t.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full h-[80vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">
              {selectedTrackToAdd
                ? `Add "${selectedTrackToAdd.title}" to Playlist`
                : 'My DJ Playlists'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Playlists List */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">
                Playlists ({playlists.length})
              </span>
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Create Form inline */}
            {isCreating && (
              <form onSubmit={handleCreate} className="p-3 bg-white border-b border-slate-200 space-y-2">
                <input
                  type="text"
                  placeholder="Playlist name (e.g. Bass Drops)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Short description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {playlists.map((pl) => {
                const isSelected = activePlaylist?.id === pl.id;
                const alreadyContainsTrack =
                  selectedTrackToAdd && pl.trackIds.includes(selectedTrackToAdd.id);

                return (
                  <div
                    key={pl.id}
                    onClick={() => {
                      if (selectedTrackToAdd && onAddTrackToPlaylist) {
                        onAddTrackToPlaylist(pl.id, selectedTrackToAdd.id);
                        onClose();
                      } else {
                        setActivePlaylistId(pl.id);
                      }
                    }}
                    className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-amber-100/70 border-l-3 border-amber-600' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-xs text-slate-900 truncate">{pl.name}</p>
                      <p className="text-[11px] text-slate-500">{pl.trackIds.length} Tracks</p>
                    </div>

                    {selectedTrackToAdd ? (
                      alreadyContainsTrack ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Added
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded font-bold">
                          + Add
                        </span>
                      )
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete playlist "${pl.name}"?`)) {
                            onDeletePlaylist(pl.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete Playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Main: Active Playlist Details & Songs */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {activePlaylist ? (
              <>
                {/* Header of Active Playlist */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{activePlaylist.name}</h4>
                    <p className="text-xs text-slate-500">{activePlaylist.description}</p>
                  </div>

                  {activeTracks.length > 0 && (
                    <button
                      onClick={() => {
                        onPlayPlaylist(activePlaylist);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                      <span>Play All ({activeTracks.length})</span>
                    </button>
                  )}
                </div>

                {/* Tracks in Playlist */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
                  {activeTracks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      This playlist is currently empty. Add tracks from the main music table using the (+) button!
                    </div>
                  ) : (
                    activeTracks.map((trk, i) => (
                      <div
                        key={trk.id}
                        className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-slate-400 font-mono w-5">{i + 1}.</span>
                          <Disc className="w-4 h-4 text-amber-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{trk.title}</p>
                            <p className="text-[10px] text-slate-500">
                              {trk.remixer} · {trk.bitrate} · {trk.sizeMb} MB
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveTrackFromPlaylist(activePlaylist.id, trk.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove from playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                No playlist selected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
