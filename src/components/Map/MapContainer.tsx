import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useRouteStore } from '@/store/routeStore';
import { useAnimation } from '@/hooks/useAnimation';
import { MAPBOX_ACCESS_TOKEN, MAP_STYLES } from '@/config/map';
import { getTransportConfig } from '@/config/transport';

/**
 * Main map container component
 * 
 * Handles:
 * - Map initialization
 * - Waypoint markers
 * - Route lines
 * - Animation overlay
 */

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const animationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const {
    route,
    mapConfig,
    editMode,
    addWaypoint,
    selectWaypoint,
    selectedWaypointId,
    ui,
  } = useRouteStore();

  const { sidebarOpen } = ui;
  const { getAnimationFrame, isPlaying, progress } = useAnimation();

  // Refs to keep callbacks updated for event handlers
  const editModeRef = useRef(editMode);
  const addWaypointRef = useRef(addWaypoint);
  const selectWaypointRef = useRef(selectWaypoint);

  // Keep refs in sync
  useEffect(() => {
    editModeRef.current = editMode;
    addWaypointRef.current = addWaypoint;
    selectWaypointRef.current = selectWaypoint;
  }, [editMode, addWaypoint, selectWaypoint]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES[mapConfig.style],
      center: mapConfig.center,
      zoom: mapConfig.zoom,
      preserveDrawingBuffer: true,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // Add route source
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Add animated path source
      map.addSource('animated-path', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      // Add route layers for each transport mode
      ['car', 'motorcycle', 'train', 'plane'].forEach((mode) => {
        const config = getTransportConfig(mode as any);
        
        map.addLayer({
          id: `route-${mode}`,
          type: 'line',
          source: 'route',
          filter: ['==', ['get', 'transportMode'], mode],
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': config.color,
            'line-width': config.lineWidth,
            'line-opacity': 0.6,
            'line-dasharray': config.lineStyle === 'dashed' ? [2, 2] : [1, 0],
          },
        });
      });

      // Add animated path layer (drawn on top)
      map.addLayer({
        id: 'animated-path',
        type: 'line',
        source: 'animated-path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#EF4444',
          'line-width': 4,
        },
      });
    });

    // Handle clicks for adding waypoints (uses refs to get current values)
    map.on('click', (e) => {
      if (editModeRef.current === 'add-waypoint') {
        addWaypointRef.current([e.lngLat.lng, e.lngLat.lat]);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map style
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(MAP_STYLES[mapConfig.style]);
  }, [mapConfig.style]);

  // Resize map when sidebar toggles
  useEffect(() => {
    if (!mapRef.current) return;
    // Small delay to allow CSS transition to complete
    const timeoutId = setTimeout(() => {
      mapRef.current?.resize();
    }, 300); // Match CSS transition duration
    
    return () => clearTimeout(timeoutId);
  }, [sidebarOpen]);

  // Update cursor based on edit mode
  useEffect(() => {
    if (!mapRef.current) return;
    const canvas = mapRef.current.getCanvas();
    canvas.style.cursor = editMode === 'add-waypoint' ? 'crosshair' : '';
  }, [editMode]);

  // Update waypoint markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!route) return;

    // Add new markers
    route.waypoints.forEach((waypoint, index) => {
      const el = document.createElement('div');
      el.className = 'waypoint-marker';
      el.innerHTML = `
        <div class="waypoint-marker-inner ${selectedWaypointId === waypoint.id ? 'selected' : ''}">
          <span>${index + 1}</span>
        </div>
      `;

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: editMode === 'edit-path',
      })
        .setLngLat(waypoint.coordinates)
        .addTo(mapRef.current!);

      // Use ref to ensure we always call the latest selectWaypoint
      marker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        selectWaypointRef.current(waypoint.id);
      });

      markersRef.current.push(marker);
    });
  }, [route?.waypoints, selectedWaypointId, editMode]);

  // Update route lines
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getSource('route')) return;

    const features = route?.segments.map((segment) => ({
      type: 'Feature' as const,
      properties: {
        transportMode: segment.transportMode,
        id: segment.id,
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: segment.path,
      },
    })) || [];

    (mapRef.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features,
    });
  }, [route?.segments]);

  // Helper function to update animation visuals on map
  const updateAnimationVisuals = () => {
    if (!mapRef.current) return;

    const frame = getAnimationFrame();
    
    if (frame && frame.drawnPath.length > 0 && mapRef.current.getSource('animated-path')) {
      // Update animated path
      (mapRef.current.getSource('animated-path') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: frame.drawnPath,
        },
      });

      // Update or create animation marker
      if (!animationMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'animation-marker';
        el.innerHTML = '🚗'; // Default icon
        
        animationMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(frame.markerPosition)
          .addTo(mapRef.current!);
      } else {
        animationMarkerRef.current.setLngLat(frame.markerPosition);
      }

      // Update marker icon based on current segment transport mode
      if (route?.segments[frame.currentSegmentIndex]) {
        const config = getTransportConfig(
          route.segments[frame.currentSegmentIndex].transportMode
        );
        animationMarkerRef.current.getElement().innerHTML = config.icon;
      }
    }
  };

  // Update animation visuals when progress changes (scrubbing)
  useEffect(() => {
    if (!mapRef.current || !route?.segments.length) return;

    // If progress is 0, clear the animation visuals
    if (progress === 0) {
      if (animationMarkerRef.current) {
        animationMarkerRef.current.remove();
        animationMarkerRef.current = null;
      }
      if (mapRef.current.getSource('animated-path')) {
        (mapRef.current.getSource('animated-path') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        });
      }
      return;
    }

    // Update visuals for current progress (when scrubbing or paused)
    if (!isPlaying) {
      updateAnimationVisuals();
    }
  }, [progress, route?.segments, isPlaying]);

  // Animation loop (only runs when playing)
  useEffect(() => {
    if (!mapRef.current || !isPlaying) return;

    let animationId: number;

    const animate = () => {
      updateAnimationVisuals();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, getAnimationFrame, route?.segments]);

  return (
    <div 
      ref={containerRef} 
      className="map-container"
      id="map-container"
    />
  );
}
