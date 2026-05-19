import { createFileRoute } from '@tanstack/react-router'
import { LocateFixed } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
// If using with mapbox-gl v1:
// import Map from 'react-map-gl/mapbox-legacy';
import { getMarkerViewportTarget, getUserLocationMarker } from './-address-map'
import type { AddressMarker } from './-address-map'
import { useUserLocation } from './-user-location'

import 'mapbox-gl/dist/mapbox-gl.css'

export const Route = createFileRoute('/')({ component: Home })

const MAPBOX_ACCESS_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN
const INITIAL_VIEW_STATE = {
  longitude: 19.076422156938513,
  latitude: 47.55561160380166,
  zoom: 14,
}

function Home() {
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const userLocationState = useUserLocation()
  const userLocation = userLocationState.location
  const userLocationMarker = useMemo(
    () => getUserLocationMarker(userLocation),
    [userLocation],
  )

  useEffect(() => {
    const map = mapRef.current
    const viewportTarget = getMarkerViewportTarget(
      userLocationMarker ? [userLocationMarker] : [],
    )

    if (!mapLoaded || !map || !viewportTarget) {
      return
    }

    if (viewportTarget.type === 'fitBounds') {
      map.fitBounds(viewportTarget.bounds, {
        padding: 80,
        maxZoom: 17,
        duration: 600,
      })
      return
    }

    map.flyTo({
      center: [viewportTarget.longitude, viewportTarget.latitude],
      zoom: viewportTarget.zoom,
      duration: 600,
    })
  }, [mapLoaded, userLocationMarker])

  return (
    <div className="native-map-screen">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        initialViewState={INITIAL_VIEW_STATE}
        style={{ height: '100%', width: '100%', position: 'relative' }}
        mapStyle="mapbox://styles/robertczobor/clnu2vyeo00n801qw3eyz5fm3"
        onLoad={() => setMapLoaded(true)}
      >
        {userLocationMarker ? (
          <UserLocationMarker marker={userLocationMarker} />
        ) : null}
      </Map>
    </div>
  )
}

function UserLocationMarker({ marker }: { marker: AddressMarker }) {
  return (
    <Marker
      longitude={marker.longitude}
      latitude={marker.latitude}
      anchor="center"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-zinc-950 text-white shadow-lg shadow-black/25"
        aria-label={marker.label}
      >
        <LocateFixed className="h-5 w-5" aria-hidden="true" />
      </div>
    </Marker>
  )
}
