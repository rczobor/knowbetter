import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Map from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import { toast } from 'sonner'

import { api } from '../../convex/_generated/api'
import { ActiveEventLayers } from './-active-event-layers'
import {
  getActiveEventFeatureCollections,
  getActiveEventViewportMarkers,
  getMapFitPadding,
  getMarkerViewportTarget,
} from './-address-map'

import 'mapbox-gl/dist/mapbox-gl.css'

export const Route = createFileRoute('/address/$addressId_/event/$eventId')({
  component: EventReviewMap,
})

const eventReviewRoute = getRouteApi('/address/$addressId_/event/$eventId')

const MAPBOX_ACCESS_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN
const MAP_STYLE = 'mapbox://styles/robertczobor/clnu2vyeo00n801qw3eyz5fm3'
const INITIAL_VIEW_STATE = {
  longitude: 19.076422156938513,
  latitude: 47.55561160380166,
  zoom: 14,
}

function EventReviewMap() {
  const { addressId, eventId } = eventReviewRoute.useParams()
  const mapRef = useRef<MapRef | null>(null)
  const [mapAttached, setMapAttached] = useState(false)
  const event = useQuery(api.address.getEventByIdForAddressId, {
    addressId,
    eventId,
  })
  const activeEventFeatureCollections = getActiveEventFeatureCollections(event)
  const viewportTarget = getMarkerViewportTarget(
    getActiveEventViewportMarkers(event),
  )
  const handleMapRef = useCallback((map: MapRef | null) => {
    mapRef.current = map
    setMapAttached(map !== null)
  }, [])

  useEffect(() => {
    if (event !== null) {
      return
    }

    toast.error('Event not found', {
      id: `event-not-found-${eventId}`,
      description: `No event exists for ${addressId}.`,
    })
  }, [addressId, event, eventId])

  useEffect(() => {
    const map = mapRef.current

    if (!mapAttached || !map || !viewportTarget) {
      return
    }

    if (viewportTarget.type === 'fitBounds') {
      map.fitBounds(viewportTarget.bounds, {
        padding: getMapFitPadding(null),
        maxZoom: 17,
        duration: 600,
      })
      return
    }

    map.flyTo({
      center: [viewportTarget.longitude, viewportTarget.latitude],
      zoom: viewportTarget.zoom,
      padding: getMapFitPadding(null),
      retainPadding: false,
      duration: 600,
    })
  }, [mapAttached, viewportTarget])

  return (
    <div className="native-map-screen">
      <Map
        ref={handleMapRef}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        initialViewState={INITIAL_VIEW_STATE}
        style={{ height: '100%', width: '100%', position: 'relative' }}
        mapStyle={MAP_STYLE}
      >
        <ActiveEventLayers
          activeEventFeatureCollections={activeEventFeatureCollections}
        />
      </Map>
    </div>
  )
}
