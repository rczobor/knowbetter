import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Address map missing address toast', () => {
  it('mounts the Sonner toaster in the root document', () => {
    const source = readFileSync(
      new URL('./__root.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain("import { Toaster } from '../components/ui/sonner'")
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

    expect(source).toContain("import { useUserLocation } from './-user-location'")
    expect(source).toContain('getUserLocationMarker(userLocation)')
    expect(source).toContain('<AddressMapMarker key={marker.id} marker={marker} />')
  })
})
