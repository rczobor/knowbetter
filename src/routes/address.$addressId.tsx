import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { DoorOpen, SquareParking } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'

import { api } from '../../convex/_generated/api'
import { getAddressMarkers, getMarkerViewportTarget } from './-address-map'
import type { AddressMarker } from './-address-map'

import 'mapbox-gl/dist/mapbox-gl.css'

export const Route = createFileRoute('/address/$addressId')({
  component: AddressMap,
})

const MAPBOX_ACCESS_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN
const MAP_STYLE = 'mapbox://styles/robertczobor/clnu2vyeo00n801qw3eyz5fm3'
const INITIAL_VIEW_STATE = {
  longitude: 19.076422156938513,
  latitude: 47.55561160380166,
  zoom: 14,
}

const MARKER_CLASS_NAMES: Record<AddressMarker['id'], string> = {
  parking:
    'flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg shadow-black/25',
  entrance:
    'flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-lg shadow-black/25',
}

function AddressMap() {
  const { addressId } = Route.useParams()
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const address = useQuery(api.address.getAddressByAddressId, { addressId })
  const markers = getAddressMarkers(address)

  useEffect(() => {
    const map = mapRef.current
    const viewportTarget = getMarkerViewportTarget(getAddressMarkers(address))

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
  }, [address, mapLoaded])

  return (
    <div className="h-dvh w-screen overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        initialViewState={INITIAL_VIEW_STATE}
        style={{ height: '100%', width: '100%', position: 'relative' }}
        mapStyle={MAP_STYLE}
        onLoad={() => setMapLoaded(true)}
      >
        {markers.map((marker) => (
          <AddressMapMarker key={marker.id} marker={marker} />
        ))}
      </Map>
    </div>
  )
}

function AddressMapMarker({ marker }: { marker: AddressMarker }) {
  return (
    <Marker
      longitude={marker.longitude}
      latitude={marker.latitude}
      anchor="bottom"
    >
      <div className={MARKER_CLASS_NAMES[marker.id]} aria-label={marker.label}>
        {marker.id === 'parking' ? (
          <SquareParking className="h-5 w-5" aria-hidden="true" />
        ) : (
          <DoorOpen className="h-5 w-5" aria-hidden="true" />
        )}
      </div>
    </Marker>
  )
}
