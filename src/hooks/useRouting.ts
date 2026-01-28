import { useCallback } from 'react';
import { Coordinates, TransportMode } from '@/types';
import { MAPBOX_ACCESS_TOKEN } from '@/config/map';

/**
 * Hook for fetching routes from Mapbox Directions API
 * 
 * Transport mode mapping:
 * - car/motorcycle -> driving
 * - train -> Not directly supported, uses driving as approximation
 * - plane -> Direct line (great circle would be better for production)
 * 
 * TODO: Implement proper train routes using rail network data
 * TODO: Implement great circle paths for planes
 */

type MapboxProfile = 'driving' | 'walking' | 'cycling' | 'driving-traffic';

const getMapboxProfile = (mode: TransportMode): MapboxProfile => {
  switch (mode) {
    case 'car':
    case 'motorcycle':
    case 'train': // Approximation - train routes not available
      return 'driving';
    case 'plane':
      return 'driving'; // Will be replaced with direct line
    default:
      return 'driving';
  }
};

export function useRouting() {
  const fetchRoute = useCallback(
    async (
      start: Coordinates,
      end: Coordinates,
      mode: TransportMode
    ): Promise<Coordinates[]> => {
      // For planes, return direct line (could be great circle in production)
      if (mode === 'plane') {
        return generateArcPath(start, end);
      }

      const profile = getMapboxProfile(mode);
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch route');
        }

        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          return data.routes[0].geometry.coordinates as Coordinates[];
        }

        // Fallback to direct line if no route found
        return [start, end];
      } catch (error) {
        console.error('Routing error:', error);
        // Fallback to direct line
        return [start, end];
      }
    },
    []
  );

  return { fetchRoute };
}

/**
 * Generate an arc path between two points (for plane routes)
 * Creates a curved line that looks like a flight path
 */
function generateArcPath(start: Coordinates, end: Coordinates, numPoints = 50): Coordinates[] {
  const points: Coordinates[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    
    // Linear interpolation for longitude and latitude
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    
    // Add curvature (parabolic arc)
    // The arc height is proportional to the distance
    const distance = Math.sqrt(
      Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
    );
    const arcHeight = distance * 0.1; // 10% of distance as height
    const arc = arcHeight * Math.sin(Math.PI * t);
    
    // For simplicity, we add the arc to latitude
    // In production, this should account for map projection
    points.push([lng, lat + arc]);
  }
  
  return points;
}
