import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Home route map layout', () => {
  it('uses viewport-based sizing instead of fixed map pixels', () => {
    const source = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8')

    expect(source).toContain('className="native-map-screen home-map-screen"')
    expect(source).toContain("height: '100%'")
    expect(source).toContain("width: '100%'")
    expect(source).not.toContain('style={{ width: 1000, height: 700 }}')
  })

  it('extends map screens into the iOS PWA bottom safe area', () => {
    const styles = readFileSync(
      new URL('../styles.css', import.meta.url),
      'utf8',
    )
    const homeSource = readFileSync(
      new URL('./index.tsx', import.meta.url),
      'utf8',
    )
    const addressSource = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )
    const eventReviewSource = readFileSync(
      new URL('./address.$addressId_.event.$eventId.tsx', import.meta.url),
      'utf8',
    )

    expect(styles).toContain('.native-map-screen')
    expect(styles).toContain(
      '--kb-safe-bottom: env(safe-area-inset-bottom, 0px)',
    )
    expect(styles).toContain(
      '--kb-bottom-ui-gap: calc(var(--kb-safe-bottom) + 1rem)',
    )
    expect(styles).toContain(
      '--kb-floating-bottom-ui-gap: calc(var(--kb-safe-bottom) + 2rem)',
    )
    expect(styles).toContain(
      '--kb-map-control-bottom-gap: calc(var(--kb-safe-bottom) + 0.75rem)',
    )
    expect(styles).toContain(
      '--kb-map-screen-height: calc(100dvh + var(--kb-safe-bottom))',
    )
    expect(styles).toContain('position: relative')
    expect(styles).toContain('height: var(--kb-map-screen-height)')
    expect(styles).not.toContain('height: 100vh')
    expect(styles).not.toContain('min-height: 100lvh')
    expect(styles).not.toContain('body:has(.native-map-screen)')
    expect(styles).toContain('bottom: var(--kb-floating-bottom-ui-gap)')
    expect(styles).toContain('.native-map-screen .mapboxgl-ctrl-bottom-left')
    expect(styles).toContain('.native-map-screen .mapboxgl-ctrl-bottom-right')
    expect(styles).toContain('bottom: var(--kb-map-control-bottom-gap)')
    expect(styles).toContain('.home-map-screen .mapboxgl-ctrl-bottom-left')
    expect(styles).toContain('.home-map-screen .mapboxgl-ctrl-bottom-right')
    expect(styles).toContain('var(--kb-floating-panel-height, 0px)')
    expect(homeSource).toContain(
      'className="native-map-screen home-map-screen"',
    )
    expect(homeSource).toContain('home-map-screen')
    expect(homeSource).toContain('--kb-floating-panel-height')
    expect(homeSource).toContain('onHeightChange={setAddressPanelHeight}')
    expect(homeSource).toContain('ResizeObserver')
    expect(addressSource).toContain('className="native-map-screen"')
    expect(eventReviewSource).toContain('className="native-map-screen"')
    expect(homeSource).toContain('safe-bottom-panel')
  })

  it('uses the shared current location hook and renders the user location marker', () => {
    const source = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8')

    expect(source).toContain(
      "import { useUserLocation } from './-user-location'",
    )
    expect(source).toContain('const userLocation = userLocationState.location')
    expect(source).toContain('getUserLocationMarker(userLocation)')
    expect(source).toContain(
      '<UserLocationMarker marker={userLocationMarker} />',
    )
  })

  it('renders all address parking and entrance points on the home map', () => {
    const source = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8')

    expect(source).toContain('getAddressMarkers(address)')
    expect(source).toContain('const addressMarkers = useMemo')
    expect(source).toContain('<HomeAddressPointMarker')
    expect(source).toContain('<SquareParking className="h-5 w-5"')
    expect(source).toContain('<DoorOpen className="h-5 w-5"')
    expect(source).toContain('...addressMarkers')
    expect(source).toContain(
      '...(userLocationMarker ? [userLocationMarker] : [])',
    )
  })

  it('lists available Convex addresses and links them to address routes', () => {
    const source = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8')
    const convexSource = readFileSync(
      new URL('../../convex/address.ts', import.meta.url),
      'utf8',
    )

    expect(convexSource).toContain('export const listAddresses = query')
    expect(convexSource).toContain("ctx.db.query('address').collect()")
    expect(source).toContain('useQuery(api.address.listAddresses, {})')
    expect(source).toContain('<AddressListPanel')
    expect(source).toContain('addresses={addresses}')
    expect(source).toContain('onHeightChange={setAddressPanelHeight}')
    expect(source).toContain('to="/address/$addressId"')
    expect(source).toContain('params={{ addressId: address.addressId }}')
    expect(source).toContain('Available addresses')
  })
})
