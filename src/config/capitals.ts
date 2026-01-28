import { Coordinates } from '@/types';

/**
 * Capital cities coordinates by country code (ISO 3166-1 alpha-2)
 * Used for centering the map based on user's detected country
 */
export const CAPITAL_COORDINATES: Record<string, { name: string; coordinates: Coordinates }> = {
  // Europe
  ES: { name: 'Madrid', coordinates: [-3.7038, 40.4168] },
  FR: { name: 'París', coordinates: [2.3522, 48.8566] },
  DE: { name: 'Berlín', coordinates: [13.4050, 52.5200] },
  IT: { name: 'Roma', coordinates: [12.4964, 41.9028] },
  GB: { name: 'Londres', coordinates: [-0.1276, 51.5074] },
  PT: { name: 'Lisboa', coordinates: [-9.1393, 38.7223] },
  NL: { name: 'Ámsterdam', coordinates: [4.9041, 52.3676] },
  BE: { name: 'Bruselas', coordinates: [4.3517, 50.8503] },
  CH: { name: 'Berna', coordinates: [7.4474, 46.9480] },
  AT: { name: 'Viena', coordinates: [16.3738, 48.2082] },
  PL: { name: 'Varsovia', coordinates: [21.0122, 52.2297] },
  SE: { name: 'Estocolmo', coordinates: [18.0686, 59.3293] },
  NO: { name: 'Oslo', coordinates: [10.7522, 59.9139] },
  DK: { name: 'Copenhague', coordinates: [12.5683, 55.6761] },
  FI: { name: 'Helsinki', coordinates: [24.9384, 60.1699] },
  IE: { name: 'Dublín', coordinates: [-6.2603, 53.3498] },
  GR: { name: 'Atenas', coordinates: [23.7275, 37.9838] },
  CZ: { name: 'Praga', coordinates: [14.4378, 50.0755] },
  HU: { name: 'Budapest', coordinates: [19.0402, 47.4979] },
  RO: { name: 'Bucarest', coordinates: [26.1025, 44.4268] },
  
  // Americas
  US: { name: 'Washington D.C.', coordinates: [-77.0369, 38.9072] },
  CA: { name: 'Ottawa', coordinates: [-75.6972, 45.4215] },
  MX: { name: 'Ciudad de México', coordinates: [-99.1332, 19.4326] },
  BR: { name: 'Brasilia', coordinates: [-47.9292, -15.7801] },
  AR: { name: 'Buenos Aires', coordinates: [-58.3816, -34.6037] },
  CO: { name: 'Bogotá', coordinates: [-74.0721, 4.7110] },
  CL: { name: 'Santiago', coordinates: [-70.6693, -33.4489] },
  PE: { name: 'Lima', coordinates: [-77.0428, -12.0464] },
  VE: { name: 'Caracas', coordinates: [-66.9036, 10.4806] },
  EC: { name: 'Quito', coordinates: [-78.4678, -0.1807] },
  UY: { name: 'Montevideo', coordinates: [-56.1645, -34.9011] },
  PY: { name: 'Asunción', coordinates: [-57.5759, -25.2637] },
  BO: { name: 'La Paz', coordinates: [-68.1193, -16.4897] },
  PA: { name: 'Ciudad de Panamá', coordinates: [-79.5199, 8.9824] },
  CR: { name: 'San José', coordinates: [-84.0907, 9.9281] },
  GT: { name: 'Ciudad de Guatemala', coordinates: [-90.5069, 14.6349] },
  CU: { name: 'La Habana', coordinates: [-82.3666, 23.1136] },
  DO: { name: 'Santo Domingo', coordinates: [-69.9312, 18.4861] },
  PR: { name: 'San Juan', coordinates: [-66.1057, 18.4655] },
  
  // Asia
  JP: { name: 'Tokio', coordinates: [139.6917, 35.6895] },
  CN: { name: 'Pekín', coordinates: [116.4074, 39.9042] },
  KR: { name: 'Seúl', coordinates: [126.9780, 37.5665] },
  IN: { name: 'Nueva Delhi', coordinates: [77.2090, 28.6139] },
  TH: { name: 'Bangkok', coordinates: [100.5018, 13.7563] },
  VN: { name: 'Hanói', coordinates: [105.8342, 21.0278] },
  SG: { name: 'Singapur', coordinates: [103.8198, 1.3521] },
  MY: { name: 'Kuala Lumpur', coordinates: [101.6869, 3.1390] },
  ID: { name: 'Yakarta', coordinates: [106.8456, -6.2088] },
  PH: { name: 'Manila', coordinates: [120.9842, 14.5995] },
  
  // Oceania
  AU: { name: 'Canberra', coordinates: [149.1300, -35.2809] },
  NZ: { name: 'Wellington', coordinates: [174.7762, -41.2866] },
  
  // Africa
  ZA: { name: 'Pretoria', coordinates: [28.1871, -25.7461] },
  EG: { name: 'El Cairo', coordinates: [31.2357, 30.0444] },
  MA: { name: 'Rabat', coordinates: [-6.8498, 34.0209] },
  NG: { name: 'Abuya', coordinates: [7.4951, 9.0579] },
  KE: { name: 'Nairobi', coordinates: [36.8219, -1.2921] },
  
  // Middle East
  AE: { name: 'Abu Dabi', coordinates: [54.3773, 24.4539] },
  SA: { name: 'Riad', coordinates: [46.6753, 24.7136] },
  IL: { name: 'Jerusalén', coordinates: [35.2137, 31.7683] },
  TR: { name: 'Ankara', coordinates: [32.8597, 39.9334] },
  
  // Russia & CIS
  RU: { name: 'Moscú', coordinates: [37.6173, 55.7558] },
  UA: { name: 'Kiev', coordinates: [30.5234, 50.4501] },
};

// Default fallback (Spain/Madrid)
export const DEFAULT_COUNTRY_CODE = 'ES';
