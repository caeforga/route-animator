import { useCallback, useRef } from 'react';
import { useRouteStore } from '@/store/routeStore';
import { EXPORT_QUALITY_PRESETS } from '@/config/map';

/**
 * Video export hook using Canvas + MediaRecorder API
 * 
 * Limitations:
 * - MP4 requires additional encoding (WebM is native)
 * - Quality depends on browser MediaRecorder support
 * - Large exports may hit memory limits
 * 
 * TODO: Consider server-side encoding for MP4 support
 * TODO: Add progress streaming for large exports
 */

export function useVideoExport() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { exportConfig, setExporting } = useRouteStore();

  const startRecording = useCallback(
    (canvas: HTMLCanvasElement, onComplete: (blob: Blob) => void) => {
      const { quality, fps, format } = exportConfig;
      const preset = EXPORT_QUALITY_PRESETS[quality];

      // Create off-screen canvas at export resolution
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = preset.width;
      exportCanvas.height = preset.height;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }

      // Setup MediaRecorder
      const stream = exportCanvas.captureStream(fps);
      
      // Determine MIME type
      // Note: MP4 not natively supported, would need transcoding
      const mimeType = format === 'webm' 
        ? 'video/webm;codecs=vp9'
        : 'video/webm'; // Fallback to WebM even if MP4 requested

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn(`${mimeType} not supported, falling back to default`);
      }

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
        onComplete(blob);
        setExporting(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setExporting(true, 0);

      // Return function to capture frame
      return {
        captureFrame: () => {
          ctx.drawImage(
            canvas,
            0, 0, canvas.width, canvas.height,
            0, 0, preset.width, preset.height
          );
        },
        updateProgress: (progress: number) => {
          setExporting(true, progress);
        },
      };
    },
    [exportConfig, setExporting]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const downloadVideo = useCallback((blob: Blob, filename = 'route-animation') => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    startRecording,
    stopRecording,
    downloadVideo,
    exportConfig,
  };
}
