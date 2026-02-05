import { useEffect, useRef, useCallback } from 'react';
import { useRouteStore } from '@/store/routeStore';
import { Coordinates } from '@/types';
import * as turf from '@turf/turf';

/**
 * Animation hook for route playback
 * 
 * Uses requestAnimationFrame for smooth 60fps animation
 * Calculates marker position along the path using Turf.js
 */

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
    const smoothed = turf.bezierSpline(line, { resolution: 10000, sharpness: 0.85 });
    return smoothed.geometry.coordinates as Coordinates[];
  } catch (e) {
    return coordinates;
  }
}

export interface AnimationFrame {
  markerPosition: Coordinates;
  currentSegmentIndex: number;
  drawnPath: Coordinates[];
  progress: number;
}

export function useAnimation() {
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const {
    route,
    animation,
    updateAnimationFrame,
    playAnimation,
    pauseAnimation,
    stopAnimation,
  } = useRouteStore();

  // Animation loop
  useEffect(() => {
    if (!animation.isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }

      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      updateAnimationFrame(deltaTime);

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animation.isPlaying, updateAnimationFrame]);

  // Calculate current animation frame data
  const getAnimationFrame = useCallback((): AnimationFrame | null => {
    if (!route || route.segments.length === 0) return null;

    const { currentSegmentIndex, segmentProgress, currentProgress } = animation;
    const currentSegment = route.segments[currentSegmentIndex];
    
    if (!currentSegment || currentSegment.path.length < 2) {
      return null;
    }

    // Apply smoothing to the current segment path for smooth animation
    const smoothedPath = smoothPath(currentSegment.path, currentSegment.transportMode);

    // Create a line from the smoothed segment path
    const line = turf.lineString(smoothedPath);
    const totalLength = turf.length(line, { units: 'kilometers' });
    const currentDistance = totalLength * segmentProgress;

    // Get point along the line
    const point = turf.along(line, currentDistance, { units: 'kilometers' });
    const markerPosition = point.geometry.coordinates as Coordinates;

    // Calculate drawn path (all completed segments + partial current segment)
    const drawnPath: Coordinates[] = [];
    
    // Add all completed segments (smoothed)
    for (let i = 0; i < currentSegmentIndex; i++) {
      const seg = route.segments[i];
      drawnPath.push(...smoothPath(seg.path, seg.transportMode));
    }

    // Add partial current segment (smoothed)
    if (smoothedPath.length > 0) {
      const slicedLine = turf.lineSlice(
        turf.point(smoothedPath[0]),
        point,
        line
      );
      drawnPath.push(...(slicedLine.geometry.coordinates as Coordinates[]));
    }

    return {
      markerPosition,
      currentSegmentIndex,
      drawnPath,
      progress: currentProgress,
    };
  }, [route, animation]);

  return {
    animation,
    getAnimationFrame,
    play: playAnimation,
    pause: pauseAnimation,
    stop: stopAnimation,
    isPlaying: animation.isPlaying,
    isPaused: animation.isPaused,
    progress: animation.currentProgress,
  };
}
