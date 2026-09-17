import React, { useState, useMemo } from 'react';
import { BusStop, BusCrowdLevel, BusDeckType, NextBusInfo } from '../types';
import { BUS_AREAS } from '../data/singaporeTransportData';
import { TransportMap } from './TransportMap';
import {
  Search,
  MapPin,
  Clock,
  Users,
  Accessibility,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Compass,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';

interface BusTabProps {
  busStops: BusStop[];
  favoriteStopCodes: string[];
  onToggleFavoriteStop: (code: string) => void;
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  lastUpdatedTime: string;
}

export const BusTab: React.FC<BusTabProps> = ({
  busStops,
  favoriteStopCodes,
  onToggleFavoriteStop,
  selectedStop,
  onSelectStop,
  onRefreshData,
  isRefreshing,
  lastUpdatedTime,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('All Areas');
  const [serviceFilter, setServiceFilter] = useState('');
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');

  // Filter bus stops based on search query (name, code, road, or service number) and area
  const filteredStops = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return busStops.filter((stop) => {
      const matchesArea = selectedArea === 'All Areas' || stop.area === selectedArea;
      if (!matchesArea) return false;

      if (!query) return true;

      const matchesCode = stop.code.toLowerCase().includes(query);
      const matchesName = stop.name.toLowerCase().includes(query);
      const matchesRoad = stop.road.toLowerCase().includes(query);
      const matchesService = stop.services.some((svc) =>
        svc.serviceNo.toLowerCase().includes(query)
      );

      return matchesCode || matchesName || matchesRoad || matchesService;
    });
  }, [busStops, searchQuery, selectedArea]);

  // Current active stop
  const activeStop = selectedStop || filteredStops[0] || null;

  // Filter services within active stop
  const displayedServices = useMemo(() => {
    if (!activeStop) return [];
    if (!serviceFilter.trim()) return activeStop.services;
    const q = serviceFilter.trim().toLowerCase();
    return activeStop.services.filter(
      (s) =>
        s.serviceNo.toLowerCase().includes(q) ||
        s.destinationName.toLowerCase().includes(q)
    );
  }, [activeStop, serviceFilter]);

  // Helper for Crowd Level badges
  const renderCrowdBadge = (crowd: BusCrowdLevel) => {
    switch (crowd) {
      case 'SEA':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            title="Seats Available"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Seats Available
          </span>
        );
      case 'SDA':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"
            title="Standing Available"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Standing Available
          </span>
        );
      case 'LSD':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30"
            title="Limited Standing"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Limited Standing
          </span>
        );
    }
  };

  // Helper for Bus Deck Type
  const renderDeckBadge = (deck: BusDeckType) => {
    switch (deck) {
      case 'DD':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Double Deck
          </span>
        );
      case 'BD':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Bendy Bus
          </span>
        );
      case 'SD':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/60 text-slate-300 border border-slate-600/40">
            Single Deck
          </span>
        );
    }
  };

  // Helper for single arriving bus card
  const renderBusArrivalSlot = (label: string, bus?: NextBusInfo) => {
    if (!bus) {
      return (
        <div className="flex-1 min-w-[90px] p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase">{label}</span>
          <p className="text-xs text-slate-600 mt-1 font-medium">- -</p>
        </div>
      );
    }

    const isArr = bus.estimatedArrivalMinutes <= 0;

    return (
      <div
        className={`flex-1 min-w-[105px] p-2.5 rounded-lg border transition-all ${
          isArr
            ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{label}</span>
          {bus.wheelchairAccessible && (
            <span
              className="text-blue-400 inline-flex items-center"
              title="Wheelchair Accessible Bus (WAB)"
            >
              <Accessibility className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span
            className={`font-mono font-extrabold text-lg tracking-tight ${
              isArr ? 'text-emerald-300 animate-pulse' : 'text-slate-100'
            }`}
          >
            {isArr ? 'Arr' : `${bus.estimatedArrivalMinutes}`}
          </span>
          {!isArr && <span className="text-[11px] text-slate-400 font-medium">mins</span>}
        </div>

        <div className="flex flex-col gap-1 mt-1.5">
          <div className="scale-95 origin-left">{renderCrowdBadge(bus.crowdLevel)}</div>
          <div className="scale-90 origin-left">{renderDeckBadge(bus.deckType)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Search, Areas, Refresh & View Mode */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3.5 sm:p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-bus-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bus stop name, 5-digit code (e.g. 09048), or bus service (e.g. 190)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Area Selector Dropdown / Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <label htmlFor="select-bus-area" className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1 font-medium">
              <Compass className="w-3.5 h-3.5 text-emerald-400" /> Area:
            </label>
            <select
              id="select-bus-area"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {BUS_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            {/* Refresh Live Timings */}
            <button
              id="btn-refresh-bus-timings"
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-xl border border-slate-700 text-xs font-medium transition-colors ml-auto lg:ml-0"
              title="Refresh bus timings"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Area Chips */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-500" /> Hotspots:
          </span>
          {BUS_AREAS.slice(1).map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(selectedArea === area ? 'All Areas' : area)}
              className={`text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                selectedArea === area
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              {area.split('/')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Bus Section Grid: Left List / Right Details + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Nearby / Filtered Bus Stops */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3.5 shadow-xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Bus Stops
                </h3>
                <p className="text-[11px] text-slate-400">{filteredStops.length} stops found in Singapore</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                {selectedArea}
              </span>
            </div>

            {/* Scrollable list of stops */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredStops.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-sm text-slate-400 font-medium">No bus stops match your filter.</p>
                  <p className="text-xs text-slate-500 mt-1">Try searching for &quot;Orchard&quot;, &quot;09048&quot;, or reset area.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedArea('All Areas');
                    }}
                    className="mt-3 px-3 py-1.5 text-xs text-emerald-400 hover:underline"
                  >
                    Reset Search Filters
                  </button>
                </div>
              ) : (
                filteredStops.map((stop) => {
                  const isSelected = activeStop?.id === stop.id;
                  const isFavorited = favoriteStopCodes.includes(stop.code);

                  return (
                    <div
                      key={stop.id}
                      id={`bus-stop-card-${stop.code}`}
                      onClick={() => onSelectStop(stop)}
                      className={`group p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300">
                              {stop.code}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{stop.road}</span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-100 mt-1 group-hover:text-emerald-300 transition-colors">
                            {stop.name}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavoriteStop(stop.code);
                          }}
                          className="text-slate-500 hover:text-amber-400 p-1"
                          title={isFavorited ? 'Remove bookmark' : 'Bookmark stop'}
                        >
                          {isFavorited ? (
                            <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Services pills */}
                      <div className="flex flex-wrap items-center gap-1 mt-2.5">
                        <span className="text-[10px] text-slate-500 font-mono">Buses:</span>
                        {stop.services.map((svc) => (
                          <span
                            key={svc.serviceNo}
                            className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-900 text-slate-300 border border-slate-800 group-hover:border-slate-700"
                          >
                            {svc.serviceNo}
                          </span>
                        ))}
                      </div>

                      {stop.nearbyMrt && (
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <span>MRT: {stop.nearbyMrt}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Stop Details & Interactive Map */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Interactive Map View */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3 shadow-xl h-[330px]">
            <TransportMap
              mode="bus"
              busStops={filteredStops}
              selectedBusStop={activeStop}
              onSelectBusStop={onSelectStop}
            />
          </div>

          {/* Selected Bus Stop Live Board */}
          {activeStop ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      🚏 CODE {activeStop.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{activeStop.road}</span>
                    <span className="text-xs text-slate-500">• {activeStop.area}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-100 mt-1 flex items-center gap-2">
                    {activeStop.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-bookmark-current-stop"
                    onClick={() => onToggleFavoriteStop(activeStop.code)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    {favoriteStopCodes.includes(activeStop.code) ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                        <span className="text-amber-300">Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        <span>Save Stop</span>
                      </>
                    )}
                  </button>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Updated {lastUpdatedTime}</span>
                  </div>
                </div>
              </div>

              {/* Service Filter & Legend Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Filter Service:</span>
                  <input
                    type="text"
                    placeholder="e.g. 7, 190, Clementi"
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36"
                  />
                  {serviceFilter && (
                    <button
                      onClick={() => setServiceFilter('')}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Legend badges */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Seats
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> Standing
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span> Full
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="flex items-center gap-1">
                    <Accessibility className="w-3 h-3 text-blue-400" /> WAB
                  </span>
                </div>
              </div>

              {/* Services List with Arrival Timings */}
              <div className="divide-y divide-slate-800/80 mt-1">
                {displayedServices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No services matching &quot;{serviceFilter}&quot; at this stop.
                  </div>
                ) : (
                  displayedServices.map((service) => (
                    <div
                      key={service.serviceNo}
                      className="py-3.5 first:pt-2 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      {/* Service Identification */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-14 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex flex-col items-center justify-center text-white shadow-md">
                          <span className="text-lg font-black tracking-tight leading-none">
                            {service.serviceNo}
                          </span>
                          <span className="text-[9px] font-mono uppercase tracking-wider opacity-80 mt-0.5">
                            {service.operator}
                          </span>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span>Towards</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                          </div>
                          <div className="font-bold text-sm text-slate-100">
                            {service.destinationName}
                          </div>
                        </div>
                      </div>

                      {/* 3 Upcoming Buses: Next Bus, 2nd, 3rd */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                        {renderBusArrivalSlot('Next Bus', service.nextBus)}
                        {renderBusArrivalSlot('2nd Bus', service.subsequentBus)}
                        {renderBusArrivalSlot('3rd Bus', service.thirdBus)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-8 text-center text-slate-400">
              Select a bus stop to view arrival timings, crowd levels, and bus types.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
