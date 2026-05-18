import { createFileRoute } from '@tanstack/react-router'
import Map from 'react-map-gl/mapbox'
// If using with mapbox-gl v1:
// import Map from 'react-map-gl/mapbox-legacy';
import 'mapbox-gl/dist/mapbox-gl.css'

export const Route = createFileRoute('/')({ component: Home })

const MAPBOX_ACCESS_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN

function Home() {
  return (
    <Map
      mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
      initialViewState={{
        longitude: 19.076422156938513,
        latitude: 47.55561160380166,
        zoom: 14,
      }}
      style={{ height: '100%', width: '100%', position: 'relative' }}
      mapStyle="mapbox://styles/robertczobor/clnu2vyeo00n801qw3eyz5fm3"
    />
  )
}
