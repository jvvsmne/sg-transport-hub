import { BusStop, BusServiceArrival, MRTStation, TrainAlert } from '../types';

export interface LtaStatusResponse {
  configured: boolean;
  source: string;
}

export async function checkLtaStatus(): Promise<LtaStatusResponse> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Failed to get status');
    return await res.json();
  } catch {
    return { configured: false, source: 'Development Fallback' };
  }
}

export async function fetchLiveBusStops(): Promise<{
  stops: BusStop[];
  isLive: boolean;
  total: number;
}> {
  const res = await fetch('/api/lta/bus-stops');
  if (!res.ok) {
    throw new Error(`Failed to fetch bus stops: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchLiveBusArrivals(
  busStopCode: string,
  serviceNo?: string
): Promise<{
  busStopCode: string;
  services: BusServiceArrival[];
  isLive: boolean;
  lastUpdated: string;
  warning?: string;
}> {
  let url = `/api/lta/bus-arrivals?busStopCode=${encodeURIComponent(busStopCode)}`;
  if (serviceNo) {
    url += `&serviceNo=${encodeURIComponent(serviceNo)}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch bus arrivals: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchLiveTrainStations(): Promise<{
  stations: MRTStation[];
  isLive: boolean;
}> {
  const res = await fetch('/api/lta/train-stations');
  if (!res.ok) {
    throw new Error(`Failed to fetch train stations: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchLiveTrainAlerts(): Promise<{
  alerts: TrainAlert[];
  isLive: boolean;
  status: number;
}> {
  const res = await fetch('/api/lta/train-alerts');
  if (!res.ok) {
    throw new Error(`Failed to fetch train alerts: ${res.statusText}`);
  }
  return await res.json();
}
