import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RotateCcw } from 'lucide-react';
import { BusStop, MRTStation } from '../types';
import { MRT_LINES } from '../data/singaporeTransportData';

interface TransportMapProps {
  mode: 'bus' | 'mrt';
  busStops?: BusStop[];
  mrtStations?: MRTStation[];
  selectedBusStop?: BusStop | null;
  selectedStation?: MRTStation | null;
  onSelectBusStop?: (stop: BusStop) => void;
  onSelectStation?: (station: MRTStation) => void;
}

export const TransportMap: React.FC<TransportMapProps> = ({
  mode,
  busStops = [],
  mrtStations = [],
  selectedBusStop,
  selectedStation,
  onSelectBusStop,
  onSelectStation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Singapore center coordinates: 1.3521, 103.8198
      const map = L.map(mapContainerRef.current, {
        center: [1.3321, 103.8298],
        zoom: 12,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: false,
      });

      // CartoDB Dark Matter tiles for sleek, high-contrast dark theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      linesLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers and Lines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const linesLayer = linesLayerRef.current;
    if (!map || !markersLayer || !linesLayer) return;

    markersLayer.clearLayers();
    linesLayer.clearLayers();

    if (mode === 'bus') {
      busStops.forEach((stop) => {
        const isSelected = selectedBusStop?.id === stop.id;
        const iconHtml = `
          <div class="relative cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 ${
              isSelected
                ? 'bg-emerald-500 border-white text-white ring-4 ring-emerald-400/40 animate-pulse'
                : 'bg-slate-900 border-emerald-400 text-emerald-300'
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 6v6"/>
                <path d="M15 6v6"/>
                <path d="M2 12h19.6"/>
                <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-3.3-2.7-6-6-6H7c-3.3 0-6 2.7-6 6 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/>
                <circle cx="7" cy="18" r="2"/>
                <circle cx="17" cy="18" r="2"/>
              </svg>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono font-bold text-slate-200 pointer-events-none shadow">
              ${stop.code}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-bus-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([stop.lat, stop.lng], { icon: customIcon });
        marker.on('click', () => {
          if (onSelectBusStop) {
            onSelectBusStop(stop);
          }
        });

        const popupContent = `
          <div class="p-1 max-w-[200px]">
            <div class="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
              <span>🚏 ${stop.code}</span>
            </div>
            <div class="font-bold text-sm text-slate-100 mt-0.5">${stop.name}</div>
            <div class="text-xs text-slate-400">${stop.road}</div>
            <div class="mt-2 text-[11px] text-slate-300">
              Services: <strong class="text-emerald-300">${stop.services.map(s => s.serviceNo).join(', ')}</strong>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
      });

      if (selectedBusStop) {
        map.panTo([selectedBusStop.lat, selectedBusStop.lng], { animate: true });
      }
    } else {
      // MRT Mode: Draw network connections and stations
      // Connect key stations along lines for visual representation
      const linePolylines: { [lineCode: string]: [number, number][] } = {
        NSL: [
          [1.3331, 103.7423], // Jurong East
          [1.4370, 103.7865], // Woodlands
          [1.3508, 103.8481], // Bishan
          [1.3040, 103.8318], // Orchard
          [1.2989, 103.8463], // Dhoby Ghaut
          [1.2764, 103.8545], // Marina Bay
        ],
        EWL: [
          [1.3331, 103.7423], // Jurong East
          [1.2804, 103.8395], // Outram Park
          [1.3006, 103.8560], // Bugis
          [1.3178, 103.8924], // Paya Lebar
          [1.3533, 103.9452], // Tampines
          [1.3574, 103.9886], // Changi Airport
        ],
        NEL: [
          [1.2654, 103.8215], // HarbourFront
          [1.2804, 103.8395], // Outram Park
          [1.2989, 103.8463], // Dhoby Ghaut
          [1.3499, 103.8735], // Serangoon
          [1.4050, 103.9023], // Punggol
        ],
        CCL: [
          [1.2989, 103.8463], // Dhoby Ghaut
          [1.2764, 103.8545], // Marina Bay
          [1.3178, 103.8924], // Paya Lebar
          [1.3499, 103.8735], // Serangoon
          [1.3508, 103.8481], // Bishan
          [1.2654, 103.8215], // HarbourFront
        ],
        TEL: [
          [1.4370, 103.7865], // Woodlands
          [1.3040, 103.8318], // Orchard
          [1.2804, 103.8395], // Outram Park
          [1.2764, 103.8545], // Marina Bay
        ],
        DTL: [
          [1.3789, 103.7621], // Bukit Panjang
          [1.3006, 103.8560], // Bugis
          [1.3533, 103.9452], // Tampines
        ],
      };

      Object.entries(linePolylines).forEach(([lineKey, coords]) => {
        const lineMeta = MRT_LINES[lineKey];
        if (!lineMeta) return;

        const polyline = L.polyline(coords, {
          color: lineMeta.color,
          weight: 4,
          opacity: 0.85,
          dashArray: lineKey.includes('LRT') ? '6, 6' : undefined,
          lineJoin: 'round',
        });
        linesLayer.addLayer(polyline);
      });

      // Add MRT Station Nodes
      mrtStations.forEach((station) => {
        const isSelected = selectedStation?.id === station.id;
        const primaryLine = station.lines[0]?.lineCode || 'NSL';
        const primaryColor = MRT_LINES[primaryLine]?.color || '#009645';

        const lineBadges = station.lines
          .map(
            (l) =>
              `<span style="background-color: ${MRT_LINES[l.lineCode]?.color}; color: ${MRT_LINES[l.lineCode]?.textColor}" class="px-1 py-0.5 rounded text-[9px] font-bold font-mono">${l.stationCode}</span>`
          )
          .join('');

        const iconHtml = `
          <div class="relative cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-130 z-50' : 'hover:scale-115'}">
            <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-xl border-2 ${
              isSelected
                ? 'ring-4 ring-amber-400 bg-white border-slate-900 animate-pulse'
                : 'bg-slate-950 border-white text-white'
            }">
              <div class="w-3.5 h-3.5 rounded-full" style="background-color: ${primaryColor}"></div>
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 whitespace-nowrap pointer-events-none drop-shadow">
              ${lineBadges}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-mrt-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([station.lat, station.lng], { icon: customIcon });
        marker.on('click', () => {
          if (onSelectStation) {
            onSelectStation(station);
          }
        });

        const popupContent = `
          <div class="p-1 max-w-[220px]">
            <div class="flex items-center gap-1 mb-1">
              ${station.lines
                .map(
                  (l) =>
                    `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style="background:${MRT_LINES[l.lineCode]?.color}; color:${MRT_LINES[l.lineCode]?.textColor}">${l.stationCode}</span>`
                )
                .join(' ')}
            </div>
            <div class="font-bold text-sm text-slate-100">${station.name}</div>
            <div class="text-xs text-slate-400">${station.area} Region ${station.isInterchange ? '• Interchange' : ''}</div>
            <div class="mt-2 text-xs">
              <span class="text-slate-300">Platform Crowd:</span>
              <strong class="${
                station.crowdDensity.level === 'Low'
                  ? 'text-emerald-400'
                  : station.crowdDensity.level === 'Moderate'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }">${station.crowdDensity.level} (${station.crowdDensity.percentage}%)</strong>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
      });

      if (selectedStation) {
        map.panTo([selectedStation.lat, selectedStation.lng], { animate: true });
      }
    }
  }, [mode, busStops, mrtStations, selectedBusStop, selectedStation, onSelectBusStop, onSelectStation]);

  const handleRecenterSingapore = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([1.3421, 103.8298], 12, { animate: true });
    }
  };

  return (
    <div id="transport-interactive-map" className="relative w-full h-full min-h-[340px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '340px' }} />

      {/* Floating Map Controls & Badges */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{mode === 'bus' ? `${busStops.length} Bus Stops Visible` : `${mrtStations.length} Stations & Rail Lines`}</span>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
        <button
          id="btn-recenter-map"
          onClick={handleRecenterSingapore}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-medium shadow-lg transition-colors flex items-center gap-1.5"
          title="Reset view to Singapore"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset View
        </button>
      </div>

      {/* Mode legend indicator */}
      <div className="absolute bottom-3 left-3 z-[400] hidden sm:flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 shadow">
        {mode === 'bus' ? (
          <>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Bus Stop</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Click marker to inspect arrival times</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> NSL</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> EWL</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> NEL</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> CCL</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> DTL</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#9D5B25]"></span> TEL</span>
          </>
        )}
      </div>
    </div>
  );
};
