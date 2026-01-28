import { MapStyle, Coordinates, ExportConfig } from '@/types';

/**
 * Mapbox configuration
 * 
 * IMPORTANT: Replace with your own Mapbox access token
 * Get one at: https://account.mapbox.com/access-tokens/
 * 
 * TODO: Move to environment variable for production
 */
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiY2FlZm9yZ2EiLCJhIjoiY21reWJweGl3MDVxbTNmb2ZlZW16dnpueiJ9.oQb_xXkI8BorsZuSMjby_g';

// Mapbox style URLs
export const MAP_STYLES: Record<MapStyle, string> = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  'satellite-streets': 'mapbox://styles/mapbox/satellite-streets-v12',
};

export const MAP_STYLE_LABELS: Record<MapStyle, string> = {
  streets: 'Calles',
  outdoors: 'Exterior',
  light: 'Claro',
  dark: 'Oscuro',
  satellite: 'Satélite',
  'satellite-streets': 'Satélite + Calles',
};

// Default map configuration (centered on Spain)
export const DEFAULT_MAP_CENTER: Coordinates = [-3.7038, 40.4168]; // Madrid
export const DEFAULT_MAP_ZOOM = 5;

// Map bounds for route fitting
export const FIT_BOUNDS_PADDING = 100;

// Default export configuration
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'webm',
  quality: 'high',
  fps: 30,
  width: 1920,
  height: 1080,
  includeUI: false,
};

// Export quality presets
export const EXPORT_QUALITY_PRESETS = {
  low: { width: 854, height: 480, bitrate: 1000000 },
  medium: { width: 1280, height: 720, bitrate: 2500000 },
  high: { width: 1920, height: 1080, bitrate: 5000000 },
};
