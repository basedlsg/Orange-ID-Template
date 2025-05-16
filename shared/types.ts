export interface PlanetDetail {
  sign: string;
  longitude: number; // Raw longitude
  positionInSign: number; // Decimal degrees within the sign
  speed: number;
  house?: number;
  // Retaining fullLongitudeDegrees here from _getLongitudeDetails for consistency if spread
  degree: number; 
  minute: number;
  second: number;
  fullLongitudeDegrees: number;
}

export interface LongitudeDetail {
  sign: string;
  degree: number;
  minute: number;     // Added
  second: number;     // Added
  fullLongitudeDegrees: number; // Renamed from fullLongitude and standardized
}

export interface AstrologicalAspect {
  point1Name: string; // Was planet1
  point2Name: string; // Was planet2
  aspectName: string; // Was type
  aspectDegrees: number; // Added
  orb: number;
  symbol: string;
}

export interface NatalChartDetails {
  utcDateTime: Date;
  latitude: number;
  longitude: number;
}

export interface NatalChartData {
  julianDay: number;
  sun?: PlanetDetail | null;
  moon?: PlanetDetail | null;
  mercury?: PlanetDetail | null;
  venus?: PlanetDetail | null;
  mars?: PlanetDetail | null;
  jupiter?: PlanetDetail | null;
  saturn?: PlanetDetail | null;
  uranus?: PlanetDetail | null;
  neptune?: PlanetDetail | null;
  pluto?: PlanetDetail | null;
  ascendant?: LongitudeDetail | null;
  midheaven?: LongitudeDetail | null;
  housesCusps?: LongitudeDetail[]; // Changed from number[] to LongitudeDetail[]
  aspects?: AstrologicalAspect[];
}

// Define a type for the objects within MAJOR_ASPECTS array if not already globally available
export interface AspectDefinition {
  name: string;
  degrees: number;
  orb: number;
  symbol: string;
}

// Constants can also be defined here if shared, or locally in engine
export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Moved from astrologyEngine.ts to be shared, ensure it's an array
export const MAJOR_ASPECTS: AspectDefinition[] = [
  { name: 'Conjunction', degrees: 0, orb: 8, symbol: '☌' }, // Orb can be adjusted
  { name: 'Sextile', degrees: 60, orb: 6, symbol: ' sextile ' }, // Unicode for sextile: U+26B9, but can use text
  { name: 'Square', degrees: 90, orb: 7, symbol: '□' },
  { name: 'Trine', degrees: 120, orb: 7, symbol: '△' },
  { name: 'Opposition', degrees: 180, orb: 8, symbol: '☍' },
];

export interface LongitudePoint {
    name: string;
    longitude: number;
} 