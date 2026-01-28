import { TransportConfig, TransportMode } from '@/types';

/**
 * Transport mode configurations
 * 
 * Speed values are relative units for animation (pixels per frame at 60fps)
 * In a real app, these would map to actual speeds for duration calculations
 */
export const TRANSPORT_CONFIGS: Record<TransportMode, TransportConfig> = {
  car: {
    mode: 'car',
    label: 'Coche',
    icon: '🚗',
    color: '#3B82F6', // blue-500
    speed: 2,
    lineStyle: 'solid',
    lineWidth: 4,
  },
  motorcycle: {
    mode: 'motorcycle',
    label: 'Moto',
    icon: '🏍️',
    color: '#F97316', // orange-500
    speed: 2.5,
    lineStyle: 'solid',
    lineWidth: 3,
  },
  train: {
    mode: 'train',
    label: 'Tren',
    icon: '🚂',
    color: '#10B981', // emerald-500
    speed: 3,
    lineStyle: 'dashed',
    lineWidth: 5,
  },
  plane: {
    mode: 'plane',
    label: 'Avión',
    icon: '✈️',
    color: '#8B5CF6', // violet-500
    speed: 5,
    lineStyle: 'dashed',
    lineWidth: 3,
  },
};

export const getTransportConfig = (mode: TransportMode): TransportConfig => {
  return TRANSPORT_CONFIGS[mode];
};

export const TRANSPORT_MODES: TransportMode[] = ['car', 'motorcycle', 'train', 'plane'];
