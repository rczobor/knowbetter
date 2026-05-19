import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import {
  ChevronRight,
  DoorOpen,
  LocateFixed,
  MapPin,
  SquareParking,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
// If using with mapbox-gl v1:
// import Map from 'react-map-gl/mapbox-legacy';
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import { Badge } from '../components/ui/badge'
import {
  getAddressMarkers,
  getMarkerViewportTarget,
  getUserLocationMarker,
} from './-address-map'
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

type HomeAddress = Doc<'address'>

type HomeAddressMarker = AddressMarker & {
  addressId: string
}

function Home() {
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [addressPanelHeight, setAddressPanelHeight] = useState(0)
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
          />
        ))}
      </Map>
      <AddressListPanel
        addresses={addresses}
        onHeightChange={setAddressPanelHeight}
      />
    </div>
  )
}

function AddressListPanel({
  addresses,
  onHeightChange,
}: {
  addresses: Array<HomeAddress> | undefined
  onHeightChange: (height: number) => void
}) {
  const [panelElement, setPanelElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!panelElement) {
      onHeightChange(0)
      return
    }

    const updateHeight = () => {
      onHeightChange(Math.ceil(panelElement.getBoundingClientRect().height))
    }

    updateHeight()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(panelElement)

    return () => resizeObserver.disconnect()
  }, [onHeightChange, panelElement])

  return (
    <section
      ref={setPanelElement}
      className="safe-bottom-panel absolute inset-x-3 z-30 max-h-[min(20rem,45dvh)] overflow-hidden rounded-lg border border-white/40 bg-white/95 shadow-xl shadow-black/15 backdrop-blur-md"
      aria-label="Available addresses"
    >
      <div className="border-b border-zinc-200/80 px-4 py-3">
        <h1 className="text-sm font-semibold text-zinc-950">
          Available addresses
        </h1>
      </div>
      <div className="max-h-[calc(min(20rem,45dvh)-3rem)] overflow-y-auto">
        {addresses === undefined ? (
          <p className="px-4 py-5 text-sm text-zinc-500">
            Loading addresses...
          </p>
        ) : addresses.length === 0 ? (
          <p className="px-4 py-5 text-sm text-zinc-500">No addresses yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200/80">
            {addresses.map((address) => (
              <li key={address._id}>
                <Link
                  to="/address/$addressId"
                  params={{ addressId: address.addressId }}
                  className="flex min-h-16 items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-100/80 focus-visible:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-950">
                      {address.addressId}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {address.parkingPoint ? (
                        <Badge variant="secondary">Parking</Badge>
                      ) : null}
                      {address.entrancePoint ? (
                        <Badge variant="outline">Entrance</Badge>
                      ) : null}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-zinc-400"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function HomeAddressPointMarker({ marker }: { marker: HomeAddressMarker }) {
  return (
    <Marker
      longitude={marker.longitude}
      latitude={marker.latitude}
      anchor="bottom"
    >
      <div
        className={
          marker.id === 'parking'
            ? 'flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg shadow-black/25'
            : 'flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-lg shadow-black/25'
        }
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
        addressId: address.addressId,
      })),
    ) ?? []
  )
}
