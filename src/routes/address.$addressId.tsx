import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { DoorOpen, LocateFixed, SquareParking } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox'
import type { LayerProps, MapRef } from 'react-map-gl/mapbox'
import { toast } from 'sonner'

import { Button } from '../components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '../components/ui/drawer'
import { api } from '../../convex/_generated/api'
import {
  getEventParkingPointFeatureCollection,
  getMapFitPadding,
  getMarkerViewportTarget,
  getParkingFlowMarkers,
  getPointFromMapCenter,
  getPointFromViewportPoint,
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

const EVENT_PARKING_POINTS_LAYER: LayerProps = {
  id: 'historical-event-parking-points',
  type: 'circle',
  paint: {
    'circle-color': '#2563eb',
    'circle-radius': 6,
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
}

type ParkingFlowStep =
  | 'arrive'
  | 'reviewParking'
  | 'adjustParking'
  | 'readyForEntrance'

function AddressMap() {
  const { addressId } = addressRoute.useParams()
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [parkingFlowStep, setParkingFlowStep] =
    useState<ParkingFlowStep>('arrive')
  const [isSavingParkingFlow, setIsSavingParkingFlow] = useState(false)
  const [drawerHeight, setDrawerHeight] = useState<number | null>(null)
  const address = useQuery(api.address.getAddressByAddressId, { addressId })
  const events = useQuery(api.address.getEventsByAddressId, { addressId })
  const addEventForAddressId = useMutation(api.address.addEventForAddressId)
  const updateAddressByAddressId = useMutation(
    api.address.updateAddressByAddressId,
  )
  const userLocationState = useUserLocation()
  const userLocation = userLocationState.location
  const markers = getParkingFlowMarkers(address, userLocation)
  const eventParkingPointFeatureCollection =
    getEventParkingPointFeatureCollection(events)

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
    const viewportTarget = getMarkerViewportTarget(
      getParkingFlowMarkers(address, userLocation),
    )

    if (
      parkingFlowStep === 'adjustParking' ||
      !mapLoaded ||
      !map ||
      !viewportTarget
    ) {
      return
    }

    if (viewportTarget.type === 'fitBounds') {
      map.fitBounds(viewportTarget.bounds, {
        padding: getMapFitPadding(drawerHeight),
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
  }, [address, drawerHeight, mapLoaded, parkingFlowStep, userLocation])

  useEffect(() => {
    const map = mapRef.current

    if (parkingFlowStep !== 'adjustParking' || !mapLoaded || !map) {
      return
    }

    if (!userLocation) {
      return
    }

    map.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 18,
      duration: 400,
    })
  }, [mapLoaded, parkingFlowStep, userLocation])

  async function handleArrived() {
    const arrivedParkingPoint = getPointFromViewportPoint(userLocation)

    if (!arrivedParkingPoint) {
      toast.error('Location unavailable', {
        description: 'Wait for your current location before arriving.',
      })
      return
    }

    setIsSavingParkingFlow(true)

    try {
      await addEventForAddressId({
        addressId,
        date: new Date().toISOString(),
        parkingPoint: arrivedParkingPoint,
      })
      setParkingFlowStep('reviewParking')
    } catch {
      toast.error('Could not create arrival event')
    } finally {
      setIsSavingParkingFlow(false)
    }
  }

  async function handleSaveCorrectedParking() {
    const map = mapRef.current

    if (!map) {
      toast.error('Map unavailable')
      return
    }

    const correctedParkingPoint = getPointFromMapCenter(map.getCenter())

    if (!correctedParkingPoint) {
      toast.error('Parking point unavailable', {
        description: 'Move the map and try saving again.',
      })
      return
    }

    setIsSavingParkingFlow(true)

    try {
      await updateAddressByAddressId({
        addressId,
        parkingPoint: correctedParkingPoint,
      })
      setParkingFlowStep('readyForEntrance')
    } catch {
      toast.error('Could not update parking point')
    } finally {
      setIsSavingParkingFlow(false)
    }
  }

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        initialViewState={INITIAL_VIEW_STATE}
        style={{ height: '100%', width: '100%', position: 'relative' }}
        mapStyle={MAP_STYLE}
        onLoad={() => setMapLoaded(true)}
      >
        {parkingFlowStep === 'adjustParking' ? (
          <EventParkingPointLayer
            eventParkingPointFeatureCollection={
              eventParkingPointFeatureCollection
            }
          />
        ) : null}
        {markers.map((marker) => (
          <AddressMapMarker key={marker.id} marker={marker} />
        ))}
      </Map>
      {parkingFlowStep === 'adjustParking' ? <CenterParkingPin /> : null}
      <ParkingArrivalDrawer
        step={parkingFlowStep}
        locationStatus={userLocationState.status}
        isSaving={isSavingParkingFlow}
        onHeightChange={setDrawerHeight}
        onArrived={handleArrived}
        onAcceptParking={() => setParkingFlowStep('readyForEntrance')}
        onAdjustParking={() => setParkingFlowStep('adjustParking')}
        onSaveCorrectedParking={handleSaveCorrectedParking}
      />
    </div>
  )
}

function EventParkingPointLayer({
  eventParkingPointFeatureCollection,
}: {
  eventParkingPointFeatureCollection: EventPointFeatureCollection
}) {
  return (
    <Source
      id="historical-event-parking-points"
      type="geojson"
      data={eventParkingPointFeatureCollection}
    >
      <Layer {...EVENT_PARKING_POINTS_LAYER} />
    </Source>
  )
}

function CenterParkingPin() {
  return (
    <div
      className="pointer-events-none absolute top-1/2 left-1/2 z-20 flex -translate-x-1/2 -translate-y-full flex-col items-center"
      aria-hidden="true"
    >
      <div className="mb-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/20">
        Parking point
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg shadow-black/25">
        <SquareParking className="h-5 w-5" />
      </div>
      <div className="h-4 w-1 rounded-b-full bg-blue-600 shadow-lg shadow-black/20" />
    </div>
  )
}

function ParkingArrivalDrawer({
  step,
  locationStatus,
  isSaving,
  onHeightChange,
  onArrived,
  onAcceptParking,
  onAdjustParking,
  onSaveCorrectedParking,
}: {
  step: ParkingFlowStep
  locationStatus: string
  isSaving: boolean
  onHeightChange: (height: number | null) => void
  onArrived: () => void
  onAcceptParking: () => void
  onAdjustParking: () => void
  onSaveCorrectedParking: () => void
}) {
  const canArrive = locationStatus === 'available' && !isSaving
  const drawerContentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const drawerContent = drawerContentRef.current

    if (!drawerContent) {
      onHeightChange(null)
      return
    }

    const updateHeight = () => {
      onHeightChange(drawerContent.getBoundingClientRect().height)
    }

    updateHeight()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(drawerContent)

    return () => resizeObserver.disconnect()
  }, [onHeightChange, step])

  return (
    <Drawer open modal={false} dismissible={false}>
      <DrawerContent
        ref={drawerContentRef}
        showOverlay={false}
        className="z-30 border-white/10"
      >
        <DrawerHeader className="text-left">
          <DrawerTitle>{parkingFlowTitle(step)}</DrawerTitle>
          <DrawerDescription>
            {parkingFlowDescription(step, locationStatus)}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          {step === 'arrive' ? (
            <Button size="lg" disabled={!canArrive} onClick={onArrived}>
              {isSaving ? 'Saving arrival...' : 'I have arrived'}
            </Button>
          ) : null}
          {step === 'reviewParking' ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onAdjustParking}>
                Adjust point
              </Button>
              <Button onClick={onAcceptParking}>Looks accurate</Button>
            </div>
          ) : null}
          {step === 'adjustParking' ? (
            <Button
              size="lg"
              disabled={isSaving}
              onClick={onSaveCorrectedParking}
            >
              {isSaving ? 'Saving parking...' : 'Save parking point'}
            </Button>
          ) : null}
          {step === 'readyForEntrance' ? (
            <Button size="lg" disabled>
              Continue to entrance next
            </Button>
          ) : null}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function parkingFlowTitle(step: ParkingFlowStep) {
  if (step === 'reviewParking') {
    return 'Parking point saved'
  }

  if (step === 'adjustParking') {
    return 'Set parking point'
  }

  if (step === 'readyForEntrance') {
    return 'Ready for entrance'
  }

  return 'Arrive at address'
}

function parkingFlowDescription(step: ParkingFlowStep, locationStatus: string) {
  if (step === 'reviewParking') {
    return 'Was this parking point accurate?'
  }

  if (step === 'adjustParking') {
    return 'Place the parking point at the center of the map.'
  }

  if (step === 'readyForEntrance') {
    return 'The walking-to-door step comes next.'
  }

  if (locationStatus === 'available') {
    return 'Use your current location as the arrival parking point.'
  }

  if (locationStatus === 'error' || locationStatus === 'unsupported') {
    return 'Current location is unavailable.'
  }

  return 'Waiting for current location.'
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
