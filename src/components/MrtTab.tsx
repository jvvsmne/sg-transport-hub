import React, { useState, useMemo } from 'react';
import { MRTStation, TrainAlert } from '../types';
import { MRT_LINES, MRT_AREAS } from '../data/singaporeTransportData';
import { TransportMap } from './TransportMap';
import {
  Search,
  Train,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Compass,
  ArrowRight,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface MrtTabProps {
  mrtStations: MRTStation[];
  serviceAlerts: TrainAlert[];
  selectedStation: MRTStation | null;
  onSelectStation: (station: MRTStation) => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  lastUpdatedTime: string;
  isLiveMode?: boolean;
}

export const MrtTab: React.FC<MrtTabProps> = ({
  mrtStations,
  serviceAlerts,
  selectedStation,
  onSelectStation,
  onRefreshData,
  isRefreshing,
  lastUpdatedTime,
  isLiveMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('All Areas');
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('ALL');
  const [activeAlertModal, setActiveAlertModal] = useState<TrainAlert | null>(null);

  // Filter stations based on search query (name, station code e.g. NS24), line filter, and area
  const filteredStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return mrtStations.filter((station) => {
      // Area match
      const matchesArea = selectedArea === 'All Areas' || station.area === selectedArea;
      if (!matchesArea) return false;

      // Line filter match
      const matchesLineFilter =
        selectedLineFilter === 'ALL' ||
        station.lines.some((l) => l.lineCode === selectedLineFilter);
      if (!matchesLineFilter) return false;

      if (!query) return true;

      const matchesName = station.name.toLowerCase().includes(query);
      const matchesCode = station.lines.some((l) =>
        l.stationCode.toLowerCase().includes(query)
      );
      const matchesLineName = station.lines.some((l) => {
        const lineMeta = MRT_LINES[l.lineCode];
        return lineMeta && lineMeta.name.toLowerCase().includes(query);
      });

      return matchesName || matchesCode || matchesLineName;
    });
  }, [mrtStations, searchQuery, selectedArea, selectedLineFilter]);

  const activeStation = selectedStation || filteredStations[0] || null;

  // Render station line badge
  const renderLineBadge = (lineCode: string, stationCode: string, isLarge = false) => {
    const line = MRT_LINES[lineCode];
    if (!line) return null;

    return (
      <span
        key={stationCode}
        style={{ backgroundColor: line.color, color: line.textColor }}
        className={`font-mono font-extrabold rounded-md shadow-sm inline-flex items-center justify-center ${
          isLarge ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-xs'
        }`}
      >
        {stationCode}
      </span>
    );
  };

  // Crowd density indicator helper (uses live PCDRealTime from LTA DataMall)
  const renderCrowdGauge = (crowd: MRTStation['crowdDensity']) => {
    let colorClass = 'text-emerald-400';
    let barBg = 'bg-emerald-500';
    if (crowd.level === 'Moderate') {
      colorClass = 'text-amber-400';
      barBg = 'bg-amber-500';
    } else if (crowd.level === 'High') {
      colorClass = 'text-rose-400';
      barBg = 'bg-rose-500';
    }

    return (
      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-slate-400" /> Platform Crowd Density
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
              PCD Real-Time
            </span>
          </span>
          <span className={`text-xs font-bold ${colorClass}`}>
            {crowd.level} ({crowd.percentage}%)
          </span>
        </div>

        {/* Meter progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-1">
          <div
            className={`h-full ${barBg} transition-all duration-500 rounded-full`}
            style={{ width: `${crowd.percentage}%` }}
          ></div>
        </div>

        <p className="text-[11px] text-slate-400 mt-1 leading-tight">{crowd.description}</p>
      </div>
    );
  };

  // Check if there are active advisories
  const activeAdvisories = serviceAlerts.filter((a) => a.type !== 'normal');

  return (
    <div className="space-y-4">
      {/* Real-time Train Service Alerts Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-3.5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            {activeAdvisories.length > 0 ? (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  {activeAdvisories.length > 0
                    ? `${activeAdvisories.length} Active Train Service Advisory`
                    : 'Train Service Status: Normal Operations'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Updated {lastUpdatedTime}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                {activeAdvisories.length > 0
                  ? activeAdvisories[0].title + ' — ' + activeAdvisories[0].description
                  : 'All MRT and LRT lines operating with scheduled train frequencies across Singapore.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeAdvisories.length > 0 && (
              <button
                onClick={() => setActiveAlertModal(activeAdvisories[0])}
                className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold transition-colors"
              >
                View Advisories
              </button>
            )}

            <button
              id="btn-refresh-mrt-data"
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs font-medium transition-colors"
              title="Refresh MRT timings"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Line filters & Area */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3.5 sm:p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-mrt-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station (e.g. Dhoby Ghaut), station code (e.g. NS24, EW12), or line name..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
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

          {/* Area Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="select-mrt-area" className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1 font-medium">
              <Compass className="w-3.5 h-3.5 text-blue-400" /> Region:
            </label>
            <select
              id="select-mrt-area"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {MRT_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MRT Lines Chips Filter */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1 mr-1">
            <Train className="w-3.5 h-3.5 text-blue-400" /> Lines:
          </span>
          <button
            onClick={() => setSelectedLineFilter('ALL')}
            className={`text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-all ${
              selectedLineFilter === 'ALL'
                ? 'bg-slate-700 text-white border-slate-500 font-bold'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            All Lines
          </button>
          {Object.values(MRT_LINES).map((line) => {
            const isSelected = selectedLineFilter === line.code;
            return (
              <button
                key={line.code}
                onClick={() =>
                  setSelectedLineFilter(selectedLineFilter === line.code ? 'ALL' : line.code)
                }
                style={{
                  backgroundColor: isSelected ? line.color : 'rgba(2, 6, 23, 0.6)',
                  color: isSelected ? line.textColor : '#94a3b8',
                  borderColor: isSelected ? line.color : 'rgba(51, 65, 85, 0.8)',
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap font-mono transition-all ${
                  isSelected ? 'font-black shadow-sm ring-2 ring-white/20' : 'hover:border-slate-600'
                }`}
              >
                {line.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Stations List / Right Station Details & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Stations List */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3.5 shadow-xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <Train className="w-4 h-4 text-blue-400" />
                  Stations
                </h3>
                <p className="text-[11px] text-slate-400">
                  {filteredStations.length} MRT/LRT stations shown
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                {selectedArea}
              </span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredStations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-sm text-slate-400 font-medium">No stations found for this query.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedArea('All Areas');
                      setSelectedLineFilter('ALL');
                    }}
                    className="mt-3 px-3 py-1.5 text-xs text-blue-400 hover:underline"
                  >
                    Reset Station Filters
                  </button>
                </div>
              ) : (
                filteredStations.map((station) => {
                  const isSelected = activeStation?.id === station.id;

                  return (
                    <div
                      key={station.id}
                      id={`mrt-station-card-${station.id}`}
                      onClick={() => onSelectStation(station)}
                      className={`group p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/40 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {/* Badges for all lines */}
                          <div className="flex flex-wrap items-center gap-1">
                            {station.lines.map((l) =>
                              renderLineBadge(l.lineCode, l.stationCode)
                            )}
                            {station.isInterchange && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-amber-300 font-medium">
                                Interchange
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-slate-100 mt-1.5 group-hover:text-blue-300 transition-colors">
                            {station.name}
                          </h4>
                          <span className="text-[11px] text-slate-400">{station.area} Region</span>
                        </div>

                        {/* Crowd pill */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            station.crowdDensity.level === 'Low'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : station.crowdDensity.level === 'Moderate'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {station.crowdDensity.level}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map & Comprehensive Station Details */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Interactive Transit Map */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3 shadow-xl h-[310px]">
            <TransportMap
              mode="mrt"
              mrtStations={filteredStations}
              selectedStation={activeStation}
              onSelectStation={onSelectStation}
            />
          </div>

          {/* Selected Station Board: Organised by Line & Direction */}
          {activeStation ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
              {/* Station Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    {activeStation.lines.map((l) =>
                      renderLineBadge(l.lineCode, l.stationCode, true)
                    )}
                    {activeStation.isInterchange && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                        Interchange Station
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-slate-100">{activeStation.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeStation.area} Region • {activeStation.lines.length} Connecting Lines
                  </p>
                </div>

                {/* Crowd Density Summary Gauge */}
                <div className="w-full sm:w-64">
                  {renderCrowdGauge(activeStation.crowdDensity)}
                </div>
              </div>

              {/* Station Specific Service Alerts if applicable */}
              {serviceAlerts.some((a) =>
                a.affectedLines.some((al) =>
                  activeStation.lines.some((sl) => sl.lineCode === al)
                )
              ) && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Line Advisory: </span>
                    <span>
                      {
                        serviceAlerts.find((a) =>
                          a.affectedLines.some((al) =>
                            activeStation.lines.some((sl) => sl.lineCode === al)
                          )
                        )?.description
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Train Information Organised By Line & Direction */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Train className="w-4 h-4 text-blue-400" />
                    Platforms &amp; Train Arrival Timings
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Live Headway Data
                  </span>
                </div>

                {/* Map through each Line serving this station (Interchange separation) */}
                <div className="space-y-3">
                  {activeStation.lines.map((lineService) => {
                    const lineMeta = MRT_LINES[lineService.lineCode];
                    if (!lineMeta) return null;

                    return (
                      <div
                        key={lineService.lineCode}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden"
                      >
                        {/* Line Header Banner */}
                        <div
                          className="px-3.5 py-2 flex items-center justify-between border-b border-slate-800"
                          style={{
                            borderLeftWidth: '5px',
                            borderLeftColor: lineMeta.color,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              style={{ backgroundColor: lineMeta.color, color: lineMeta.textColor }}
                              className="px-2 py-0.5 rounded font-mono text-xs font-bold"
                            >
                              {lineService.stationCode}
                            </span>
                            <span className="font-bold text-sm text-slate-200">
                              {lineMeta.name}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
                            First: {lineService.firstTrainWeekday} | Last: {lineService.lastTrainWeekday}
                          </div>
                        </div>

                        {/* Directions & Platforms */}
                        <div className="p-3 divide-y divide-slate-800/60">
                          {lineService.directions.map((dir, idx) => {
                            const isArrNext = dir.nextTrainMinutes <= 0;

                            return (
                              <div
                                key={idx}
                                className="py-2.5 first:pt-1 last:pb-1 flex flex-col md:flex-row md:items-center justify-between gap-3"
                              >
                                <div className="min-w-[220px]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                      {dir.platform}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-sm text-slate-100 mt-1 flex items-center gap-1.5">
                                    <span>{dir.destination}</span>
                                  </div>
                                </div>

                                {/* Arrival Timings */}
                                <div className="flex items-center gap-2.5">
                                  {/* Next Train */}
                                  <div
                                    className={`px-3 py-2 rounded-xl border flex items-center gap-3 ${
                                      isArrNext
                                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                        : 'bg-slate-900 border-slate-800 text-slate-200'
                                    }`}
                                  >
                                    <div>
                                      <div className="text-[9px] uppercase tracking-wider font-mono text-slate-400 flex items-center gap-1">
                                        <span>Next Train</span>
                                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-800 text-blue-300">GTFS</span>
                                      </div>
                                      <div className="text-base font-extrabold font-mono leading-none mt-0.5">
                                        {isArrNext ? (
                                          <span className="animate-pulse">Arr</span>
                                        ) : (
                                          `${dir.nextTrainMinutes} min`
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subsequent Train */}
                                  <div className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 flex items-center gap-3">
                                    <div>
                                      <div className="text-[9px] uppercase tracking-wider font-mono text-slate-500">
                                        Following
                                      </div>
                                      <div className="text-sm font-bold font-mono leading-none mt-0.5 text-slate-200">
                                        {dir.subsequentTrainMinutes} min
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Station Facilities */}
              {activeStation.facilities && activeStation.facilities.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
                    Station Amenities &amp; Connections:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeStation.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                      >
                        ✓ {fac}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-8 text-center text-slate-400">
              Select an MRT/LRT station to inspect lines, directions, platform arrivals, and crowd density.
            </div>
          )}
        </div>
      </div>

      {/* Advisory Modal */}
      {activeAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">Train Service Advisory</h3>
              </div>
              <button
                onClick={() => setActiveAlertModal(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="font-bold text-slate-200">{activeAlertModal.title}</h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">Updated {activeAlertModal.updatedAt}</p>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                {activeAlertModal.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-xs text-slate-400">Affected Lines:</span>
              {activeAlertModal.affectedLines.map((l) => (
                <span
                  key={l}
                  style={{
                    backgroundColor: MRT_LINES[l]?.color || '#334155',
                    color: MRT_LINES[l]?.textColor || '#FFFFFF',
                  }}
                  className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                >
                  {l}
                </span>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveAlertModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
