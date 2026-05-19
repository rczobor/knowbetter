import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Address map missing address toast', () => {
  it('mounts the Sonner toaster in the root document', () => {
    const source = readFileSync(
      new URL('./__root.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain(
      "import { Toaster } from '../components/ui/sonner'",
    )
    expect(source).toContain('<Toaster />')
  })

  it('configures readable rich-colored toasts', () => {
    const source = readFileSync(
      new URL('../components/ui/sonner.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('richColors')
    expect(source).toContain("position = 'top-center'")
    expect(source).toContain('duration = 4000')
    expect(source).toContain('--error-bg')
    expect(source).toContain('--error-text')
    expect(source).toContain("description: 'text-current/85'")
  })

  it('shows an error toast when Convex returns no address for the route addressId', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain("import { toast } from 'sonner'")
    expect(source).toContain('if (address !== null)')
    expect(source).toContain("toast.error('Address not found'")
    expect(source).toContain('id: `address-not-found-${addressId}`')
  })

  it('uses current location when building and rendering address map markers', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain(
      "import { useUserLocation } from './-user-location'",
    )
    expect(source).toContain('const userLocation = userLocationState.location')
    expect(source).toContain('getParkingFlowMarkers(address, userLocation)')
    expect(source).toContain('<AddressMapMarker')
    expect(source).toContain('marker={marker}')
  })

  it('uses compact user markers and icon markers for parking and entrance points', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )
    const homeSource = readFileSync(
      new URL('./index.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('flex h-7 w-7')
    expect(homeSource).toContain('flex h-7 w-7')
    expect(source).toContain('getActiveEventMarkers(currentEvent)')
    expect(source).toContain('getAddressPointMarkers(address)')
    expect(source).not.toContain('getWalkingEntranceHintMarkers(')
    expect(source).toContain('showPointLayers={false}')
    expect(source).toContain('<SquareParking className="h-5 w-5"')
    expect(source).toContain('<DoorOpen className="h-5 w-5"')
    expect(source).toContain('<LocateFixed className="h-4 w-4"')
    expect(source).toContain(
      'key={`${marker.id}-${marker.longitude}-${marker.latitude}`}',
    )
  })

  it('uses a bottom drawer for the parking arrival flow', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain("from '../components/ui/drawer'")
    expect(source).toContain('<Drawer open')
    expect(source).toContain('<DrawerContent')
    expect(source).toContain('ParkingFlowStep')
  })

  it('does not block automatic camera movement on drawer measurement', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).not.toContain('drawerHeight === null')
    expect(source).toContain('padding: getMapFitPadding(drawerHeight)')
    expect(source).toContain('retainPadding: false')
  })

  it('does not require the map load event before automatic camera movement', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).not.toContain('!mapLoaded')
  })

  it('reruns automatic camera movement after the map ref attaches', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('const handleMapRef = useCallback')
    expect(source).toContain('setMapAttached')
    expect(source).toContain('ref={handleMapRef}')
  })

  it('uses a remounted bounds initial view state for the arrival fit', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('const mapFitKey')
    expect(source).toContain('fitBoundsOptions')
    expect(source).toContain('key={mapFitKey}')
  })

  it('measures the drawer after its portal content attaches', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('const [drawerContent, setDrawerContent]')
    expect(source).toContain('ref={setDrawerContent}')
  })

  it('keeps the parking arrival drawer open until the flow advances', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('<Drawer open modal={false} dismissible={false}>')
    expect(source).not.toContain('onOpenChange')
  })

  it('creates an event from current location when the driver arrives', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('useMutation(api.address.addEventForAddressId)')
    expect(source).toContain('parkingPoint: arrivedParkingPoint')
    expect(source).toContain('date: new Date().toISOString()')
    expect(source).not.toContain('walkingTraces:')
  })

  it('stores the created event id for the walking flow', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('const [currentEvent, setCurrentEvent]')
    expect(source).toContain('const createdEvent = await addEventForAddressId')
    expect(source).toContain('setCurrentEvent(createdEvent)')
  })

  it('updates only the address parking point when corrected', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('api.address.updateAddressByAddressId')
    expect(source).toContain('parkingPoint: correctedParkingPoint')
    expect(source).toContain('handleSaveCorrectedParking')
  })

  it('shows historical event parking points only during center-pin adjustment', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('api.address.getEventsByAddressId')
    expect(source).toContain('getEventParkingPointFeatureCollection(events)')
    expect(source).toContain("parkingFlowStep === 'adjustParking' ? (")
    expect(source).toContain('<EventParkingPointLayer')
    expect(source).toContain('historical-event-parking-points')
    expect(source).toContain('getPointFromMapCenter(map.getCenter())')
    expect(source).toContain('CenterParkingPin')
    expect(source).toContain('getParkingFlowMarkers')
    expect(source).not.toContain('HistoricalEventLayers')
    expect(source).not.toContain('historical-event-entrance-points')
  })

  it('tracks walking traces after parking confirmation', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain("'walkingToEntrance'")
    expect(source).toContain('navigator.geolocation.watchPosition')
    expect(source).toContain('navigator.geolocation.clearWatch')
    expect(source).toContain('api.address.updateEventWalkingTraces')
    expect(source).toContain('shouldAppendWalkingTracePoint')
    expect(source).toContain(
      "const WALKING_LOCATION_TOAST_ID = 'walking-location-unavailable'",
    )
    expect(source).toContain('id: WALKING_LOCATION_TOAST_ID')
    expect(source).toContain('duration: WALKING_LOCATION_TOAST_DURATION_MS')
    expect(source).toContain('toast.dismiss(WALKING_LOCATION_TOAST_ID)')
  })

  it('shows address and event entrance hints while walking to the entrance', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('getWalkingEntranceHintFeatureCollection')
    expect(source).toContain('getWalkingEntranceHintViewportMarkers')
    expect(source).toContain(
      'getWalkingEntranceHintFeatureCollection(address, events)',
    )
    expect(source).toContain(
      'getWalkingEntranceHintViewportMarkers(address, events)',
    )
    expect(source).toContain("parkingFlowStep === 'walkingToEntrance' ? (")
    expect(source).toContain('<WalkingEntranceHintLayers')
    expect(source).toContain('walking-address-entrance-point')
    expect(source).toContain('walking-event-entrance-points')
  })

  it('finishes walking with one backend mutation and renders the completed event', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )
    const layerSource = readFileSync(
      new URL('./-active-event-layers.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('api.address.finishEventAtEntrance')
    expect(source).toContain("setParkingFlowStep('finishedWalking')")
    expect(source).toContain('<ActiveEventLayers')
    expect(layerSource).toContain('active-event-walking-line')
    expect(layerSource).toContain('active-event-parking-origin')
    expect(layerSource).toContain('active-event-entrance-destination')
  })

  it('lets the driver finish an address and return to the home route', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('useNavigate')
    expect(source).toContain("void navigate({ to: '/' })")
    expect(source).toContain('onCompleteAddress={handleCompleteAddress}')
    expect(source).toContain('onCompleteAddress: () => void')
    expect(source).toContain('Finish address')
    expect(source).not.toContain('<Button size="lg" disabled>')
    expect(source).not.toContain('Entrance saved')
  })
})
