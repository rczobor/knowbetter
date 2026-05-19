import { createContext, useState } from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import Map from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { SidebarProvider } from '@/components/ui/sidebar'
import MapImages from '@/components/map-image'

export const Route = createFileRoute('/operation')({
  component: OperationLayout,
})

export const OperationMapLoadedContext = createContext(false)

const MAPBOX_ACCESS_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN
const INITIAL_VIEW_STATE = {
  longitude: 19.07744443713043,
  latitude: 47.55396193398739,
  zoom: 14,
}

function OperationLayout() {
  const [mapLoaded, setMapLoaded] = useState(false)

  return (
    <OperationMapLoadedContext.Provider value={mapLoaded}>
      <SidebarProvider defaultOpen={false}>
        <div className="native-map-screen">
          <Map
            mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
            initialViewState={INITIAL_VIEW_STATE}
            style={{ height: '100%', width: '100%', position: 'relative' }}
            mapStyle="mapbox://styles/robertczobor/clnu2vyeo00n801qw3eyz5fm3"
            onLoad={() => setMapLoaded(true)}
          >
            <MapImages />
            <Outlet />
          </Map>
        </div>
      </SidebarProvider>
    </OperationMapLoadedContext.Provider>
  )
}
