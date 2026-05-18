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
    expect(source).toContain('getUserLocationMarker(userLocation)')
    expect(source).toContain(
      '<AddressMapMarker key={marker.id} marker={marker} />',
    )
  })

  it('queries historical events for the address route', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('api.address.getEventsByAddressId')
  })

  it('renders historical event coordinates with clustered Mapbox layers', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('<Source')
    expect(source).toContain('cluster')
    expect(source).toContain('historical-event-clusters')
    expect(source).toContain('historical-event-cluster-count')
    expect(source).toContain('historical-event-parking-points')
    expect(source).toContain('historical-event-entrance-points')
  })

  it('uses matching blue and orange colors for address and event points', () => {
    const source = readFileSync(
      new URL('./address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('bg-blue-600')
    expect(source).toContain('bg-orange-500')
    expect(source).toContain("'circle-color': '#2563eb'")
    expect(source).toContain("'circle-color': '#f97316'")
    expect(source).not.toContain('bg-emerald-600')
    expect(source).not.toContain("'circle-color': '#a855f7'")
  })
})
