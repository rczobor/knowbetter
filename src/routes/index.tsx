import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { DoorOpen, LocateFixed, SquareParking } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
// If using with mapbox-gl v1:
// import Map from 'react-map-gl/mapbox-legacy';
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import {
  getAddressMarkers,
  getMarkerViewportTarget,
  getUserLocationMarker,
} from './-address-map'
import type { AddressMarker } from './-address-map'
import { AddressListPanel } from './-address-list-panel'
import { useUserLocation } from './-user-location'

import 'mapbox-gl/dist/mapbox-gl.css'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({ component: Home })

const MAPBOX_ACCESS_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN
const INITIAL_VIEW_STATE = {
  longitude: 19.076422156938513,
  latitude: 47.55561160380166,
  zoom: 14,
}

type HomeAddress = Doc<'address'>

type HomeAddressMarker = AddressMarker & {
  addressId: string
}

function Home() {
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [addressPanelHeight, setAddressPanelHeight] = useState(0)
  const [hoveredAddressId, setHoveredAddressId] = useState<string | null>(null)
  const addresses = useQuery(api.address.listAddresses, {})
  const userLocationState = useUserLocation()
  const userLocation = userLocationState.location
  const addressMarkers = useMemo(
    () => getHomeAddressMarkers(addresses),
    [addresses],
  )
  const userLocationMarker = useMemo(
    () => getUserLocationMarker(userLocation),
    [userLocation],
  )

  useEffect(() => {
    const map = mapRef.current
    const viewportTarget = getMarkerViewportTarget([
      ...addressMarkers,
      ...(userLocationMarker ? [userLocationMarker] : []),
    ])

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
  }, [addressMarkers, mapLoaded, userLocationMarker])

  return (
    <div
      className="native-map-screen home-map-screen"
      style={
        {
          '--kb-floating-panel-height': `${addressPanelHeight}px`,
        } as CSSProperties
      }
    >
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
        {addressMarkers.map((marker) => (
          <HomeAddressPointMarker
            key={`${marker.addressId}-${marker.id}-${marker.longitude}-${marker.latitude}`}
            marker={marker}
            hovered={marker.addressId === hoveredAddressId}
          />
        ))}
      </Map>
      <AddressListPanel
        addresses={addresses}
        addressTo="/address/$addressId"
        onHeightChange={setAddressPanelHeight}
        onHoverAddress={setHoveredAddressId}
      />
    </div>
  )
}

function HomeAddressPointMarker({
  marker,
  hovered,
}: {
  marker: HomeAddressMarker
  hovered: boolean
}) {
  return (
    <Marker
      longitude={marker.longitude}
      latitude={marker.latitude}
      anchor="bottom"
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-lg shadow-black/25 transition-transform duration-150',
          marker.id === 'parking' && 'bg-blue-600',
          hovered && 'scale-125',
        )}
        aria-label={`${marker.addressId} ${marker.label}`}
      >
        {marker.id === 'parking' ? (
          <SquareParking className="h-5 w-5" aria-hidden="true" />
        ) : (
          <DoorOpen className="h-5 w-5" aria-hidden="true" />
        )}
      </div>
    </Marker>
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
        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-950 text-white shadow-md shadow-black/25"
        aria-label={marker.label}
      >
        <LocateFixed className="h-4 w-4" aria-hidden="true" />
      </div>
    </Marker>
  )
}

function getHomeAddressMarkers(
  addresses: Array<HomeAddress> | undefined,
): Array<HomeAddressMarker> {
  return (
    addresses?.flatMap((address) =>
      getAddressMarkers(address).map((marker) => ({
        ...marker,
        addressId: address.addressId
      })))
     ?? []
  )
}
