import { useState } from 'react';
import { useRouteStore } from '@/store/routeStore';
import { useRouting } from '@/hooks/useRouting';
import { TRANSPORT_CONFIGS, TRANSPORT_MODES } from '@/config/transport';
import { TransportMode } from '@/types';
import { 
  Plus, 
  Trash2, 
  GripVertical,
  Navigation,
  Route
} from 'lucide-react';

/**
 * Waypoint management panel
 * 
 * Features:
 * - Add/remove waypoints
 * - Reorder waypoints (drag & drop could be added)
 * - Change transport mode per segment
 * - Fetch actual routes
 */

export function WaypointPanel() {
  const {
    route,
    editMode,
    setEditMode,
    createRoute,
    removeWaypoint,
    selectedWaypointId,
    selectWaypoint,
    updateSegmentTransport,
    updateSegmentPath,
  } = useRouteStore();

  const { fetchRoute } = useRouting();
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const handleCreateRoute = () => {
    createRoute('Nueva Ruta');
    setEditMode('add-waypoint');
  };

  const handleToggleAddMode = () => {
    setEditMode(editMode === 'add-waypoint' ? 'select' : 'add-waypoint');
  };

  const handleFetchRoutes = async () => {
    if (!route || route.segments.length === 0) return;

    setIsLoadingRoute(true);

    try {
      for (const segment of route.segments) {
        const startWp = route.waypoints.find(wp => wp.id === segment.startWaypointId);
        const endWp = route.waypoints.find(wp => wp.id === segment.endWaypointId);

        if (startWp && endWp) {
          const path = await fetchRoute(
            startWp.coordinates,
            endWp.coordinates,
            segment.transportMode
          );
          updateSegmentPath(segment.id, path);
        }
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleTransportChange = (segmentId: string, mode: TransportMode) => {
    updateSegmentTransport(segmentId, mode);
  };

  if (!route) {
    return (
      <div className="panel-empty">
        <Route size={48} className="panel-empty-icon" />
        <h3>Sin ruta activa</h3>
        <p>Crea una nueva ruta para empezar a añadir puntos</p>
        <button className="btn btn-primary" onClick={handleCreateRoute}>
          <Plus size={20} />
          Crear Ruta
        </button>
      </div>
    );
  }

  return (
    <div className="panel waypoint-panel">
      <div className="panel-header">
        <h2>{route.name}</h2>
        <span className="badge">{route.waypoints.length} puntos</span>
      </div>

      <div className="panel-actions">
        <button
          className={`btn ${editMode === 'add-waypoint' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleToggleAddMode}
        >
          <Plus size={18} />
          {editMode === 'add-waypoint' ? 'Añadiendo...' : 'Añadir punto'}
        </button>

        {route.segments.length > 0 && (
          <button
            className="btn btn-secondary"
            onClick={handleFetchRoutes}
            disabled={isLoadingRoute}
          >
            <Navigation size={18} />
            {isLoadingRoute ? 'Cargando...' : 'Calcular rutas'}
          </button>
        )}
      </div>

      {editMode === 'add-waypoint' && (
        <div className="info-box">
          <p>Haz clic en el mapa para añadir puntos</p>
        </div>
      )}

      <div className="waypoint-list">
        {route.waypoints.map((waypoint, index) => (
          <div key={waypoint.id} className="waypoint-item-wrapper">
            <div
              className={`waypoint-item ${selectedWaypointId === waypoint.id ? 'selected' : ''}`}
              onClick={() => selectWaypoint(waypoint.id)}
            >
              <div className="waypoint-item-drag">
                <GripVertical size={16} />
              </div>
              <div className="waypoint-item-number">{index + 1}</div>
              <div className="waypoint-item-content">
                <span className="waypoint-item-label">
                  {waypoint.label || `Punto ${index + 1}`}
                </span>
                <span className="waypoint-item-coords">
                  {waypoint.coordinates[1].toFixed(4)}, {waypoint.coordinates[0].toFixed(4)}
                </span>
              </div>
              <button
                className="btn-icon btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  removeWaypoint(waypoint.id);
                }}
                title="Eliminar punto"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Segment transport selector (between waypoints) */}
            {index < route.waypoints.length - 1 && (
              <div className="segment-transport">
                <span className="segment-line" />
                <div className="transport-selector">
                  {TRANSPORT_MODES.map((mode) => {
                    const config = TRANSPORT_CONFIGS[mode];
                    const segment = route.segments.find(
                      s => s.startWaypointId === waypoint.id
                    );
                    const isActive = segment?.transportMode === mode;

                    return (
                      <button
                        key={mode}
                        className={`transport-btn ${isActive ? 'active' : ''}`}
                        onClick={() => segment && handleTransportChange(segment.id, mode)}
                        title={config.label}
                        style={{ 
                          borderColor: isActive ? config.color : undefined,
                          backgroundColor: isActive ? `${config.color}20` : undefined,
                        }}
                      >
                        {config.icon}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {route.waypoints.length === 0 && (
          <div className="waypoint-list-empty">
            <p>No hay puntos en la ruta</p>
            <p className="text-muted">Haz clic en "Añadir punto" y luego en el mapa</p>
          </div>
        )}
      </div>
    </div>
  );
}
