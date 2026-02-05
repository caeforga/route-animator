/**
 * Core data models for the Route Animator application
 * 
 * Design decisions:
 * - Using discriminated unions for transport modes to enable type-safe styling
 * - Coordinates follow GeoJSON standard [longitude, latitude]
 * - IDs are strings for flexibility (could be UUIDs in production)
 */

// Geographic coordinates [longitude, latitude] following GeoJSON standard
export type Coordinates = [number, number];

// Transport modes with their characteristics
export type TransportMode = 'car' | 'motorcycle' | 'train' | 'plane';

export interface TransportConfig {
  mode: TransportMode;
  label: string;
  icon: string;
  color: string;
  speed: number; // pixels per frame for animation
  lineStyle: 'solid' | 'dashed';
  lineWidth: number;
}

// A single point on the route
export interface Waypoint {
  id: string;
  coordinates: Coordinates;
  label?: string;
  order: number;
}

// A segment connects two waypoints
export interface RouteSegment {
  id: string;
  startWaypointId: string;
  endWaypointId: string;
  transportMode: TransportMode;
  // Actual path coordinates (from routing API or manual adjustment)
  path: Coordinates[];
  // Distance in meters
  distance?: number;
  // Duration in seconds
  duration?: number;
}

// Complete route with all waypoints and segments
export interface Route {
  id: string;
  name: string;
  waypoints: Waypoint[];
  segments: RouteSegment[];
  createdAt: Date;
  updatedAt: Date;
}

// Animation state
export interface AnimationState {
  isPlaying: boolean;
  isPaused: boolean;
  currentProgress: number; // 0-1 for overall progress
  currentSegmentIndex: number;
  segmentProgress: number; // 0-1 for current segment
  duration: number; // Total animation duration in seconds (5-30)
}

// Map configuration
export interface MapConfig {
  style: MapStyle;
  center: Coordinates;
  zoom: number;
  bearing: number;
  pitch: number;
}

// Predefined map styles
export type MapStyle = 
  | 'streets'
  | 'outdoors'
  | 'light'
  | 'dark'
  | 'satellite'
  | 'satellite-streets';

// Export configuration
export interface ExportConfig {
  format: 'webm' | 'mp4';
  quality: 'low' | 'medium' | 'high';
  fps: number;
  width: number;
  height: number;
  includeUI: boolean;
}

// Application state types for Zustand store
export interface RouteState {
  route: Route | null;
  selectedWaypointId: string | null;
  selectedSegmentId: string | null;
  editMode: EditMode;
}

export type EditMode = 'select' | 'add-waypoint' | 'edit-path';

// UI state
export interface UIState {
  sidebarOpen: boolean;
  activePanel: 'waypoints' | 'animation' | 'export' | 'settings';
  isExporting: boolean;
  exportProgress: number;
}
