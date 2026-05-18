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
    expect(source).toContain(
      '<AddressMapMarker key={marker.id} marker={marker} />',
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
    expect(source).not.toContain('entrancePoint:')
  })

  it('updates only the address parking point when corrected', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('api.address.updateAddressByAddressId')
    expect(source).toContain('parkingPoint: correctedParkingPoint')
    expect(source).not.toContain('updateEvent')
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
})
