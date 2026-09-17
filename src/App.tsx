/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { TransportMode, BusStop, MRTStation } from './types';
import {
  INITIAL_BUS_STOPS,
  INITIAL_MRT_STATIONS,
  TRAIN_SERVICE_ALERTS,
} from './data/singaporeTransportData';
import { Header } from './components/Header';
import { BusTab } from './components/BusTab';
import { MrtTab } from './components/MrtTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TransportMode>('bus');
  const [busStops, setBusStops] = useState<BusStop[]>(INITIAL_BUS_STOPS);
  const [mrtStations, setMrtStations] = useState<MRTStation[]>(INITIAL_MRT_STATIONS);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(INITIAL_BUS_STOPS[0]);
  const [selectedStation, setSelectedStation] = useState<MRTStation | null>(INITIAL_MRT_STATIONS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Just now');

  // Load saved favorites from localStorage
  const [favoriteStopCodes, setFavoriteStopCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_fav_bus_stops');
      return saved ? JSON.parse(saved) : ['09048', '03509'];
    } catch {
      return ['09048', '03509'];
    }
  });

  const handleToggleFavoriteStop = (code: string) => {
    setFavoriteStopCodes((prev) => {
      const updated = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code];
      try {
        localStorage.setItem('sg_fav_bus_stops', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }
      return updated;
    });
  };

  const favoriteBusStops = busStops.filter((stop) =>
    favoriteStopCodes.includes(stop.code)
  );

  // Dynamic simulation of arrival timings countdown and updates
  const handleRefreshTimings = useCallback(() => {
    setIsRefreshing(true);

    setTimeout(() => {
      // Simulate small dynamic headway adjustments
      setBusStops((prevStops) =>
        prevStops.map((stop) => ({
          ...stop,
          services: stop.services.map((svc) => {
            const nextMins = Math.max(0, svc.nextBus.estimatedArrivalMinutes - 1);
            // If bus reached 0 mins, cycle to the subsequent bus or simulate new arrival
            const isRecycling = svc.nextBus.estimatedArrivalMinutes === 0;

            return {
              ...svc,
              nextBus: isRecycling
                ? svc.subsequentBus || {
                    estimatedArrivalMinutes: 5,
                    crowdLevel: 'SEA',
                    deckType: 'DD',
                    wheelchairAccessible: true,
                  }
                : { ...svc.nextBus, estimatedArrivalMinutes: nextMins },
              subsequentBus: svc.subsequentBus
                ? {
                    ...svc.subsequentBus,
                    estimatedArrivalMinutes: Math.max(
                      nextMins + 3,
                      svc.subsequentBus.estimatedArrivalMinutes - 1
                    ),
                  }
                : undefined,
              thirdBus: svc.thirdBus
                ? {
                    ...svc.thirdBus,
                    estimatedArrivalMinutes: Math.max(
                      (svc.subsequentBus?.estimatedArrivalMinutes || 7) + 6,
                      svc.thirdBus.estimatedArrivalMinutes - 1
                    ),
                  }
                : undefined,
            };
          }),
        }))
      );

      // Also adjust MRT arrival timings
      setMrtStations((prevStations) =>
        prevStations.map((station) => ({
          ...station,
          lines: station.lines.map((line) => ({
            ...line,
            directions: line.directions.map((dir) => {
              const nextMins = Math.max(0, dir.nextTrainMinutes - 1);
              return {
                ...dir,
                nextTrainMinutes: dir.nextTrainMinutes === 0 ? 3 : nextMins,
                subsequentTrainMinutes: Math.max(
                  nextMins + 2,
                  dir.subsequentTrainMinutes - 1
                ),
              };
            }),
          })),
        }))
      );

      const now = new Date();
      setLastUpdatedTime(
        now.toLocaleTimeString('en-SG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setIsRefreshing(false);
    }, 500);
  }, []);

  // Periodic automatic sync every 45s
  useEffect(() => {
    const timer = setInterval(() => {
      handleRefreshTimings();
    }, 45000);
    return () => clearInterval(timer);
  }, [handleRefreshTimings]);

  // Keep selectedStop and selectedStation synced if lists update
  useEffect(() => {
    if (selectedStop) {
      const current = busStops.find((b) => b.id === selectedStop.id);
      if (current) setSelectedStop(current);
    }
  }, [busStops]);

  useEffect(() => {
    if (selectedStation) {
      const current = mrtStations.find((s) => s.id === selectedStation.id);
      if (current) setSelectedStation(current);
    }
  }, [mrtStations]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        favoriteBusStops={favoriteBusStops}
        onSelectBusStop={(stop) => {
          setSelectedStop(stop);
          setActiveTab('bus');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {activeTab === 'bus' ? (
          <BusTab
            busStops={busStops}
            favoriteStopCodes={favoriteStopCodes}
            onToggleFavoriteStop={handleToggleFavoriteStop}
            selectedStop={selectedStop}
            onSelectStop={setSelectedStop}
            onRefreshData={handleRefreshTimings}
            isRefreshing={isRefreshing}
            lastUpdatedTime={lastUpdatedTime}
          />
        ) : (
          <MrtTab
            mrtStations={mrtStations}
            serviceAlerts={TRAIN_SERVICE_ALERTS}
            selectedStation={selectedStation}
            onSelectStation={setSelectedStation}
            onRefreshData={handleRefreshTimings}
            isRefreshing={isRefreshing}
            lastUpdatedTime={lastUpdatedTime}
          />
        )}
      </main>

      {/* Footer info banner */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Singapore Public Transport Information Hub • Real-time Bus Arrivals, MRT Network &amp; Platform Densities
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Land Transport Authority (LTA) Specification</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">SGT Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

