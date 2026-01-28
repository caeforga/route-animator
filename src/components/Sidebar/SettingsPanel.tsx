import { useRouteStore } from '@/store/routeStore';
import { MAP_STYLE_LABELS } from '@/config/map';
import { MapStyle } from '@/types';
import { 
  Map, 
  Trash2,
  Save,
  Upload
} from 'lucide-react';

/**
 * Settings panel for map configuration and route management
 * 
 * Features:
 * - Map style selection
 * - Save/Load route (localStorage for MVP)
 * - Clear route
 * 
 * TODO: Add cloud storage integration
 * TODO: Add multiple saved routes
 */

const MAP_STYLES: MapStyle[] = [
  'streets',
  'outdoors', 
  'light',
  'dark',
  'satellite',
  'satellite-streets'
];

export function SettingsPanel() {
  const { 
    route, 
    mapConfig, 
    setMapStyle, 
    clearRoute,
    loadRoute 
  } = useRouteStore();

  const handleStyleChange = (style: MapStyle) => {
    setMapStyle(style);
  };

  const handleSaveRoute = () => {
    if (!route) return;
    
    const routeJson = JSON.stringify(route);
    localStorage.setItem('savedRoute', routeJson);
    
    // Also offer download
    const blob = new Blob([routeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name || 'route'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadRoute = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const routeData = JSON.parse(text);
        
        // Basic validation
        if (routeData.waypoints && routeData.segments) {
          loadRoute({
            ...routeData,
            createdAt: new Date(routeData.createdAt),
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Error loading route:', error);
        alert('Error al cargar el archivo. Asegúrate de que sea un archivo de ruta válido.');
      }
    };

    input.click();
  };

  const handleClearRoute = () => {
    if (confirm('¿Estás seguro de que quieres borrar la ruta actual?')) {
      clearRoute();
    }
  };

  return (
    <div className="panel settings-panel">
      <div className="panel-header">
        <h2>Ajustes</h2>
      </div>

      {/* Map Style Selection */}
      <div className="form-group">
        <label className="form-label">
          <Map size={16} />
          Estilo del Mapa
        </label>
        <div className="style-grid">
          {MAP_STYLES.map((style) => (
            <button
              key={style}
              className={`style-btn ${mapConfig.style === style ? 'active' : ''}`}
              onClick={() => handleStyleChange(style)}
            >
              <div className={`style-preview style-preview-${style}`} />
              <span>{MAP_STYLE_LABELS[style]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Route Management */}
      <div className="form-group">
        <label className="form-label">Gestión de Ruta</label>
        
        <div className="button-stack">
          <button
            className="btn btn-secondary"
            onClick={handleSaveRoute}
            disabled={!route}
          >
            <Save size={18} />
            Guardar Ruta
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleLoadRoute}
          >
            <Upload size={18} />
            Cargar Ruta
          </button>

          <button
            className="btn btn-danger"
            onClick={handleClearRoute}
            disabled={!route}
          >
            <Trash2 size={18} />
            Borrar Ruta
          </button>
        </div>
      </div>

      {/* Route Info */}
      {route && (
        <div className="route-info">
          <h3>Información de la Ruta</h3>
          <div className="info-row">
            <span>Nombre:</span>
            <span>{route.name}</span>
          </div>
          <div className="info-row">
            <span>Puntos:</span>
            <span>{route.waypoints.length}</span>
          </div>
          <div className="info-row">
            <span>Segmentos:</span>
            <span>{route.segments.length}</span>
          </div>
          <div className="info-row">
            <span>Creada:</span>
            <span>{new Date(route.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* Future Features */}
      <div className="future-features">
        <h3>Próximamente</h3>
        <ul>
          <li>☁️ Almacenamiento en la nube</li>
          <li>👥 Compartir rutas</li>
          <li>🎨 Estilos de mapa personalizados</li>
          <li>📊 Estadísticas de ruta</li>
        </ul>
      </div>
    </div>
  );
}
