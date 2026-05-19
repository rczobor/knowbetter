import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { DoorOpen, LocateFixed, SquareParking } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LayerProps, MapRef } from 'react-map-gl/mapbox'
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox'
import { toast } from 'sonner'

import type { Id } from '../../convex/_generated/dataModel'
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
import type {
  AddressMarker,
  AddressMultiPoint,
  AddressPoint,
  EventPointFeatureCollection,
  WalkingEntranceHintFeatureCollection,
} from './-address-map'
import {
  getActiveEventFeatureCollections,
  getEventParkingPointFeatureCollection,
  getEventPointMarkers,
  getMapFitPadding,
  getMarkerViewportTarget,
  getParkingArrivalViewportMarkers,
  getParkingFlowMarkers,
  getPointFromMapCenter,
  getPointFromViewportPoint,
  getUserLocationMarker,
  getWalkingEntranceHintFeatureCollection,
  getWalkingEntranceHintViewportMarkers,
  shouldAppendWalkingTracePoint,
} from './-address-map'
import { ActiveEventLayers } from './-active-event-layers'
import type { UserLocation } from './-user-location'
import { useUserLocation } from './-user-location'

import 'mapbox-gl/dist/mapbox-gl.css'

export const Route = createFileRoute('/address/$addressId')({
  component: AddressMap,
})

const addressRoute = getRouteApi('/address/$addressId')

const MAPBOX_ACCESS_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN
const MAP_STYLE = 'mapbox://styles/robertczobor/clnu2vyeo00n801qw3eyz5fm3'
const WALKING_LOCATION_TOAST_ID = 'walking-location-unavailable'
const WALKING_LOCATION_TOAST_DURATION_MS = 4000
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
    'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-950 text-white shadow-md shadow-black/25',
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

const WALKING_ADDRESS_ENTRANCE_POINT_LAYER: LayerProps = {
  id: 'walking-address-entrance-point',
  type: 'circle',
  filter: ['==', ['get', 'kind'], 'addressEntrance'],
  paint: {
    'circle-color': '#f97316',
    'circle-radius': 9,
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
}

const WALKING_EVENT_ENTRANCE_POINTS_LAYER: LayerProps = {
  id: 'walking-event-entrance-points',
  type: 'circle',
  filter: ['==', ['get', 'kind'], 'eventEntrance'],
  paint: {
    'circle-color': '#f97316',
    'circle-radius': 5,
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
}

type ParkingFlowStep =
  | 'arrive'
  | 'reviewParking'
  | 'adjustParking'
  | 'walkingToEntrance'
  | 'finishedWalking'

type ActiveDeliveryEvent = {
  _id: Id<'events'>
  date?: string
  parkingPoint?: AddressPoint
  entrancePoint?: AddressPoint
  walkingTraces?: AddressMultiPoint
}

function AddressMap() {
  const { addressId } = addressRoute.useParams()
  const navigate = useNavigate()
  const mapRef = useRef<MapRef | null>(null)
  const latestTraceAppendRef = useRef<{
    point: UserLocation
    time: number
  } | null>(null)
  const isAppendingWalkingTraceRef = useRef(false)
  const [mapAttached, setMapAttached] = useState(false)
  const [parkingFlowStep, setParkingFlowStep] =
    useState<ParkingFlowStep>('arrive')
  const [isSavingParkingFlow, setIsSavingParkingFlow] = useState(false)
  const [drawerHeight, setDrawerHeight] = useState<number | null>(null)
  const [currentEvent, setCurrentEvent] = useState<ActiveDeliveryEvent | null>(
    null,
  )
  const [latestWalkingLocation, setLatestWalkingLocation] =
    useState<UserLocation | null>(null)
  const address = useQuery(api.address.getAddressByAddressId, { addressId })
  const events = useQuery(api.address.getEventsByAddressId, { addressId })
  const addEventForAddressId = useMutation(api.address.addEventForAddressId)
  const updateAddressByAddressId = useMutation(
    api.address.updateAddressByAddressId,
  )
  const updateEventWalkingTraces = useMutation(
    api.address.updateEventWalkingTraces,
  )
  const finishEventAtEntrance = useMutation(api.address.finishEventAtEntrance)
  const userLocationState = useUserLocation()
  const userLocation = userLocationState.location
  const liveUserLocation =
    parkingFlowStep === 'walkingToEntrance'
      ? (latestWalkingLocation ?? userLocation)
      : userLocation
  const latestEntranceLocation = latestWalkingLocation ?? userLocation
  const canFinishWalking =
    getPointFromViewportPoint(latestEntranceLocation) !== null
  const isWalkingFlow =
    parkingFlowStep === 'walkingToEntrance' ||
    parkingFlowStep === 'finishedWalking'
  const userLocationMarker = getUserLocationMarker(liveUserLocation)
  const walkingEntranceHintFeatureCollection =
    getWalkingEntranceHintFeatureCollection(address, events)
  const walkingEntranceHintViewportMarkers =
    getWalkingEntranceHintViewportMarkers(address, events)
  const activeEventMarkers = getActiveEventMarkers(currentEvent)
  const addressPointMarkers = getAddressPointMarkers(address)
  const markers =
    parkingFlowStep === 'walkingToEntrance'
      ? [
          ...activeEventMarkers,
          ...addressPointMarkers,
          ...(userLocationMarker ? [userLocationMarker] : []),
        ]
      : parkingFlowStep === 'finishedWalking'
        ? activeEventMarkers
        : getParkingFlowMarkers(address, userLocation)
  const viewportMarkers = isWalkingFlow
    ? [
        ...getEventPointMarkers(currentEvent ? [currentEvent] : []),
        ...(parkingFlowStep === 'walkingToEntrance'
          ? walkingEntranceHintViewportMarkers
          : []),
        ...(parkingFlowStep === 'walkingToEntrance' && userLocationMarker
          ? [userLocationMarker]
          : []),
      ]
    : parkingFlowStep === 'arrive'
      ? getParkingArrivalViewportMarkers(
          address,
          userLocation,
          userLocationState.status,
        )
      : markers
  const eventParkingPointFeatureCollection =
    getEventParkingPointFeatureCollection(events)
  const activeEventFeatureCollections =
    getActiveEventFeatureCollections(currentEvent)
  const viewportTarget = getMarkerViewportTarget(viewportMarkers)
  const mapFitPadding = getMapFitPadding(drawerHeight)
  const shouldUseArrivalInitialFit =
    parkingFlowStep === 'arrive' && viewportTarget
  const mapFitKey = shouldUseArrivalInitialFit
    ? `arrival-${JSON.stringify(viewportTarget)}-${JSON.stringify(mapFitPadding)}`
    : 'address-map'
  const mapInitialViewState =
    shouldUseArrivalInitialFit && viewportTarget.type === 'fitBounds'
      ? {
          bounds: viewportTarget.bounds,
          fitBoundsOptions: {
            padding: mapFitPadding,
            maxZoom: 17,
          },
        }
      : shouldUseArrivalInitialFit && viewportTarget.type === 'flyTo'
        ? {
            longitude: viewportTarget.longitude,
            latitude: viewportTarget.latitude,
            zoom: viewportTarget.zoom,
          }
        : INITIAL_VIEW_STATE
  const handleMapRef = useCallback((map: MapRef | null) => {
    mapRef.current = map
    setMapAttached(map !== null)
  }, [])

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

    if (
      parkingFlowStep === 'adjustParking' ||
      !mapAttached ||
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
      padding: getMapFitPadding(drawerHeight),
      retainPadding: false,
      duration: 600,
    })
  }, [drawerHeight, mapAttached, parkingFlowStep, viewportTarget])

  useEffect(() => {
    const map = mapRef.current

    if (parkingFlowStep !== 'adjustParking' || !mapAttached || !map) {
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
  }, [mapAttached, parkingFlowStep, userLocation])

  useEffect(() => {
    if (
      parkingFlowStep !== 'walkingToEntrance' ||
      !currentEvent?._id ||
      typeof navigator === 'undefined' ||
      !('geolocation' in navigator)
    ) {
      return
    }

    let active = true
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        }
        const nextPoint = getPointFromViewportPoint(nextLocation)

        if (!active || !nextPoint) {
          return
        }

        setLatestWalkingLocation(nextLocation)
        toast.dismiss(WALKING_LOCATION_TOAST_ID)

        const appendTime = Date.now()
        const shouldAppend = shouldAppendWalkingTracePoint({
          lastPoint: latestTraceAppendRef.current?.point ?? null,
          nextPoint: nextLocation,
          lastAppendTime: latestTraceAppendRef.current?.time ?? null,
          nextAppendTime: appendTime,
        })

        if (!shouldAppend || isAppendingWalkingTraceRef.current) {
          return
        }

        isAppendingWalkingTraceRef.current = true

        void updateEventWalkingTraces({
          eventId: currentEvent._id,
          point: nextPoint,
        })
          .then((updatedEvent) => {
            if (!active || !updatedEvent) {
              return
            }

            setCurrentEvent(updatedEvent)
            latestTraceAppendRef.current = {
              point: nextLocation,
              time: appendTime,
            }
          })
          .catch(() => {
            if (active) {
              toast.error('Could not update walking trace')
            }
          })
          .finally(() => {
            isAppendingWalkingTraceRef.current = false
          })
      },
      (error) => {
        if (active) {
          toast.error('Walking location unavailable', {
            id: WALKING_LOCATION_TOAST_ID,
            description: error.message,
            duration: WALKING_LOCATION_TOAST_DURATION_MS,
          })
        }
      },
      {
        enableHighAccuracy: true,
      },
    )

    return () => {
      active = false
      navigator.geolocation.clearWatch(watchId)
      toast.dismiss(WALKING_LOCATION_TOAST_ID)
      isAppendingWalkingTraceRef.current = false
    }
  }, [currentEvent?._id, parkingFlowStep, updateEventWalkingTraces])

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
      const createdEvent = await addEventForAddressId({
        addressId,
        date: new Date().toISOString(),
        parkingPoint: arrivedParkingPoint,
      })
      setCurrentEvent(createdEvent)
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
      startWalkingToEntrance()
    } catch {
      toast.error('Could not update parking point')
    } finally {
      setIsSavingParkingFlow(false)
    }
  }

  function startWalkingToEntrance() {
    if (!currentEvent?._id) {
      toast.error('Arrival event unavailable')
      return
    }

    setLatestWalkingLocation(userLocation)
    latestTraceAppendRef.current = null
    setParkingFlowStep('walkingToEntrance')
  }

  async function handleFinishWalking() {
    const entrancePoint = getPointFromViewportPoint(latestEntranceLocation)

    if (!currentEvent?._id) {
      toast.error('Arrival event unavailable')
      return
    }

    if (!entrancePoint) {
      toast.error('Entrance location unavailable', {
        description: 'Wait for your current location before finishing.',
      })
      return
    }

    setIsSavingParkingFlow(true)

    try {
      const finishedEvent = await finishEventAtEntrance({
        eventId: currentEvent._id,
        addressId,
        entrancePoint,
      })

      setCurrentEvent(finishedEvent)
      setParkingFlowStep('finishedWalking')
    } catch {
      toast.error('Could not save entrance point')
    } finally {
      setIsSavingParkingFlow(false)
    }
  }

  function handleCompleteAddress() {
    void navigate({ to: '/' })
  }

  return (
    <div className="native-map-screen">
      <Map
        key={mapFitKey}
        ref={handleMapRef}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        initialViewState={mapInitialViewState}
        style={{ height: '100%', width: '100%', position: 'relative' }}
        mapStyle={MAP_STYLE}
      >
        {isWalkingFlow ? (
          <ActiveEventLayers
            activeEventFeatureCollections={activeEventFeatureCollections}
          />
        ) : null}
        {parkingFlowStep === 'walkingToEntrance' ? (
          <WalkingEntranceHintLayers
            walkingEntranceHintFeatureCollection={
              walkingEntranceHintFeatureCollection
            }
          />
        ) : null}
        {parkingFlowStep === 'adjustParking' ? (
          <EventParkingPointLayer
            eventParkingPointFeatureCollection={
              eventParkingPointFeatureCollection
            }
          />
        ) : null}
        {markers.map((marker) => (
          <AddressMapMarker
            key={`${marker.id}-${marker.longitude}-${marker.latitude}`}
            marker={marker}
          />
        ))}
      </Map>
      {parkingFlowStep === 'adjustParking' ? <CenterParkingPin /> : null}
      <ParkingArrivalDrawer
        step={parkingFlowStep}
        locationStatus={userLocationState.status}
        isSaving={isSavingParkingFlow}
        onHeightChange={setDrawerHeight}
        onArrived={handleArrived}
        onAcceptParking={startWalkingToEntrance}
        onAdjustParking={() => setParkingFlowStep('adjustParking')}
        onSaveCorrectedParking={handleSaveCorrectedParking}
        onFinishWalking={handleFinishWalking}
        onCompleteAddress={handleCompleteAddress}
        canFinishWalking={canFinishWalking}
      />
    </div>
  )
}

function WalkingEntranceHintLayers({
  walkingEntranceHintFeatureCollection,
}: {
  walkingEntranceHintFeatureCollection: WalkingEntranceHintFeatureCollection
}) {
  return (
    <Source
      id="walking-entrance-hints"
      type="geojson"
      data={walkingEntranceHintFeatureCollection}
    >
      <Layer {...WALKING_EVENT_ENTRANCE_POINTS_LAYER} />
      <Layer {...WALKING_ADDRESS_ENTRANCE_POINT_LAYER} />
    </Source>
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
  onFinishWalking,
  onCompleteAddress,
  canFinishWalking,
}: {
  step: ParkingFlowStep
  locationStatus: string
  isSaving: boolean
  onHeightChange: (height: number | null) => void
  onArrived: () => void
  onAcceptParking: () => void
  onAdjustParking: () => void
  onSaveCorrectedParking: () => void
  onFinishWalking: () => void
  onCompleteAddress: () => void
  canFinishWalking: boolean
}) {
  const canArrive = locationStatus === 'available' && !isSaving
  const canSaveEntrance = canFinishWalking && !isSaving
  const [drawerContent, setDrawerContent] = useState<HTMLDivElement | null>(
    null,
  )

  useEffect(() => {
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
  }, [drawerContent, onHeightChange, step])

  return (
    <Drawer open modal={false} dismissible={false}>
      <DrawerContent
        ref={setDrawerContent}
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
          {step === 'walkingToEntrance' ? (
            <Button
              size="lg"
              disabled={!canSaveEntrance}
              onClick={onFinishWalking}
            >
              {isSaving ? 'Saving entrance...' : 'I am at the entrance'}
            </Button>
          ) : null}
          {step === 'finishedWalking' ? (
            <Button size="lg" onClick={onCompleteAddress}>
              Finish address
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

  if (step === 'walkingToEntrance') {
    return 'Walk to entrance'
  }

  if (step === 'finishedWalking') {
    return 'Entrance point saved'
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

  if (step === 'walkingToEntrance') {
    if (locationStatus === 'error' || locationStatus === 'unsupported') {
      return 'Current location is unavailable.'
    }

    return 'Tap the button when you arrive at the entrance.'
  }

  if (step === 'finishedWalking') {
    return 'Walking trace and entrance point were saved.'
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

  return <LocateFixed className="h-4 w-4" aria-hidden="true" />
}

function getActiveEventMarkers(
  currentEvent: ActiveDeliveryEvent | null,
): Array<AddressMarker> {
  if (!currentEvent) {
    return []
  }

  return [
    getMarkerFromPoint('parking', 'Parking point', currentEvent.parkingPoint),
    getMarkerFromPoint(
      'entrance',
      'Entrance point',
      currentEvent.entrancePoint,
    ),
  ].filter((marker): marker is AddressMarker => marker !== null)
}

function getAddressPointMarkers(
  address:
    | {
        parkingPoint?: AddressPoint
        entrancePoint?: AddressPoint
      }
    | null
    | undefined,
): Array<AddressMarker> {
  if (!address) {
    return []
  }

  return [
    getMarkerFromPoint('parking', 'Parking point', address.parkingPoint),
    getMarkerFromPoint('entrance', 'Entrance point', address.entrancePoint),
  ].filter((marker): marker is AddressMarker => marker !== null)
}

function getMarkerFromPoint(
  id: Extract<AddressMarker['id'], 'parking' | 'entrance'>,
  label: string,
  point: AddressPoint | undefined,
): AddressMarker | null {
  const [longitude, latitude] = point?.coordinates ?? []

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null
  }

  return {
    id,
    label,
    longitude,
    latitude,
  }
}
