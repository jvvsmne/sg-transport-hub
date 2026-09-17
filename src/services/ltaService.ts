import { BusStop, BusServiceArrival, NextBusInfo, MRTStation, TrainAlert } from '../types';
import { INITIAL_BUS_STOPS, INITIAL_MRT_STATIONS, TRAIN_SERVICE_ALERTS } from '../data/singaporeTransportData';

const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

// Known major interchanges for resolving destination codes
const DESTINATION_NAMES: Record<string, string> = {
  '02099': 'Clementi Int',
  '03009': 'Marina Ctr Ter',
  '03211': 'Shenton Way Ter',
  '03239': 'Marina Bay Stn',
  '04179': 'Clarke Quay Stn',
  '05009': 'New Bridge Rd Ter',
  '08009': 'HarbourFront Int',
  '09048': 'Orchard Rd',
  '10009': 'Bukit Merah Int',
  '11009': 'Queenstown Stn',
  '16009': 'Bukit Merah Int',
  '17009': 'Ghim Moh Ter',
  '22009': 'Boon Lay Int',
  '28009': 'Jurong East Int',
  '43009': 'Bukit Batok Int',
  '44009': 'Choa Chu Kang Int',
  '46009': 'Woodlands Int',
  '48009': 'Sembawang Int',
  '52009': 'Bishan Int',
  '53009': 'Serangoon Int',
  '54009': 'Ang Mo Kio Int',
  '55009': 'Yio Chu Kang Int',
  '64009': 'Punggol Temp Int',
  '65009': 'Sengkang Int',
  '66009': 'Hougang Central Int',
  '75009': 'Tampines Int',
  '76009': 'Tampines Concourse Int',
  '77009': 'Changi Airport PTB2',
  '84009': 'Bedok Int',
  '95009': 'Changi Village Ter',
};

// In-memory cache for stops to keep responses snappy
let cachedBusStops: BusStop[] | null = null;
let lastStopsFetchTime = 0;
const STOPS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// In-memory cache for PCD crowd density
let cachedCrowdDensity: Record<string, { level: 'Low' | 'Moderate' | 'High'; percentage: number; description: string }> = {};
let lastCrowdFetchTime = 0;
const CROWD_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getAccountKey(): string | null {
  const key = process.env.LTA_ACCOUNT_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getLtaStatus() {
  const key = getAccountKey();
  return {
    configured: !!key,
    source: key ? 'LTA DataMall Live API' : 'Development Fallback (LTA_ACCOUNT_KEY not set)',
  };
}

/**
 * Categorize bus stop coordinate into Singapore planning regions
 */
function determineArea(lat: number, lng: number, road: string): string {
  const r = road.toLowerCase();
  if (r.includes('orchard') || r.includes('somerset') || r.includes('scotts') || r.includes('tanglin')) {
    return 'Central / Orchard';
  }
  if (r.includes('marina') || r.includes('raffles') || r.includes('shenton') || r.includes('robinson') || r.includes('collyer') || r.includes('anjer')) {
    return 'CBD / Marina Bay';
  }
  if (r.includes('victoria') || r.includes('bras basah') || r.includes('bugis') || r.includes('beach rd') || r.includes('north bridge')) {
    return 'Bugis / Bras Basah';
  }
  if (r.includes('jurong') || r.includes('clementi') || r.includes('boon lay') || r.includes('west coast')) {
    return 'Jurong / Clementi';
  }
  if (r.includes('woodlands') || r.includes('marsiling') || r.includes('sembawang') || r.includes('yishun')) {
    return 'Woodlands / North';
  }
  if (r.includes('tampines') || r.includes('pasir ris') || r.includes('simei') || r.includes('changi')) {
    return 'Tampines / East';
  }
  if (r.includes('bedok') || r.includes('marine parade') || r.includes('east coast') || r.includes('geylang')) {
    return 'Bedok / Marine Parade';
  }
  if (r.includes('bishan') || r.includes('ang mo kio') || r.includes('toa payoh') || r.includes('marymount')) {
    return 'Ang Mo Kio / Bishan';
  }

  // Geographic bounds
  if (lat >= 1.28 && lat <= 1.30 && lng >= 103.84 && lng <= 103.865) return 'CBD / Marina Bay';
  if (lat >= 1.30 && lat <= 1.315 && lng >= 103.82 && lng <= 103.842) return 'Central / Orchard';
  if (lat >= 1.295 && lat <= 1.31 && lng >= 103.85 && lng <= 103.865) return 'Bugis / Bras Basah';
  if (lng < 103.78) return 'Jurong / Clementi';
  if (lat > 1.40) return 'Woodlands / North';
  if (lng > 103.92) return 'Tampines / East';
  if (lng > 103.89) return 'Bedok / Marine Parade';
  if (lat > 1.34 && lng >= 103.83 && lng <= 103.87) return 'Ang Mo Kio / Bishan';

  return 'Central / Orchard';
}

/**
 * Fetch all bus stops from LTA DataMall
 */
export async function getLiveBusStops(): Promise<{ stops: BusStop[]; isLive: boolean; total: number }> {
  const accountKey = getAccountKey();

  if (!accountKey) {
    return {
      stops: INITIAL_BUS_STOPS,
      isLive: false,
      total: INITIAL_BUS_STOPS.length,
    };
  }

  const now = Date.now();
  if (cachedBusStops && now - lastStopsFetchTime < STOPS_CACHE_TTL) {
    return {
      stops: cachedBusStops,
      isLive: true,
      total: cachedBusStops.length,
    };
  }

  try {
    // Fetch up to 1000 stops (pages $skip=0 and $skip=500)
    const [resPage0, resPage1] = await Promise.all([
      fetch(`${LTA_BASE_URL}/BusStops?$skip=0`, {
        headers: { AccountKey: accountKey, accept: 'application/json' },
      }),
      fetch(`${LTA_BASE_URL}/BusStops?$skip=500`, {
        headers: { AccountKey: accountKey, accept: 'application/json' },
      }),
    ]);

    if (!resPage0.ok) {
      throw new Error(`LTA BusStops API returned ${resPage0.status} ${resPage0.statusText}`);
    }

    const json0: any = await resPage0.json();
    const json1: any = resPage1.ok ? await resPage1.json() : { value: [] };

    const rawStops = [...(json0.value || []), ...(json1.value || [])];

    if (!rawStops.length) {
      return { stops: INITIAL_BUS_STOPS, isLive: false, total: INITIAL_BUS_STOPS.length };
    }

    // Merge with known services template so stop cards have realistic default structure until arrival is tapped
    const initialMap = new Map(INITIAL_BUS_STOPS.map((s) => [s.code, s]));

    const parsedStops: BusStop[] = rawStops.map((r: any) => {
      const code = String(r.BusStopCode).padStart(5, '0');
      const road = r.RoadName || '';
      const name = r.Description || `Bus Stop ${code}`;
      const lat = Number(r.Latitude);
      const lng = Number(r.Longitude);
      const area = determineArea(lat, lng, road);

      const existing = initialMap.get(code);

      return {
        id: code,
        code,
        name,
        road,
        area,
        lat,
        lng,
        nearbyMrt: existing?.nearbyMrt,
        services: existing?.services || [],
      };
    });

    // Make sure our featured stops are preserved in the list
    for (const initStop of INITIAL_BUS_STOPS) {
      if (!parsedStops.some((s) => s.code === initStop.code)) {
        parsedStops.unshift(initStop);
      }
    }

    cachedBusStops = parsedStops;
    lastStopsFetchTime = now;

    return {
      stops: parsedStops,
      isLive: true,
      total: parsedStops.length,
    };
  } catch (err: any) {
    console.error('Error fetching live bus stops from LTA DataMall:', err);
    return {
      stops: INITIAL_BUS_STOPS,
      isLive: false,
      total: INITIAL_BUS_STOPS.length,
    };
  }
}

/**
 * Format single LTA next bus object into NextBusInfo
 */
function parseNextBus(nextBusRaw: any): NextBusInfo | null {
  if (!nextBusRaw || !nextBusRaw.EstimatedArrival) {
    return null;
  }

  const arrivalDate = new Date(nextBusRaw.EstimatedArrival);
  const diffMinutes = Math.max(0, Math.round((arrivalDate.getTime() - Date.now()) / (60 * 1000)));

  const loadRaw = (nextBusRaw.Load || '').toUpperCase();
  const crowdLevel: 'SEA' | 'SDA' | 'LSD' =
    loadRaw === 'LSD' ? 'LSD' : loadRaw === 'SDA' ? 'SDA' : 'SEA';

  const typeRaw = (nextBusRaw.Type || '').toUpperCase();
  const deckType: 'SD' | 'DD' | 'BD' =
    typeRaw === 'DD' ? 'DD' : typeRaw === 'BD' ? 'BD' : 'SD';

  const wheelchairAccessible = (nextBusRaw.Feature || '').toUpperCase() === 'WAB';

  return {
    estimatedArrivalMinutes: diffMinutes,
    crowdLevel,
    deckType,
    wheelchairAccessible,
  };
}

/**
 * Fetch real-time bus arrivals for a bus stop from LTA DataMall v3
 */
export async function getLiveBusArrivals(
  busStopCode: string,
  serviceNo?: string
): Promise<{
  busStopCode: string;
  services: BusServiceArrival[];
  isLive: boolean;
  lastUpdated: string;
  warning?: string;
}> {
  const accountKey = getAccountKey();

  if (!accountKey) {
    // Return fallback arrival data for this stop
    const fallbackStop = INITIAL_BUS_STOPS.find((s) => s.code === busStopCode);
    return {
      busStopCode,
      services: fallbackStop ? fallbackStop.services : [],
      isLive: false,
      lastUpdated: new Date().toLocaleTimeString('en-SG', { hour12: false }),
      warning: 'Live LTA DataMall requires LTA_ACCOUNT_KEY in environment variables.',
    };
  }

  try {
    let url = `${LTA_BASE_URL}/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
    if (serviceNo) {
      url += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
    }

    const response = await fetch(url, {
      headers: { AccountKey: accountKey, accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`LTA BusArrival returned ${response.status}: ${response.statusText}`);
    }

    const data: any = await response.json();
    const rawServices = data.Services || [];

    const services: BusServiceArrival[] = [];

    for (const svc of rawServices) {
      const nextBus = parseNextBus(svc.NextBus);
      const subsequentBus = parseNextBus(svc.NextBus2);
      const thirdBus = parseNextBus(svc.NextBus3);

      // If no next bus is operating at all
      if (!nextBus) {
        continue;
      }

      const destCode = svc.NextBus?.DestinationCode || '';
      const destinationName =
        DESTINATION_NAMES[destCode] ||
        (destCode ? `Stop ${destCode}` : 'Scheduled Route Destination');

      const opRaw = (svc.Operator || '').toUpperCase();
      const operator: 'SBST' | 'SMRT' | 'TTS' | 'GAS' =
        opRaw.includes('SMRT') ? 'SMRT' : opRaw.includes('TTS') ? 'TTS' : opRaw.includes('GAS') ? 'GAS' : 'SBST';

      services.push({
        serviceNo: svc.ServiceNo,
        operator,
        destinationName,
        nextBus,
        subsequentBus: subsequentBus || undefined,
        thirdBus: thirdBus || undefined,
      });
    }

    // Sort naturally by service number
    services.sort((a, b) => {
      const numA = parseInt(a.serviceNo, 10);
      const numB = parseInt(b.serviceNo, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.serviceNo.localeCompare(b.serviceNo);
    });

    return {
      busStopCode,
      services,
      isLive: true,
      lastUpdated: new Date().toLocaleTimeString('en-SG', { hour12: false }),
    };
  } catch (err: any) {
    console.error(`Error fetching live bus arrivals for ${busStopCode}:`, err);
    const fallbackStop = INITIAL_BUS_STOPS.find((s) => s.code === busStopCode);
    return {
      busStopCode,
      services: fallbackStop ? fallbackStop.services : [],
      isLive: false,
      lastUpdated: new Date().toLocaleTimeString('en-SG', { hour12: false }),
      warning: err.message,
    };
  }
}

/**
 * Fetch live Train Service Alerts from LTA DataMall
 */
export async function getLiveTrainAlerts(): Promise<{
  alerts: TrainAlert[];
  isLive: boolean;
  status: number;
}> {
  const accountKey = getAccountKey();

  if (!accountKey) {
    return {
      alerts: TRAIN_SERVICE_ALERTS,
      isLive: false,
      status: 1,
    };
  }

  try {
    const response = await fetch(`${LTA_BASE_URL}/TrainServiceAlerts`, {
      headers: { AccountKey: accountKey, accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`TrainServiceAlerts returned ${response.status}`);
    }

    const data: any = await response.json();
    const value = data.value || {};
    const status = value.Status ?? 1; // 1 = Normal, 2 = Disruption

    if (status === 1) {
      return {
        alerts: [
          {
            id: 'lta-normal-1',
            type: 'normal',
            title: 'Normal Train Service Operations',
            description: 'All MRT and LRT lines operating normally with scheduled train frequencies across Singapore.',
            affectedLines: ['NSL', 'EWL', 'NEL', 'CCL', 'DTL', 'TEL', 'BPLRT', 'SPLRT'],
            updatedAt: 'Live from LTA DataMall',
          },
        ],
        isLive: true,
        status: 1,
      };
    }

    const alerts: TrainAlert[] = [];
    const segments = value.AffectedSegments || [];
    const messages = value.Message || [];

    if (messages.length > 0) {
      messages.forEach((msgObj: any, idx: number) => {
        const text = typeof msgObj === 'string' ? msgObj : msgObj.Content || 'Service delay reported';
        const created = msgObj.CreatedDate || 'Just now';
        alerts.push({
          id: `lta-alert-${idx}`,
          type: 'disruption',
          title: 'Train Service Advisory',
          description: text,
          affectedLines: segments.map((s: any) => s.Line).filter(Boolean),
          updatedAt: created,
        });
      });
    } else {
      alerts.push({
        id: 'lta-alert-disruption',
        type: 'disruption',
        title: 'Train Service Disruption Advisory',
        description: 'Delays or disruptions reported on affected segments. Free bridging bus services may be activated.',
        affectedLines: segments.map((s: any) => s.Line).filter(Boolean),
        updatedAt: 'Live from LTA DataMall',
      });
    }

    return { alerts, isLive: true, status };
  } catch (err: any) {
    console.error('Error fetching live train service alerts:', err);
    return { alerts: TRAIN_SERVICE_ALERTS, isLive: false, status: 1 };
  }
}

/**
 * Fetch platform crowd density for a specific train line from LTA DataMall PCDRealTime
 */
export async function getLiveCrowdDensity(
  trainLine?: string
): Promise<Record<string, { level: 'Low' | 'Moderate' | 'High'; percentage: number; description: string }>> {
  const accountKey = getAccountKey();
  if (!accountKey) {
    return cachedCrowdDensity;
  }

  const linesToFetch = trainLine ? [trainLine] : ['NSL', 'EWL', 'NEL', 'CCL', 'DTL', 'TEL'];
  const now = Date.now();

  if (now - lastCrowdFetchTime < CROWD_CACHE_TTL && Object.keys(cachedCrowdDensity).length > 0) {
    return cachedCrowdDensity;
  }

  try {
    const results = await Promise.all(
      linesToFetch.map(async (line) => {
        try {
          const res = await fetch(`${LTA_BASE_URL}/PCDRealTime?TrainLine=${encodeURIComponent(line)}`, {
            headers: { AccountKey: accountKey, accept: 'application/json' },
          });
          if (!res.ok) return [];
          const data: any = await res.json();
          return data.value || [];
        } catch {
          return [];
        }
      })
    );

    const merged: Record<string, { level: 'Low' | 'Moderate' | 'High'; percentage: number; description: string }> = {};

    for (const items of results) {
      for (const item of items) {
        const station = item.Station;
        if (!station) continue;

        const rawCrowd = (item.CrowdLevel || '').toLowerCase();
        let level: 'Low' | 'Moderate' | 'High' = 'Low';
        let percentage = 25;
        let description = 'Low platform crowd density - Comfortable boarding';

        if (rawCrowd === 'h' || rawCrowd === 'high' || rawCrowd === '3') {
          level = 'High';
          percentage = 85;
          description = 'High platform crowd density - Expect queues and heavier passenger volumes';
        } else if (rawCrowd === 'm' || rawCrowd === 'moderate' || rawCrowd === '2') {
          level = 'Moderate';
          percentage = 55;
          description = 'Moderate platform crowd density - Normal boarding flow';
        }

        merged[station] = { level, percentage, description };
      }
    }

    if (Object.keys(merged).length > 0) {
      cachedCrowdDensity = { ...cachedCrowdDensity, ...merged };
      lastCrowdFetchTime = now;
    }

    return cachedCrowdDensity;
  } catch (err) {
    console.error('Error fetching live crowd density:', err);
    return cachedCrowdDensity;
  }
}

/**
 * Fetch all MRT/LRT stations enriched with live PCDRealTime crowd density
 */
export async function getLiveTrainStations(): Promise<{
  stations: MRTStation[];
  isLive: boolean;
}> {
  const crowdMap = await getLiveCrowdDensity();

  const stations: MRTStation[] = INITIAL_MRT_STATIONS.map((station) => {
    // Check if any station code has live crowd data
    let matchingCrowd: { level: 'Low' | 'Moderate' | 'High'; percentage: number; description: string } | null = null;

    for (const line of station.lines) {
      if (crowdMap[line.stationCode]) {
        matchingCrowd = crowdMap[line.stationCode];
        break;
      }
    }

    return {
      ...station,
      crowdDensity: matchingCrowd || station.crowdDensity,
    };
  });

  return {
    stations,
    isLive: Object.keys(crowdMap).length > 0,
  };
}
