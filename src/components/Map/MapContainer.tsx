import { useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { useRouteStore } from '@/store/routeStore';
import { useAnimation } from '@/hooks/useAnimation';
import { MAPBOX_ACCESS_TOKEN, MAP_STYLES } from '@/config/map';
import { getTransportConfig } from '@/config/transport';
import { Coordinates } from '@/types';

/**
 * Smooths a path using bezier spline interpolation
 * Only applies to paths with more than 2 points
 */
function smoothPath(coordinates: Coordinates[], transportMode: string): Coordinates[] {
  // Don't smooth plane routes (they use arc) or simple 2-point lines
  if (transportMode === 'plane' || coordinates.length <= 2) {
    return coordinates;
  }

  try {
    const line = turf.lineString(coordinates);
    // Resolution controls smoothness (higher = more points = smoother)
    // Sharpness controls how close to original points (lower = smoother curves)
    const smoothed = turf.bezierSpline(line, { resolution: 10000, sharpness: 0.85 });
    return smoothed.geometry.coordinates as Coordinates[];
  } catch (e) {
    // If smoothing fails, return original
    return coordinates;
  }
}

/**
 * Main map container component
 * 
 * Handles:
 * - Map initialization
 * - Waypoint markers
 * - Route lines
 * - Animation overlay
 * - Path node editing
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
    selectedSegmentId,
    updateSegmentPath,
    ui,
  } = useRouteStore();

  const { sidebarOpen } = ui;
  const { getAnimationFrame, isPlaying, progress } = useAnimation();

  // Get the currently selected segment
  const selectedSegment = route?.segments.find(s => s.id === selectedSegmentId);

  // Refs to keep callbacks updated for event handlers
  const editModeRef = useRef(editMode);
  const addWaypointRef = useRef(addWaypoint);
  const selectWaypointRef = useRef(selectWaypoint);
  const updateSegmentPathRef = useRef(updateSegmentPath);
  const selectedSegmentRef = useRef(selectedSegment);

  // Keep refs in sync
  useEffect(() => {
    editModeRef.current = editMode;
    addWaypointRef.current = addWaypoint;
    selectWaypointRef.current = selectWaypoint;
    updateSegmentPathRef.current = updateSegmentPath;
    selectedSegmentRef.current = selectedSegment;
  }, [editMode, addWaypoint, selectWaypoint, updateSegmentPath, selectedSegment]);

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
        
        // Visible route layer
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

        // Invisible wider layer for easier clicking (only for ground transport)
        if (mode !== 'plane') {
          map.addLayer({
            id: `route-${mode}-hitarea`,
            type: 'line',
            source: 'route',
            filter: ['==', ['get', 'transportMode'], mode],
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': 'transparent',
              'line-width': 20, // Wide hit area
              'line-opacity': 0,
            },
          });
        }
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

      // Add source for editable path nodes (native Mapbox circles)
      map.addSource('edit-nodes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Layer for intermediate draggable nodes (not endpoints)
      map.addLayer({
        id: 'edit-nodes-layer',
        type: 'circle',
        source: 'edit-nodes',
        filter: ['==', ['get', 'type'], 'node'],
        paint: {
          'circle-radius': 8,
          'circle-color': '#3B82F6',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      // Layer for midpoints (smaller, for adding new nodes)
      map.addLayer({
        id: 'edit-midpoints-layer',
        type: 'circle',
        source: 'edit-nodes',
        filter: ['==', ['get', 'type'], 'midpoint'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#9CA3AF',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
          'circle-opacity': 0.8,
        },
      });
    });

    // Handle clicks for adding waypoints (uses refs to get current values)
    map.on('click', (e) => {
      if (editModeRef.current === 'add-waypoint') {
        addWaypointRef.current([e.lngLat.lng, e.lngLat.lat]);
      }
    });

    // Handle clicks on route lines in edit-path mode to add draggable nodes
    // Use hitarea layers for easier clicking
    const routeHitLayers = ['route-car-hitarea', 'route-motorcycle-hitarea', 'route-train-hitarea'];
    
    routeHitLayers.forEach(layerId => {
      // Change cursor on hover when in edit mode
      map.on('mouseenter', layerId, () => {
        if (editModeRef.current === 'edit-path') {
          map.getCanvas().style.cursor = 'crosshair';
        }
      });
      
      map.on('mouseleave', layerId, () => {
        if (editModeRef.current === 'edit-path') {
          map.getCanvas().style.cursor = '';
        }
      });

      // Handle click on route line to insert new node
      map.on('click', layerId, (e) => {
        if (editModeRef.current !== 'edit-path') return;
        
        const segment = selectedSegmentRef.current;
        if (!segment) return;

        // Get click coordinates
        const clickCoord: Coordinates = [e.lngLat.lng, e.lngLat.lat];
        
        // Find the best position to insert the new node
        const path = segment.path;
        let bestIndex = 0;
        let minDistance = Infinity;
        
        // Find which segment of the path is closest to the click
        for (let i = 0; i < path.length - 1; i++) {
          const p1 = path[i];
          const p2 = path[i + 1];
          
          // Calculate distance from click to line segment
          const line = turf.lineString([p1, p2]);
          const pt = turf.point(clickCoord);
          const nearestPt = turf.nearestPointOnLine(line, pt);
          const dist = nearestPt.properties.dist || Infinity;
          
          if (dist < minDistance) {
            minDistance = dist;
            bestIndex = i + 1; // Insert after this point
          }
        }
        
        // Insert new node at click position
        const newPath = [...path];
        newPath.splice(bestIndex, 0, clickCoord);
        updateSegmentPathRef.current(segment.id, newPath);
        
        e.preventDefault();
      });
    });

    // ========== Native node dragging system ==========
    let draggingNodeIndex: number | null = null;
    let dragPath: Coordinates[] | null = null;

    // Cursor and hover for draggable nodes
    map.on('mouseenter', 'edit-nodes-layer', () => {
      map.getCanvas().style.cursor = 'grab';
    });
    
    map.on('mouseleave', 'edit-nodes-layer', () => {
      if (draggingNodeIndex === null) {
        map.getCanvas().style.cursor = '';
      }
    });

    // Cursor for midpoints
    map.on('mouseenter', 'edit-midpoints-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'edit-midpoints-layer', () => {
      map.getCanvas().style.cursor = '';
    });

    // Click on midpoint to add new node
    map.on('click', 'edit-midpoints-layer', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const nodeIndex = feature.properties?.nodeIndex;
      const segment = selectedSegmentRef.current;
      
      if (segment && typeof nodeIndex === 'number') {
        const newPath = [...segment.path];
        const coords = (feature.geometry as any).coordinates as Coordinates;
        newPath.splice(nodeIndex + 1, 0, coords);
        updateSegmentPathRef.current(segment.id, newPath);
      }
      
      e.preventDefault();
    });

    // Start dragging a node
    map.on('mousedown', 'edit-nodes-layer', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const nodeIndex = feature.properties?.nodeIndex;
      const segment = selectedSegmentRef.current;
      
      if (segment && typeof nodeIndex === 'number') {
        e.preventDefault();
        draggingNodeIndex = nodeIndex;
        dragPath = [...segment.path];
        map.getCanvas().style.cursor = 'grabbing';
        
        // Disable map dragging while dragging node
        map.dragPan.disable();
      }
    });

    // Drag node
    map.on('mousemove', (e) => {
      if (draggingNodeIndex === null || !dragPath) return;
      
      const segment = selectedSegmentRef.current;
      if (!segment) return;
      
      // Update the path with new position
      dragPath[draggingNodeIndex] = [e.lngLat.lng, e.lngLat.lat];
      
      // Update route visual in real-time
      if (map.getSource('route')) {
        const route = useRouteStore.getState().route;
        const allSegments = route?.segments || [];
        const features = allSegments.map((seg) => ({
          type: 'Feature' as const,
          properties: {
            transportMode: seg.transportMode,
            id: seg.id,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: seg.id === segment.id ? dragPath : seg.path,
          },
        }));
        
        (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features,
        });
      }
      
      // Update the dragged node position
      if (map.getSource('edit-nodes')) {
        const pathLength = dragPath.length;
        const features: GeoJSON.Feature[] = [];
        
        dragPath.forEach((coord, index) => {
          const isEndpoint = index === 0 || index === pathLength - 1;
          if (!isEndpoint) {
            features.push({
              type: 'Feature',
              properties: { type: 'node', nodeIndex: index },
              geometry: { type: 'Point', coordinates: coord },
            });
          }
          
          if (index < pathLength - 1) {
            const nextCoord = dragPath![index + 1];
            features.push({
              type: 'Feature',
              properties: { type: 'midpoint', nodeIndex: index },
              geometry: {
                type: 'Point',
                coordinates: [(coord[0] + nextCoord[0]) / 2, (coord[1] + nextCoord[1]) / 2],
              },
            });
          }
        });
        
        (map.getSource('edit-nodes') as mapboxgl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features,
        });
      }
    });

    // End drag
    map.on('mouseup', () => {
      if (draggingNodeIndex !== null && dragPath) {
        const segment = selectedSegmentRef.current;
        if (segment) {
          updateSegmentPathRef.current(segment.id, dragPath);
        }
        
        draggingNodeIndex = null;
        dragPath = null;
        map.getCanvas().style.cursor = '';
        map.dragPan.enable();
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

  // Update map center/zoom when location is detected
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: mapConfig.center,
      zoom: mapConfig.zoom,
      duration: 1500,
    });
  }, [mapConfig.center, mapConfig.zoom]);

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
    const totalWaypoints = route.waypoints.length;
    
    route.waypoints.forEach((waypoint, index) => {
      const el = document.createElement('div');
      const isFirst = index === 0;
      const isLast = index === totalWaypoints - 1 && totalWaypoints > 1;
      const isSelected = selectedWaypointId === waypoint.id;
      
      // Different marker types: start, finish, intermediate
      let markerType = 'intermediate';
      let markerContent = '';
      
      if (isFirst) {
        markerType = 'start';
        // Play/Start icon
        markerContent = `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M8 5v14l11-7z"/>
        </svg>`;
      } else if (isLast) {
        markerType = 'finish';
        // Flag icon
        markerContent = `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
        </svg>`;
      } else {
        // Intermediate point - just a dot
        markerContent = `<div class="waypoint-dot"></div>`;
      }
      
      el.className = `waypoint-marker waypoint-${markerType}`;
      el.innerHTML = `
        <div class="waypoint-marker-inner ${isSelected ? 'selected' : ''}">
          ${markerContent}
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

  // Update path nodes for editing using native Mapbox layers
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getSource('edit-nodes')) return;

    // Clear nodes if not in edit mode
    if (editMode !== 'edit-path' || !selectedSegment) {
      (mapRef.current.getSource('edit-nodes') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [],
      });
      return;
    }

    const path = selectedSegment.path;
    if (path.length < 2) return;

    // Build features for nodes and midpoints
    const features: GeoJSON.Feature[] = [];
    
    path.forEach((coord, index) => {
      const isEndpoint = index === 0 || index === path.length - 1;
      
      // Only add intermediate nodes (not endpoints)
      if (!isEndpoint) {
        features.push({
          type: 'Feature',
          properties: { type: 'node', nodeIndex: index },
          geometry: { type: 'Point', coordinates: coord },
        });
      }
      
      // Add midpoint between this and next node (for adding new nodes)
      if (index < path.length - 1) {
        const nextCoord = path[index + 1];
        features.push({
          type: 'Feature',
          properties: { type: 'midpoint', nodeIndex: index },
          geometry: {
            type: 'Point',
            coordinates: [(coord[0] + nextCoord[0]) / 2, (coord[1] + nextCoord[1]) / 2],
          },
        });
      }
    });

    (mapRef.current.getSource('edit-nodes') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features,
    });
  }, [editMode, selectedSegment?.id, selectedSegment?.path]);

  // Update route lines with smooth curves
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
        // Apply smoothing to the path for visual display
        coordinates: smoothPath(segment.path, segment.transportMode),
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
