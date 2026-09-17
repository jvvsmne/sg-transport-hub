import React, { useState, useEffect, useRef } from 'react';
import { Bus, Train, MessageSquare, Bookmark, BookmarkCheck, Clock, X, Trash2, ArrowRight } from 'lucide-react';
import { BusStop, TransportMode } from '../types';

interface HeaderProps {
  activeTab: TransportMode;
  onTabChange: (tab: TransportMode) => void;
  favoriteBusStops: BusStop[];
  onSelectBusStop: (stop: BusStop) => void;
  onToggleFavoriteStop?: (stopCode: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  favoriteBusStops,
  onSelectBusStop,
  onToggleFavoriteStop,
}) => {
  const [singaporeTime, setSingaporeTime] = useState<string>('');
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Singapore clock in SGT (UTC+8)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-SG', {
        timeZone: 'Asia/Singapore',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setSingaporeTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Prevent background scrolling when modal is open and handle Escape key
  useEffect(() => {
    if (!showFavoritesModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFavoritesModal(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFavoritesModal]);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/90 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Singapore Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <span className="font-mono font-black text-base tracking-tighter">SG</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-100">
                  SG Transport Hub
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-600/30 text-red-300 border border-red-500/40">
                  LTA Data
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xs:block">
                Singapore Bus Timings &amp; MRT/LRT Network
              </p>
            </div>
          </div>

          {/* Primary Navigation Tabs: BUS, MRT/LRT & Talk to Us */}
          <nav className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
            <button
              id="tab-bus"
              onClick={() => onTabChange('bus')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'bus'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>BUS</span>
            </button>

            <button
              id="tab-mrt"
              onClick={() => onTabChange('mrt')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'mrt'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Train className="w-4 h-4" />
              <span>MRT / LRT</span>
            </button>

            <button
              id="tab-talk"
              onClick={() => onTabChange('talk')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'talk'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 ring-1 ring-purple-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Talk to Us</span>
            </button>
          </nav>

          {/* Right utility: SGT Clock & Saved Bookmarks */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Clock */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{singaporeTime || '12:00:00'}</span>
              <span className="text-[10px] text-slate-400">SGT</span>
            </div>

            {/* Saved Bookmarks Button */}
            <button
              id="btn-saved-bookmarks"
              onClick={() => setShowFavoritesModal(true)}
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="View Bookmarked Bus Stops"
              aria-label="View Bookmarked Bus Stops"
            >
              <Bookmark className="w-4 h-4 text-amber-400" />
              {favoriteBusStops.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-mono font-bold text-[10px] flex items-center justify-center ring-2 ring-slate-950">
                  {favoriteBusStops.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bookmarks Modal - Fixed Viewport Overlay with Safe Margins to Never Cut Off */}
      {showFavoritesModal && (
        <div
          id="bookmarks-modal-overlay"
          onClick={() => setShowFavoritesModal(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bookmarks-modal-title"
        >
          {/* Modal Dialog Body with Safe Max-Height and Internal Scrolling */}
          <div
            ref={modalContentRef}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-slate-900/95 border border-slate-700/80 rounded-2xl w-full max-w-lg my-auto shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] ring-1 ring-white/10"
          >
            {/* Header: Fixed top bar inside the modal dialog */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/90 bg-slate-900/90 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <BookmarkCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 id="bookmarks-modal-title" className="text-base font-bold text-slate-100">
                    Saved Bus Stops
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {favoriteBusStops.length === 1
                      ? '1 stop saved for quick tracking'
                      : `${favoriteBusStops.length} stops saved for quick tracking`}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-bookmarks-modal"
                onClick={() => setShowFavoritesModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 divide-y divide-slate-800/60 space-y-2">
              {favoriteBusStops.length === 0 ? (
                <div className="py-10 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto mb-3 text-slate-500">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">No saved bus stops yet</p>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Click the bookmark icon on any bus stop card in the Bus tab to pin it here for instant live arrival lookups.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {favoriteBusStops.map((stop) => (
                    <div
                      key={stop.id}
                      className="group p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-emerald-500/50 flex items-center justify-between gap-3 transition-all hover:bg-slate-800/40"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBusStop(stop);
                          onTabChange('bus');
                          setShowFavoritesModal(false);
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                            {stop.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-300 transition-colors">
                            {stop.name}
                          </span>
                          {stop.area && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              • {stop.area}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 truncate">{stop.road}</p>

                        {/* Services preview pill */}
                        {stop.services && stop.services.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            <span className="text-[10px] text-slate-500 font-mono">Buses:</span>
                            {stop.services.slice(0, 6).map((svc) => (
                              <span
                                key={svc.serviceNo}
                                className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300"
                              >
                                {svc.serviceNo}
                              </span>
                            ))}
                            {stop.services.length > 6 && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                +{stop.services.length - 6} more
                              </span>
                            )}
                          </div>
                        )}
                      </button>

                      {/* Right action buttons: Direct navigate & Delete bookmark */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {onToggleFavoriteStop && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavoriteStop(stop.code);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Remove from saved bookmarks"
                            aria-label={`Remove bus stop ${stop.code} from bookmarks`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectBusStop(stop);
                            onTabChange('bus');
                            setShowFavoritesModal(false);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer with Action Buttons */}
            <div className="px-5 py-3 border-t border-slate-800/90 bg-slate-900/90 rounded-b-2xl flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-slate-400">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">ESC</kbd> to close
              </span>
              <button
                id="btn-done-bookmarks-modal"
                onClick={() => setShowFavoritesModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
