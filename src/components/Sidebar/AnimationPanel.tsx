import { useRouteStore } from '@/store/routeStore';
import { useAnimation } from '@/hooks/useAnimation';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Gauge
} from 'lucide-react';

/**
 * Animation controls panel
 * 
 * Features:
 * - Play/Pause controls
 * - Reset to beginning
 * - Progress slider (scrubbing updates map in real-time)
 * - Speed control
 */

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

export function AnimationPanel() {
  const { route, setAnimationProgress, setAnimationSpeed } = useRouteStore();
  const { 
    animation, 
    play, 
    pause, 
    stop, 
    isPlaying, 
    progress 
  } = useAnimation();

  const hasRoute = route && route.segments.length > 0;
  const progressPercent = Math.round(progress * 100);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) / 100;
    setAnimationProgress(value);
  };

  const handleSpeedChange = (speed: number) => {
    setAnimationSpeed(speed);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleReset = () => {
    stop(); // This resets to beginning
  };

  return (
    <div className="panel animation-panel">
      <div className="panel-header">
        <h2>Animación</h2>
      </div>

      {!hasRoute ? (
        <div className="panel-message">
          <p>Añade al menos 2 puntos para poder animar la ruta</p>
        </div>
      ) : (
        <>
          {/* Playback Controls */}
          <div className="animation-controls">
            <button
              className="btn btn-icon btn-secondary"
              onClick={handleReset}
              disabled={progress === 0}
              title="Volver al inicio"
            >
              <RotateCcw size={20} />
            </button>

            <button
              className="btn btn-play"
              onClick={handlePlayPause}
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
          </div>

          {/* Progress Slider */}
          <div className="animation-progress">
            <label className="form-label">
              Progreso: {progressPercent}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progressPercent}
              onChange={handleProgressChange}
              className="slider"
            />
          </div>

          {/* Speed Control */}
          <div className="animation-speed">
            <label className="form-label">
              <Gauge size={16} />
              Velocidad
            </label>
            <div className="speed-buttons">
              {SPEED_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`btn btn-speed ${animation.speed === value ? 'active' : ''}`}
                  onClick={() => handleSpeedChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Animation Info */}
          <div className="animation-info">
            <div className="info-row">
              <span>Segmento actual:</span>
              <span>{animation.currentSegmentIndex + 1} / {route.segments.length}</span>
            </div>
            <div className="info-row">
              <span>Estado:</span>
              <span className={`status ${isPlaying ? 'playing' : 'stopped'}`}>
                {isPlaying ? 'Reproduciendo' : 'Detenido'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
