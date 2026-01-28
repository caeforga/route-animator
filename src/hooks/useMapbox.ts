import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useRouteStore } from '@/store/routeStore';
import { MAPBOX_ACCESS_TOKEN, MAP_STYLES } from '@/config/map';
import { Coordinates } from '@/types';

/**
 * Custom hook for Mapbox GL JS integration
 * 
 * Handles:
 * - Map initialization and cleanup
 * - Style changes
 * - Click events for waypoint creation
 * - Marker and layer management
 */

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

export function useMapbox(containerRef: React.RefObject<HTMLDivElement>) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { mapConfig, editMode, addWaypoint } = useRouteStore();

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES[mapConfig.style],
      center: mapConfig.center,
      zoom: mapConfig.zoom,
      bearing: mapConfig.bearing,
      pitch: mapConfig.pitch,
      preserveDrawingBuffer: true, // Required for canvas export
    });

    map.on('load', () => {
      setIsLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [containerRef]);

  // Update style when changed
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    mapRef.current.setStyle(MAP_STYLES[mapConfig.style]);
  }, [mapConfig.style, isLoaded]);

  // Handle map clicks for adding waypoints
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (editMode === 'add-waypoint') {
        const { lng, lat } = e.lngLat;
        addWaypoint([lng, lat]);
      }
    };

    mapRef.current.on('click', handleClick);

    return () => {
      mapRef.current?.off('click', handleClick);
    };
  }, [editMode, addWaypoint, isLoaded]);

  // Update cursor based on edit mode
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    
    const canvas = mapRef.current.getCanvas();
    canvas.style.cursor = editMode === 'add-waypoint' ? 'crosshair' : '';
  }, [editMode, isLoaded]);

  const flyTo = useCallback((coordinates: Coordinates, zoom?: number) => {
    mapRef.current?.flyTo({
      center: coordinates,
      zoom: zoom || mapRef.current.getZoom(),
      duration: 1000,
    });
  }, []);

  const fitBounds = useCallback((coordinates: Coordinates[], padding = 100) => {
    if (coordinates.length === 0) return;

    const bounds = coordinates.reduce(
      (bounds, coord) => bounds.extend(coord as [number, number]),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
    );

    mapRef.current?.fitBounds(bounds, { padding });
  }, []);

  const getCanvas = useCallback(() => {
    return mapRef.current?.getCanvas();
  }, []);

  return {
    map: mapRef.current,
    isLoaded,
    flyTo,
    fitBounds,
    getCanvas,
  };
}
