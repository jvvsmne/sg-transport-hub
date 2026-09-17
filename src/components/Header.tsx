import React, { useState, useEffect } from 'react';
import { Bus, Train, Bookmark, BookmarkCheck, Clock, Layers, Sparkles } from 'lucide-react';
import { BusStop } from '../types';

interface HeaderProps {
  activeTab: 'bus' | 'mrt';
  onTabChange: (tab: 'bus' | 'mrt') => void;
  favoriteBusStops: BusStop[];
  onSelectBusStop: (stop: BusStop) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  favoriteBusStops,
  onSelectBusStop,
}) => {
  const [singaporeTime, setSingaporeTime] = useState<string>('');
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

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

          {/* Primary Two Tabs: BUS & MRT/LRT */}
          <nav className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
            <button
              id="tab-bus"
              onClick={() => onTabChange('bus')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
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
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'mrt'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Train className="w-4 h-4" />
              <span>MRT / LRT</span>
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
            >
              <Bookmark className="w-4 h-4" />
              {favoriteBusStops.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-mono font-bold text-[10px] flex items-center justify-center ring-2 ring-slate-950">
                  {favoriteBusStops.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bookmarks Modal */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">Saved Bus Stops</h3>
              </div>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto space-y-2">
              {favoriteBusStops.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p>No saved bus stops yet.</p>
                  <p className="mt-1 text-slate-500">
                    Click the bookmark icon on any bus stop card to save it for rapid arrival access.
                  </p>
                </div>
              ) : (
                favoriteBusStops.map((stop) => (
                  <div
                    key={stop.id}
                    onClick={() => {
                      onSelectBusStop(stop);
                      onTabChange('bus');
                      setShowFavoritesModal(false);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {stop.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{stop.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{stop.road}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {stop.services.length} services
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
