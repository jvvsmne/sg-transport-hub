export type TransportMode = 'bus' | 'mrt';

export type BusCrowdLevel = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusDeckType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy

export interface NextBusInfo {
  estimatedArrivalMinutes: number; // 0 for Arr
  crowdLevel: BusCrowdLevel;
  deckType: BusDeckType;
  wheelchairAccessible: boolean;
}

export interface BusServiceArrival {
  serviceNo: string;
  operator: 'SBST' | 'SMRT' | 'TTS' | 'GAS';
  destinationName: string;
  nextBus: NextBusInfo;
  subsequentBus?: NextBusInfo;
  thirdBus?: NextBusInfo;
}

export interface BusStop {
  id: string; // e.g. "09048"
  code: string; // e.g. "09048"
  name: string; // e.g. "Opp Mandarin Orchard"
  road: string; // e.g. "Orchard Rd"
  area: string; // e.g. "Central / Orchard"
  lat: number;
  lng: number;
  services: BusServiceArrival[];
  nearbyMrt?: string;
}

export interface MRTLine {
  code: 'NSL' | 'EWL' | 'NEL' | 'CCL' | 'DTL' | 'TEL' | 'BPLRT' | 'SPLRT';
  name: string;
  color: string;
  textColor: string;
}

export interface TrainDirection {
  platform: string;
  destination: string;
  nextTrainMinutes: number;
  subsequentTrainMinutes: number;
  crowdLevel: 'Low' | 'Moderate' | 'High';
}

export interface StationLineService {
  lineCode: 'NSL' | 'EWL' | 'NEL' | 'CCL' | 'DTL' | 'TEL' | 'BPLRT' | 'SPLRT';
  stationCode: string; // e.g. "NS24"
  directions: TrainDirection[];
  firstTrainWeekday: string;
  lastTrainWeekday: string;
}

export interface TrainAlert {
  id: string;
  type: 'normal' | 'advisory' | 'delay' | 'disruption' | 'maintenance';
  title: string;
  description: string;
  affectedLines: string[];
  updatedAt: string;
}

export interface MRTStation {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  isInterchange: boolean;
  crowdDensity: {
    level: 'Low' | 'Moderate' | 'High';
    percentage: number;
    description: string;
  };
  lines: StationLineService[];
  facilities: string[];
  alerts?: TrainAlert[];
}
