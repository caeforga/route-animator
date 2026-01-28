import { useEffect, useState } from 'react';
import { useRouteStore } from '@/store/routeStore';
import { CAPITAL_COORDINATES, DEFAULT_COUNTRY_CODE } from '@/config/capitals';
import { Coordinates } from '@/types';

/**
 * Hook to detect user's country via IP geolocation
 * and center the map on their country's capital
 * 
 * Uses free ipapi.co service (no API key required, 1000 requests/day)
 * Falls back to default country (Spain) if detection fails
 */

interface GeoLocationState {
  isLoading: boolean;
  countryCode: string | null;
  capitalName: string | null;
  coordinates: Coordinates | null;
  error: string | null;
}

export function useGeoLocation() {
  const [state, setState] = useState<GeoLocationState>({
    isLoading: true,
    countryCode: null,
    capitalName: null,
    coordinates: null,
    error: null,
  });

  const { setMapView } = useRouteStore();

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Use ipapi.co for IP geolocation (free, no API key needed)
        const response = await fetch('https://ipapi.co/json/', {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch location');
        }

        const data = await response.json();
        const countryCode = data.country_code?.toUpperCase();

        if (countryCode && CAPITAL_COORDINATES[countryCode]) {
          const capital = CAPITAL_COORDINATES[countryCode];
          
          setState({
            isLoading: false,
            countryCode,
            capitalName: capital.name,
            coordinates: capital.coordinates,
            error: null,
          });

          // Update map center to user's country capital
          setMapView(capital.coordinates, 6);
        } else {
          // Country not in our list, use default
          const defaultCapital = CAPITAL_COORDINATES[DEFAULT_COUNTRY_CODE];
          setState({
            isLoading: false,
            countryCode: DEFAULT_COUNTRY_CODE,
            capitalName: defaultCapital.name,
            coordinates: defaultCapital.coordinates,
            error: null,
          });
          setMapView(defaultCapital.coordinates, 6);
        }
      } catch (error) {
        console.warn('Could not detect location, using default:', error);
        
        // Use default on error
        const defaultCapital = CAPITAL_COORDINATES[DEFAULT_COUNTRY_CODE];
        setState({
          isLoading: false,
          countryCode: DEFAULT_COUNTRY_CODE,
          capitalName: defaultCapital.name,
          coordinates: defaultCapital.coordinates,
          error: 'Could not detect location',
        });
        setMapView(defaultCapital.coordinates, 6);
      }
    };

    detectLocation();
  }, [setMapView]);

  return state;
}
