# Route Animator 🗺️

Una aplicación web MVP para crear rutas de viaje animadas en un mapa y exportarlas como video.

## 🚀 Características

### MVP (Implementado)
- ✅ Mapa interactivo con Mapbox GL JS
- ✅ Crear rutas con múltiples waypoints
- ✅ Diferentes modos de transporte por segmento (coche, moto, tren, avión)
- ✅ Cálculo automático de rutas usando datos de carreteras reales
- ✅ Animación de ruta con marcador móvil y trazado progresivo
- ✅ Exportación a video (WebM) usando Canvas + MediaRecorder
- ✅ Guardar/cargar rutas en formato JSON
- ✅ Múltiples estilos de mapa

### Próximamente (SaaS)
- ☁️ Almacenamiento en la nube
- 👥 Colaboración en tiempo real
- 🔐 Autenticación de usuarios
- 💳 Sistema de suscripciones
- 🎨 Estilos de mapa personalizados
- 📹 Exportación a MP4

## 🛠️ Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Token de Mapbox (gratuito en [mapbox.com](https://account.mapbox.com/access-tokens/))

### Pasos

1. **Clonar e instalar dependencias**
```bash
cd rutas
npm install
```

2. **Configurar Mapbox**

Edita `src/config/map.ts` y reemplaza `YOUR_MAPBOX_ACCESS_TOKEN` con tu token:

```typescript
export const MAPBOX_ACCESS_TOKEN = 'pk.your_actual_token_here';
```

3. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

4. **Abrir en el navegador**
```
http://localhost:5173
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Map/
│   │   └── MapContainer.tsx    # Componente principal del mapa
│   └── Sidebar/
│       ├── Sidebar.tsx         # Contenedor de la barra lateral
│       ├── WaypointPanel.tsx   # Gestión de puntos
│       ├── AnimationPanel.tsx  # Controles de animación
│       ├── ExportPanel.tsx     # Configuración de exportación
│       └── SettingsPanel.tsx   # Ajustes del mapa
├── config/
│   ├── map.ts                  # Configuración de Mapbox
│   └── transport.ts            # Modos de transporte
├── hooks/
│   ├── useMapbox.ts            # Hook de Mapbox
│   ├── useAnimation.ts         # Hook de animación
│   ├── useRouting.ts           # Hook de cálculo de rutas
│   └── useVideoExport.ts       # Hook de exportación
├── store/
│   └── routeStore.ts           # Estado global (Zustand)
├── styles/
│   └── index.css               # Estilos globales
├── types/
│   └── index.ts                # Definiciones TypeScript
├── App.tsx                     # Componente principal
└── main.tsx                    # Punto de entrada
```

## 🎮 Uso

### Crear una ruta
1. Haz clic en "Crear Ruta"
2. Haz clic en "Añadir punto"
3. Haz clic en el mapa para añadir waypoints
4. Selecciona el modo de transporte entre cada punto

### Calcular rutas reales
1. Después de añadir los puntos, haz clic en "Calcular rutas"
2. La aplicación obtendrá las rutas reales usando la API de Mapbox

### Animar la ruta
1. Ve a la pestaña "Animación"
2. Usa los controles de reproducción
3. Ajusta la velocidad según prefieras

### Exportar video
1. Ve a la pestaña "Exportar"
2. Selecciona la calidad y FPS
3. Haz clic en "Exportar Video"
4. El archivo se descargará automáticamente

## 🔧 Tecnologías

- **React 18** + TypeScript
- **Vite** - Build tool
- **Mapbox GL JS** - Mapas interactivos
- **Zustand** - Gestión de estado
- **Turf.js** - Cálculos geoespaciales
- **Lucide React** - Iconos
- **MediaRecorder API** - Exportación de video

## 📝 TODOs para Escalar a SaaS

### Backend
- [ ] API REST con Node.js/Express o Serverless
- [ ] Base de datos PostgreSQL + PostGIS
- [ ] Autenticación con Auth0 o Supabase
- [ ] Almacenamiento de archivos en S3

### Frontend
- [ ] PWA para uso offline
- [ ] Drag & drop para reordenar waypoints
- [ ] Ajuste manual de nodos de ruta
- [ ] Modo oscuro completo
- [ ] Internacionalización (i18n)

### Video
- [ ] Servidor de encoding para MP4 (FFmpeg)
- [ ] Diferentes resoluciones y formatos
- [ ] Marca de agua personalizable
- [ ] Música de fondo

### Monetización
- [ ] Plan gratuito con límites
- [ ] Suscripción mensual/anual
- [ ] Integración con Stripe
- [ ] Exportaciones de alta calidad como premium

## 📄 Licencia

MIT
