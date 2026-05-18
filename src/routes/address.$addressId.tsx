import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { DoorOpen, LocateFixed, SquareParking } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox'
import type { LayerProps, MapRef } from 'react-map-gl/mapbox'
import { toast } from 'sonner'

import { api } from '../../convex/_generated/api'
import {
  getAddressMarkers,
  getEventPointFeatureCollection,
  getEventPointMarkers,
  getMarkerViewportTarget,
  getUserLocationMarker,
} from './-address-map'
import type { AddressMarker, EventPointFeatureCollection } from './-address-map'
import { useUserLocation } from './-user-location'

import 'mapbox-gl/dist/mapbox-gl.css'

export const Route = createFileRoute('/address/$addressId')({
  component: AddressMap,
})

const addressRoute = getRouteApi('/address/$addressId')

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
    'flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-lg shadow-black/25',
  userLocation:
    'flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-zinc-950 text-white shadow-lg shadow-black/25',
}

const HISTORICAL_EVENT_CLUSTERS_LAYER: LayerProps = {
  id: 'historical-event-clusters',
  type: 'circle',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': '#f97316',
    'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 25, 24],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
}

const HISTORICAL_EVENT_CLUSTER_COUNT_LAYER: LayerProps = {
  id: 'historical-event-cluster-count',
  type: 'symbol',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12,
  },
  paint: {
    'text-color': '#ffffff',
  },
}

const HISTORICAL_EVENT_PARKING_POINTS_LAYER: LayerProps = {
  id: 'historical-event-parking-points',
  type: 'circle',
  filter: [
    'all',
    ['!', ['has', 'point_count']],
    ['==', ['get', 'kind'], 'eventParking'],
  ],
  paint: {
    'circle-color': '#2563eb',
    'circle-radius': 6,
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
}

const HISTORICAL_EVENT_ENTRANCE_POINTS_LAYER: LayerProps = {
  id: 'historical-event-entrance-points',
  type: 'circle',
  filter: [
    'all',
    ['!', ['has', 'point_count']],
    ['==', ['get', 'kind'], 'eventEntrance'],
  ],
  paint: {
    'circle-color': '#f97316',
    'circle-radius': 6,
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
}

function AddressMap() {
  const { addressId } = addressRoute.useParams()
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const address = useQuery(api.address.getAddressByAddressId, { addressId })
  const events = useQuery(api.address.getEventsByAddressId, { addressId })
  const userLocation = useUserLocation()
  const addressMarkers = getAddressMarkers(address)
  const eventPointFeatureCollection = getEventPointFeatureCollection(events)
  const userLocationMarker = getUserLocationMarker(userLocation)
  const markers = userLocationMarker
    ? [...addressMarkers, userLocationMarker]
    : addressMarkers

  useEffect(() => {
    if (address !== null) {
      return
    }

    toast.error('Address not found', {
      id: `address-not-found-${addressId}`,
      description: `No address exists for ${addressId}.`,
    })
  }, [address, addressId])

  useEffect(() => {
    const map = mapRef.current
    const currentAddressMarkers = getAddressMarkers(address)
    const currentEventPointMarkers = getEventPointMarkers(events)
    const currentUserLocationMarker = getUserLocationMarker(userLocation)
    const currentMarkers = currentUserLocationMarker
      ? [
          ...currentAddressMarkers,
          ...currentEventPointMarkers,
          currentUserLocationMarker,
        ]
      : [...currentAddressMarkers, ...currentEventPointMarkers]
    const viewportTarget = getMarkerViewportTarget(currentMarkers)

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
  }, [address, events, mapLoaded, userLocation])

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
        <HistoricalEventLayers
          eventPointFeatureCollection={eventPointFeatureCollection}
        />
        {markers.map((marker) => (
          <AddressMapMarker key={marker.id} marker={marker} />
        ))}
      </Map>
    </div>
  )
}

function HistoricalEventLayers({
  eventPointFeatureCollection,
}: {
  eventPointFeatureCollection: EventPointFeatureCollection
}) {
  return (
    <Source
      id="historical-events"
      type="geojson"
      data={eventPointFeatureCollection}
      cluster
      clusterMaxZoom={16}
      clusterRadius={40}
    >
      <Layer {...HISTORICAL_EVENT_CLUSTERS_LAYER} />
      <Layer {...HISTORICAL_EVENT_CLUSTER_COUNT_LAYER} />
      <Layer {...HISTORICAL_EVENT_PARKING_POINTS_LAYER} />
      <Layer {...HISTORICAL_EVENT_ENTRANCE_POINTS_LAYER} />
    </Source>
  )
}

function AddressMapMarker({ marker }: { marker: AddressMarker }) {
  return (
    <Marker
      longitude={marker.longitude}
      latitude={marker.latitude}
      anchor={marker.id === 'userLocation' ? 'center' : 'bottom'}
    >
      <div className={MARKER_CLASS_NAMES[marker.id]} aria-label={marker.label}>
        {marker.id === 'userLocation' ? (
          <span className="sr-only">Your current location</span>
        ) : null}
        <AddressMapMarkerIcon marker={marker} />
      </div>
    </Marker>
  )
}

function AddressMapMarkerIcon({ marker }: { marker: AddressMarker }) {
  if (marker.id === 'parking') {
    return <SquareParking className="h-5 w-5" aria-hidden="true" />
  }

  if (marker.id === 'entrance') {
    return <DoorOpen className="h-5 w-5" aria-hidden="true" />
  }

  return <LocateFixed className="h-5 w-5" aria-hidden="true" />
}
