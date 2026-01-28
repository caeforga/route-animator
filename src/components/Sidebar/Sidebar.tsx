import { useRouteStore } from '@/store/routeStore';
import { WaypointPanel } from './WaypointPanel';
import { AnimationPanel } from './AnimationPanel';
import { ExportPanel } from './ExportPanel';
import { SettingsPanel } from './SettingsPanel';
import { 
  MapPin, 
  Play, 
  Download, 
  Settings, 
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';

/**
 * Main sidebar component with tab navigation
 */

const TABS = [
  { id: 'waypoints', label: 'Puntos', icon: MapPin },
  { id: 'animation', label: 'Animación', icon: Play },
  { id: 'export', label: 'Exportar', icon: Download },
  { id: 'settings', label: 'Ajustes', icon: Settings },
] as const;

export function Sidebar() {
  const { ui, setActivePanel, toggleSidebar } = useRouteStore();
  const { sidebarOpen, activePanel } = ui;

  const renderPanel = () => {
    switch (activePanel) {
      case 'waypoints':
        return <WaypointPanel />;
      case 'animation':
        return <AnimationPanel />;
      case 'export':
        return <ExportPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <WaypointPanel />;
    }
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <button 
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
      >
        {sidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {sidebarOpen ? (
        <>
          <nav className="sidebar-tabs">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`sidebar-tab ${activePanel === id ? 'active' : ''}`}
                onClick={() => setActivePanel(id)}
                title={label}
              >
                <Icon size={20} />
                <span className="sidebar-tab-label">{label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-content">
            {renderPanel()}
          </div>
        </>
      ) : (
        /* Collapsed sidebar - show vertical icon buttons */
        <nav className="sidebar-collapsed-nav">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`sidebar-collapsed-btn ${activePanel === id ? 'active' : ''}`}
              onClick={() => {
                setActivePanel(id);
                toggleSidebar();
              }}
              title={label}
            >
              <Icon size={20} />
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
