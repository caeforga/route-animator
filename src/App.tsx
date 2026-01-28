import { MapContainer } from '@/components/Map';
import { Sidebar } from '@/components/Sidebar';

/**
 * Route Animator - Main Application Component
 * 
 * A web application for creating animated travel routes on a map
 * and exporting them as video.
 * 
 * Architecture:
 * - MapContainer: Handles Mapbox integration, markers, and animation rendering
 * - Sidebar: Contains all controls organized in tabs
 * - Zustand store: Centralized state management
 * 
 * MVP Scope:
 * - [x] Interactive map with Mapbox GL JS
 * - [x] Add/edit waypoints
 * - [x] Multiple transport modes per segment
 * - [x] Route animation with moving marker
 * - [x] Video export via Canvas + MediaRecorder
 * 
 * TODOs for SaaS Scaling:
 * - [ ] Backend API for route persistence
 * - [ ] User authentication (Auth0/Supabase)
 * - [ ] Cloud storage for routes and exports
 * - [ ] Real-time collaboration
 * - [ ] Custom map styles
 * - [ ] Server-side video encoding for MP4
 * - [ ] Analytics and usage tracking
 * - [ ] Subscription/payment system (Stripe)
 */

function App() {
  return (
    <div className="app-layout">
      <MapContainer />
      <Sidebar />
    </div>
  );
}

export default App;
