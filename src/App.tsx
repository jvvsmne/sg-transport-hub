/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TransportMode, BusStop, MRTStation, TrainAlert } from './types';
import {
  INITIAL_BUS_STOPS,
  INITIAL_MRT_STATIONS,
  TRAIN_SERVICE_ALERTS,
} from './data/singaporeTransportData';
import { Header } from './components/Header';
import { BusTab } from './components/BusTab';
import { MrtTab } from './components/MrtTab';
import {
  checkLtaStatus,
  fetchLiveBusStops,
  fetchLiveBusArrivals,
  fetchLiveTrainStations,
  fetchLiveTrainAlerts,
} from './services/apiClient';

export default function App() {
  const [activeTab, setActiveTab] = useState<TransportMode>('bus');
  const [busStops, setBusStops] = useState<BusStop[]>(INITIAL_BUS_STOPS);
  const [mrtStations, setMrtStations] = useState<MRTStation[]>(INITIAL_MRT_STATIONS);
  const [serviceAlerts, setServiceAlerts] = useState<TrainAlert[]>(TRAIN_SERVICE_ALERTS);

  const [selectedStop, setSelectedStop] = useState<BusStop | null>(INITIAL_BUS_STOPS[0]);
  const [selectedStation, setSelectedStation] = useState<MRTStation | null>(INITIAL_MRT_STATIONS[0]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingArrivals, setIsLoadingArrivals] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Just now');
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Ref to track current selected stop code for async arrivals fetch
  const selectedStopCodeRef = useRef<string | null>(INITIAL_BUS_STOPS[0]?.code || null);

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

  /**
   * Fetch real-time arrivals for a specific bus stop code
   */
  const loadLiveBusArrivals = useCallback(async (stopCode: string) => {
    setIsLoadingArrivals(true);
    try {
      const arrivalData = await fetchLiveBusArrivals(stopCode);
      if (arrivalData && arrivalData.services) {
        // Update both the selectedStop and the busStops list
        setBusStops((prev) =>
          prev.map((stop) => {
            if (stop.code === stopCode) {
              return {
                ...stop,
                services: arrivalData.services,
              };
            }
            return stop;
          })
        );

        setSelectedStop((prev) => {
          if (prev && prev.code === stopCode) {
            return {
              ...prev,
              services: arrivalData.services,
            };
          }
          return prev;
        });

        if (arrivalData.isLive) {
          setIsLiveMode(true);
        }
      }
    } catch (err) {
      console.warn(`Could not load live arrivals for stop ${stopCode}:`, err);
    } finally {
      setIsLoadingArrivals(false);
    }
  }, []);

  /**
   * Initial data bootstrap: check status, load bus stops, stations, and alerts
   */
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      try {
        const status = await checkLtaStatus();
        if (isMounted && status.configured) {
          setIsLiveMode(true);
        }

        // Fetch stops, stations and alerts in parallel
        const [stopsResult, stationsResult, alertsResult] = await Promise.allSettled([
          fetchLiveBusStops(),
          fetchLiveTrainStations(),
          fetchLiveTrainAlerts(),
        ]);

        if (isMounted) {
          if (stopsResult.status === 'fulfilled' && stopsResult.value.stops.length > 0) {
            setBusStops(stopsResult.value.stops);
            if (stopsResult.value.isLive) setIsLiveMode(true);

            // Select the first stop or preserve current
            const firstStop = stopsResult.value.stops[0];
            setSelectedStop((prev) => prev || firstStop);
            selectedStopCodeRef.current = firstStop?.code || null;
            if (firstStop?.code) {
              loadLiveBusArrivals(firstStop.code);
            }
          }

          if (stationsResult.status === 'fulfilled' && stationsResult.value.stations.length > 0) {
            setMrtStations(stationsResult.value.stations);
            setSelectedStation((prev) => prev || stationsResult.value.stations[0]);
          }

          if (alertsResult.status === 'fulfilled' && alertsResult.value.alerts.length > 0) {
            setServiceAlerts(alertsResult.value.alerts);
          }

          const now = new Date();
          setLastUpdatedTime(
            now.toLocaleTimeString('en-SG', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })
          );
        }
      } catch (err) {
        console.warn('Initial data load error:', err);
      }
    }

    initData();

    return () => {
      isMounted = false;
    };
  }, [loadLiveBusArrivals]);

  /**
   * User selects a bus stop
   */
  const handleSelectBusStop = useCallback(
    (stop: BusStop) => {
      setSelectedStop(stop);
      selectedStopCodeRef.current = stop.code;
      loadLiveBusArrivals(stop.code);
    },
    [loadLiveBusArrivals]
  );

  /**
   * User manual refresh or periodic sync
   */
  const handleRefreshTimings = useCallback(async () => {
    setIsRefreshing(true);

    try {
      if (activeTab === 'bus' && selectedStopCodeRef.current) {
        await loadLiveBusArrivals(selectedStopCodeRef.current);
      } else if (activeTab === 'mrt') {
        const [stationsRes, alertsRes] = await Promise.allSettled([
          fetchLiveTrainStations(),
          fetchLiveTrainAlerts(),
        ]);
        if (stationsRes.status === 'fulfilled' && stationsRes.value.stations.length > 0) {
          setMrtStations(stationsRes.value.stations);
        }
        if (alertsRes.status === 'fulfilled' && alertsRes.value.alerts.length > 0) {
          setServiceAlerts(alertsRes.value.alerts);
        }
      }

      const now = new Date();
      setLastUpdatedTime(
        now.toLocaleTimeString('en-SG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeTab, loadLiveBusArrivals]);

  // Periodic automatic sync every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      handleRefreshTimings();
    }, 30000);
    return () => clearInterval(timer);
  }, [handleRefreshTimings]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        favoriteBusStops={favoriteBusStops}
        onToggleFavoriteStop={handleToggleFavoriteStop}
        onSelectBusStop={(stop) => {
          handleSelectBusStop(stop);
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
            onSelectStop={handleSelectBusStop}
            onRefreshData={handleRefreshTimings}
            isRefreshing={isRefreshing}
            lastUpdatedTime={lastUpdatedTime}
            isLoadingArrivals={isLoadingArrivals}
            isLiveMode={isLiveMode}
          />
        ) : (
          <MrtTab
            mrtStations={mrtStations}
            serviceAlerts={serviceAlerts}
            selectedStation={selectedStation}
            onSelectStation={setSelectedStation}
            onRefreshData={handleRefreshTimings}
            isRefreshing={isRefreshing}
            lastUpdatedTime={lastUpdatedTime}
            isLiveMode={isLiveMode}
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
            <span>Land Transport Authority (LTA) DataMall</span>
            <span>•</span>
            <span className={`font-mono flex items-center gap-1.5 ${isLiveMode ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {isLiveMode ? 'LTA DataMall Live' : 'SGT Ready'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
