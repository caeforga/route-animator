import { useState, useRef, useCallback } from 'react';
import { useRouteStore } from '@/store/routeStore';
import { useAnimation } from '@/hooks/useAnimation';
import { EXPORT_QUALITY_PRESETS } from '@/config/map';
import { ExportConfig } from '@/types';
import { 
  Download, 
  Film,
  Loader2
} from 'lucide-react';

/**
 * Video export panel
 * 
 * Uses Canvas + MediaRecorder for client-side video generation
 * 
 * Limitations:
 * - Only WebM supported natively (MP4 needs transcoding)
 * - Quality depends on browser support
 * - May be slow for long animations
 * 
 * TODO: Add server-side encoding for better format support
 * TODO: Add preview before export
 */

export function ExportPanel() {
  const { route, exportConfig, setExportConfig, ui, setExporting } = useRouteStore();
  const { play, stop, progress } = useAnimation();
  
  const [isExporting, setIsExportingLocal] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const hasRoute = route && route.segments.length > 0;

  const handleConfigChange = (key: keyof ExportConfig, value: any) => {
    setExportConfig({ [key]: value });
  };

  const handleExport = useCallback(async () => {
    if (!hasRoute) return;

    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    // Find the map canvas
    const mapCanvas = mapContainer.querySelector('canvas');
    if (!mapCanvas) {
      console.error('Could not find map canvas');
      return;
    }

    setIsExportingLocal(true);
    setExporting(true, 0);

    try {
      const preset = EXPORT_QUALITY_PRESETS[exportConfig.quality];
      
      // Create export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = preset.width;
      exportCanvas.height = preset.height;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Setup MediaRecorder
      const stream = exportCanvas.captureStream(exportConfig.fps);
      const mimeType = 'video/webm;codecs=vp9';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
        videoBitsPerSecond: preset.bitrate,
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        downloadBlob(blob, `${route?.name || 'route'}-animation.webm`);
        setIsExportingLocal(false);
        setExporting(false);
        stop();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);

      // Start animation and capture frames
      stop(); // Reset animation
      play();

      const captureFrame = () => {
        // Draw map canvas to export canvas (scaled)
        ctx.drawImage(
          mapCanvas,
          0, 0, mapCanvas.width, mapCanvas.height,
          0, 0, preset.width, preset.height
        );

        // Update progress
        setExporting(true, progress);
      };

      // Capture loop
      const frameInterval = 1000 / exportConfig.fps;
      const captureInterval = setInterval(() => {
        captureFrame();

        // Check if animation is complete
        if (progress >= 0.99) {
          clearInterval(captureInterval);
          setTimeout(() => {
            mediaRecorder.stop();
          }, 500); // Small delay to capture final frames
        }
      }, frameInterval);

      // Safety timeout (max 5 minutes)
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          clearInterval(captureInterval);
          mediaRecorder.stop();
        }
      }, 300000);

    } catch (error) {
      console.error('Export error:', error);
      setIsExportingLocal(false);
      setExporting(false);
    }
  }, [hasRoute, exportConfig, route, play, stop, progress, setExporting]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const qualityInfo = EXPORT_QUALITY_PRESETS[exportConfig.quality];

  return (
    <div className="panel export-panel">
      <div className="panel-header">
        <h2>Exportar Video</h2>
      </div>

      {!hasRoute ? (
        <div className="panel-message">
          <p>Añade una ruta para poder exportar el video</p>
        </div>
      ) : (
        <>
          {/* Format Selection */}
          <div className="form-group">
            <label className="form-label">Formato</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="format"
                  value="webm"
                  checked={exportConfig.format === 'webm'}
                  onChange={() => handleConfigChange('format', 'webm')}
                />
                <span>WebM</span>
                <span className="badge badge-success">Recomendado</span>
              </label>
              <label className="radio-label disabled">
                <input
                  type="radio"
                  name="format"
                  value="mp4"
                  disabled
                />
                <span>MP4</span>
                <span className="badge badge-muted">Próximamente</span>
              </label>
            </div>
          </div>

          {/* Quality Selection */}
          <div className="form-group">
            <label className="form-label">Calidad</label>
            <div className="quality-options">
              {(['low', 'medium', 'high'] as const).map((quality) => {
                const preset = EXPORT_QUALITY_PRESETS[quality];
                return (
                  <button
                    key={quality}
                    className={`quality-btn ${exportConfig.quality === quality ? 'active' : ''}`}
                    onClick={() => handleConfigChange('quality', quality)}
                  >
                    <span className="quality-name">
                      {quality === 'low' ? 'Baja' : quality === 'medium' ? 'Media' : 'Alta'}
                    </span>
                    <span className="quality-resolution">
                      {preset.width}x{preset.height}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FPS Selection */}
          <div className="form-group">
            <label className="form-label">FPS</label>
            <select
              className="select"
              value={exportConfig.fps}
              onChange={(e) => handleConfigChange('fps', parseInt(e.target.value))}
            >
              <option value={24}>24 fps</option>
              <option value={30}>30 fps</option>
              <option value={60}>60 fps</option>
            </select>
          </div>

          {/* Export Info */}
          <div className="export-info">
            <div className="info-row">
              <span>Resolución:</span>
              <span>{qualityInfo.width} x {qualityInfo.height}</span>
            </div>
            <div className="info-row">
              <span>Bitrate:</span>
              <span>{(qualityInfo.bitrate / 1000000).toFixed(1)} Mbps</span>
            </div>
          </div>

          {/* Export Button */}
          <button
            className="btn btn-primary btn-export"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 size={20} className="spinning" />
                Exportando... {Math.round(ui.exportProgress * 100)}%
              </>
            ) : (
              <>
                <Film size={20} />
                Exportar Video
              </>
            )}
          </button>

          {isExporting && (
            <div className="export-progress">
              <div 
                className="export-progress-bar"
                style={{ width: `${ui.exportProgress * 100}%` }}
              />
            </div>
          )}

          <p className="text-muted text-sm">
            El video se descargará automáticamente cuando termine la exportación.
          </p>
        </>
      )}
    </div>
  );
}
