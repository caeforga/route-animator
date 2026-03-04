import { useRouteStore } from '@/store/routeStore';
import { useAnimation } from '@/hooks/useAnimation';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Clock,
  Video,
  VideoOff,
  ZoomIn
} from 'lucide-react';

/**
 * Animation controls panel
 * 
 * Features:
 * - Play/Pause controls
 * - Reset to beginning
 * - Progress slider (scrubbing updates map in real-time)
 * - Duration control (5-30 seconds)
 */

export function AnimationPanel() {
  const { route, setAnimationProgress, setAnimationDuration, setCameraFollow, setCameraZoomExtra } = useRouteStore();
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

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setAnimationDuration(value);
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

          {/* Duration Control */}
          <div className="animation-duration">
            <label className="form-label">
              <Clock size={16} />
              Duración: {animation.duration}s
            </label>
            <div className="duration-slider-container">
              <span className="duration-label">5s</span>
              <input
                type="range"
                min="5"
                max="30"
                value={animation.duration}
                onChange={handleDurationChange}
                className="slider duration-slider"
              />
              <span className="duration-label">30s</span>
            </div>
          </div>

          {/* Camera Follow Toggle */}
          <div className="animation-camera">
            <label className="form-label">
              {animation.cameraFollow ? <Video size={16} /> : <VideoOff size={16} />}
              Cámara cinemática
            </label>
            <button
              className={`btn btn-sm ${animation.cameraFollow ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCameraFollow(!animation.cameraFollow)}
              disabled={isPlaying}
              title={animation.cameraFollow ? 'Desactivar seguimiento de cámara' : 'Activar seguimiento de cámara'}
            >
              {animation.cameraFollow ? 'Activado' : 'Desactivado'}
            </button>
          </div>

          {/* Camera Zoom Control (only when camera follow is on) */}
          {animation.cameraFollow && (
            <div className="animation-camera-zoom">
              <label className="form-label">
                <ZoomIn size={16} />
                Acercamiento: +{animation.cameraZoomExtra}
              </label>
              <div className="duration-slider-container">
                <span className="duration-label">Lejos</span>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={animation.cameraZoomExtra}
                  onChange={(e) => setCameraZoomExtra(parseInt(e.target.value, 10))}
                  className="slider duration-slider"
                />
                <span className="duration-label">Cerca</span>
              </div>
            </div>
          )}

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
