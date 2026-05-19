import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Home route map layout', () => {
  it('uses viewport-based sizing instead of fixed map pixels', () => {
    const source = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8')

    expect(source).toContain('className="native-map-screen"')
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
      'height: calc(100dvh + env(safe-area-inset-bottom))',
    )
    expect(styles).toContain(
      'margin-bottom: calc(-1 * env(safe-area-inset-bottom))',
    )
    expect(homeSource).toContain('className="native-map-screen"')
    expect(addressSource).toContain('className="native-map-screen"')
    expect(eventReviewSource).toContain('className="native-map-screen"')
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

  it('lists available Convex addresses and links them to address routes', () => {
    const source = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8')
    const convexSource = readFileSync(
      new URL('../../convex/address.ts', import.meta.url),
      'utf8',
    )

    expect(convexSource).toContain('export const listAddresses = query')
    expect(convexSource).toContain("ctx.db.query('address').collect()")
    expect(source).toContain('useQuery(api.address.listAddresses, {})')
    expect(source).toContain('<AddressListPanel addresses={addresses} />')
    expect(source).toContain('to="/address/$addressId"')
    expect(source).toContain('params={{ addressId: address.addressId }}')
    expect(source).toContain('Available addresses')
  })
})
