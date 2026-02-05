import { create } from 'zustand';
import {
  Route,
  Waypoint,
  RouteSegment,
  TransportMode,
  Coordinates,
  EditMode,
  AnimationState,
  MapConfig,
  MapStyle,
  UIState,
  ExportConfig,
} from '@/types';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, DEFAULT_EXPORT_CONFIG } from '@/config/map';

/**
 * Main application store using Zustand with Immer for immutable updates
 * 
 * Architecture decisions:
 * - Single store for simplicity in MVP (could split in production)
 * - Immer enables mutable-style updates with immutable results
 * - Actions are colocated with state for discoverability
 */

interface RouteStore {
  // Route state
  route: Route | null;
  selectedWaypointId: string | null;
  selectedSegmentId: string | null;
  editMode: EditMode;

  // Animation state
  animation: AnimationState;

  // Map configuration
  mapConfig: MapConfig;

  // UI state
  ui: UIState;

  // Export configuration
  exportConfig: ExportConfig;

  // Route actions
  createRoute: (name: string) => void;
  addWaypoint: (coordinates: Coordinates, label?: string) => void;
  updateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
  removeWaypoint: (id: string) => void;
  reorderWaypoints: (fromIndex: number, toIndex: number) => void;
  
  // Segment actions
  updateSegmentTransport: (segmentId: string, mode: TransportMode) => void;
  updateSegmentPath: (segmentId: string, path: Coordinates[]) => void;
  
  // Selection actions
  selectWaypoint: (id: string | null) => void;
  selectSegment: (id: string | null) => void;
  setEditMode: (mode: EditMode) => void;

  // Animation actions
  playAnimation: () => void;
  pauseAnimation: () => void;
  stopAnimation: () => void;
  setAnimationProgress: (progress: number) => void;
  setAnimationSpeed: (speed: number) => void;
  updateAnimationFrame: (deltaTime: number) => void;

  // Map actions
  setMapStyle: (style: MapStyle) => void;
  setMapView: (center: Coordinates, zoom: number) => void;

  // UI actions
  toggleSidebar: () => void;
  setActivePanel: (panel: UIState['activePanel']) => void;
  setExporting: (isExporting: boolean, progress?: number) => void;

  // Export actions
  setExportConfig: (config: Partial<ExportConfig>) => void;

  // Utility actions
  clearRoute: () => void;
  loadRoute: (route: Route) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useRouteStore = create<RouteStore>()(
  // Note: immer middleware needs to be installed separately
  // For MVP, using manual immutable updates
  (set, get) => ({
    // Initial state
    route: null,
    selectedWaypointId: null,
    selectedSegmentId: null,
    editMode: 'select',

    animation: {
      isPlaying: false,
      isPaused: false,
      currentProgress: 0,
      currentSegmentIndex: 0,
      segmentProgress: 0,
      speed: 1,
    },

    mapConfig: {
      style: 'streets',
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      bearing: 0,
      pitch: 0,
    },

    ui: {
      sidebarOpen: true,
      activePanel: 'waypoints',
      isExporting: false,
      exportProgress: 0,
    },

    exportConfig: DEFAULT_EXPORT_CONFIG,

    // Route actions
    createRoute: (name) => {
      set({
        route: {
          id: generateId(),
          name,
          waypoints: [],
          segments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    },

    addWaypoint: (coordinates, label) => {
      const { route, animation } = get();
      if (!route) return;

      const newWaypoint: Waypoint = {
        id: generateId(),
        coordinates,
        label,
        order: route.waypoints.length,
      };

      const updatedWaypoints = [...route.waypoints, newWaypoint];
      
      // Create segment if there's a previous waypoint
      let updatedSegments = [...route.segments];
      if (route.waypoints.length > 0) {
        const previousWaypoint = route.waypoints[route.waypoints.length - 1];
        const newSegment: RouteSegment = {
          id: generateId(),
          startWaypointId: previousWaypoint.id,
          endWaypointId: newWaypoint.id,
          transportMode: 'car', // Default transport mode
          path: [previousWaypoint.coordinates, coordinates], // Initial direct path
        };
        updatedSegments = [...updatedSegments, newSegment];
      }

      set({
        route: {
          ...route,
          waypoints: updatedWaypoints,
          segments: updatedSegments,
          updatedAt: new Date(),
        },
        // Reset animation when route changes
        animation: {
          ...animation,
          isPlaying: false,
          isPaused: false,
          currentProgress: 0,
          currentSegmentIndex: 0,
          segmentProgress: 0,
        },
      });
    },

    updateWaypoint: (id, updates) => {
      const { route } = get();
      if (!route) return;

      set({
        route: {
          ...route,
          waypoints: route.waypoints.map((wp) =>
            wp.id === id ? { ...wp, ...updates } : wp
          ),
          updatedAt: new Date(),
        },
      });
    },

    removeWaypoint: (id) => {
      const { route, selectedWaypointId, animation } = get();
      if (!route) return;

      const waypointIndex = route.waypoints.findIndex((wp) => wp.id === id);
      if (waypointIndex === -1) return;

      // Remove waypoint and update order
      const updatedWaypoints = route.waypoints
        .filter((wp) => wp.id !== id)
        .map((wp, index) => ({ ...wp, order: index }));

      // Rebuild segments from scratch based on remaining waypoints (in order)
      const updatedSegments: RouteSegment[] = [];
      
      for (let i = 0; i < updatedWaypoints.length - 1; i++) {
        const startWp = updatedWaypoints[i];
        const endWp = updatedWaypoints[i + 1];
        
        // Try to find existing segment between these two waypoints
        const existingSegment = route.segments.find(
          (seg) => seg.startWaypointId === startWp.id && seg.endWaypointId === endWp.id
        );
        
        if (existingSegment) {
          // Keep existing segment with its path and transport mode
          updatedSegments.push(existingSegment);
        } else {
          // Create new segment (happens when a middle waypoint is removed)
          // Try to inherit transport mode from adjacent segments
          const prevSegment = route.segments.find(s => s.endWaypointId === startWp.id);
          const nextSegment = route.segments.find(s => s.startWaypointId === endWp.id);
          const inheritedMode = prevSegment?.transportMode || nextSegment?.transportMode || 'car';
          
          updatedSegments.push({
            id: generateId(),
            startWaypointId: startWp.id,
            endWaypointId: endWp.id,
            transportMode: inheritedMode,
            path: [startWp.coordinates, endWp.coordinates], // Direct path, needs recalculation
          });
        }
      }

      // Reset animation when route structure changes
      set({
        route: {
          ...route,
          waypoints: updatedWaypoints,
          segments: updatedSegments,
          updatedAt: new Date(),
        },
        selectedWaypointId: selectedWaypointId === id ? null : selectedWaypointId,
        // Reset animation to beginning when route changes
        animation: {
          ...animation,
          isPlaying: false,
          isPaused: false,
          currentProgress: 0,
          currentSegmentIndex: 0,
          segmentProgress: 0,
        },
      });
    },

    reorderWaypoints: (fromIndex, toIndex) => {
      const { route, animation } = get();
      if (!route) return;

      const waypoints = [...route.waypoints];
      const [removed] = waypoints.splice(fromIndex, 1);
      waypoints.splice(toIndex, 0, removed);

      // Update order property
      const updatedWaypoints = waypoints.map((wp, index) => ({
        ...wp,
        order: index,
      }));

      // Rebuild segments based on new order
      const updatedSegments: RouteSegment[] = [];
      for (let i = 0; i < updatedWaypoints.length - 1; i++) {
        const startWp = updatedWaypoints[i];
        const endWp = updatedWaypoints[i + 1];
        
        // Try to find existing segment (might have different direction)
        const existingSegment = route.segments.find(
          (seg) =>
            (seg.startWaypointId === startWp.id && seg.endWaypointId === endWp.id) ||
            (seg.startWaypointId === endWp.id && seg.endWaypointId === startWp.id)
        );

        updatedSegments.push({
          id: existingSegment?.id || generateId(),
          startWaypointId: startWp.id,
          endWaypointId: endWp.id,
          transportMode: existingSegment?.transportMode || 'car',
          path: existingSegment?.path || [startWp.coordinates, endWp.coordinates],
        });
      }

      set({
        route: {
          ...route,
          waypoints: updatedWaypoints,
          segments: updatedSegments,
          updatedAt: new Date(),
        },
        // Reset animation when route structure changes
        animation: {
          ...animation,
          isPlaying: false,
          isPaused: false,
          currentProgress: 0,
          currentSegmentIndex: 0,
          segmentProgress: 0,
        },
      });
    },

    // Segment actions
    updateSegmentTransport: (segmentId, mode) => {
      const { route } = get();
      if (!route) return;

      set({
        route: {
          ...route,
          segments: route.segments.map((seg) =>
            seg.id === segmentId ? { ...seg, transportMode: mode } : seg
          ),
          updatedAt: new Date(),
        },
      });
    },

    updateSegmentPath: (segmentId, path) => {
      const { route } = get();
      if (!route) return;

      set({
        route: {
          ...route,
          segments: route.segments.map((seg) =>
            seg.id === segmentId ? { ...seg, path } : seg
          ),
          updatedAt: new Date(),
        },
      });
    },

    // Selection actions
    selectWaypoint: (id) => set({ selectedWaypointId: id, selectedSegmentId: null }),
    selectSegment: (id) => set({ selectedSegmentId: id, selectedWaypointId: null }),
    setEditMode: (mode) => set({ editMode: mode }),

    // Animation actions
    playAnimation: () => {
      set({
        animation: {
          ...get().animation,
          isPlaying: true,
          isPaused: false,
        },
      });
    },

    pauseAnimation: () => {
      set({
        animation: {
          ...get().animation,
          isPlaying: false,
          isPaused: true,
        },
      });
    },

    stopAnimation: () => {
      set({
        animation: {
          isPlaying: false,
          isPaused: false,
          currentProgress: 0,
          currentSegmentIndex: 0,
          segmentProgress: 0,
          speed: get().animation.speed,
        },
      });
    },

    setAnimationProgress: (progress) => {
      const { route } = get();
      if (!route || route.segments.length === 0) return;

      const segmentCount = route.segments.length;
      const segmentIndex = Math.min(
        Math.floor(progress * segmentCount),
        segmentCount - 1
      );
      const segmentProgress = (progress * segmentCount) % 1;

      set({
        animation: {
          ...get().animation,
          currentProgress: progress,
          currentSegmentIndex: segmentIndex,
          segmentProgress: segmentProgress,
        },
      });
    },

    setAnimationSpeed: (speed) => {
      set({
        animation: {
          ...get().animation,
          speed,
        },
      });
    },

    updateAnimationFrame: (deltaTime) => {
      const { animation, route } = get();
      if (!route || !animation.isPlaying || route.segments.length === 0) return;

      const progressIncrement = (deltaTime / 1000) * 0.05 * animation.speed;
      const newProgress = Math.min(animation.currentProgress + progressIncrement, 1);

      if (newProgress >= 1) {
        // Animation complete - reset to beginning
        set({
          animation: {
            ...animation,
            isPlaying: false,
            isPaused: false,
            currentProgress: 0,
            currentSegmentIndex: 0,
            segmentProgress: 0,
          },
        });
      } else {
        get().setAnimationProgress(newProgress);
      }
    },

    // Map actions
    setMapStyle: (style) => {
      set({
        mapConfig: {
          ...get().mapConfig,
          style,
        },
      });
    },

    setMapView: (center, zoom) => {
      set({
        mapConfig: {
          ...get().mapConfig,
          center,
          zoom,
        },
      });
    },

    // UI actions
    toggleSidebar: () => {
      set({
        ui: {
          ...get().ui,
          sidebarOpen: !get().ui.sidebarOpen,
        },
      });
    },

    setActivePanel: (panel) => {
      set({
        ui: {
          ...get().ui,
          activePanel: panel,
        },
      });
    },

    setExporting: (isExporting, progress = 0) => {
      set({
        ui: {
          ...get().ui,
          isExporting,
          exportProgress: progress,
        },
      });
    },

    // Export actions
    setExportConfig: (config) => {
      set({
        exportConfig: {
          ...get().exportConfig,
          ...config,
        },
      });
    },

    // Utility actions
    clearRoute: () => {
      set({
        route: null,
        selectedWaypointId: null,
        selectedSegmentId: null,
        animation: {
          isPlaying: false,
          isPaused: false,
          currentProgress: 0,
          currentSegmentIndex: 0,
          segmentProgress: 0,
          speed: 1,
        },
      });
    },

    loadRoute: (route) => {
      set({
        route,
        selectedWaypointId: null,
        selectedSegmentId: null,
        animation: {
          isPlaying: false,
          isPaused: false,
          currentProgress: 0,
          currentSegmentIndex: 0,
          segmentProgress: 0,
          speed: 1,
        },
      });
    },
  })
);
