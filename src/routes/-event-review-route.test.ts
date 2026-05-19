import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('event review route', () => {
  it('registers the address event subroute', () => {
    const source = readFileSync(
      new URL('./address.$addressId_.event.$eventId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain(
      "createFileRoute('/address/$addressId_/event/$eventId')",
    )
  })

  it('keeps the event route independent from the courier address flow', () => {
    const routeTree = readFileSync(
      new URL('../routeTree.gen.ts', import.meta.url),
      'utf8',
    )

    expect(routeTree).toContain("path: '/address/$addressId/event/$eventId'")
    expect(routeTree).toContain('getParentRoute: () => rootRouteImport')
    expect(routeTree).not.toContain(
      'getParentRoute: () => AddressAddressIdRoute',
    )
  })

  it('loads a single event by address and event id', () => {
    const source = readFileSync(
      new URL('./address.$addressId_.event.$eventId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('api.address.getEventByIdForAddressId')
    expect(source).toContain('addressId')
    expect(source).toContain('eventId')
  })

  it('renders the active event route layers without a drawer', () => {
    const routeSource = readFileSync(
      new URL('./address.$addressId_.event.$eventId.tsx', import.meta.url),
      'utf8',
    )
    const layerSource = readFileSync(
      new URL('./-active-event-layers.tsx', import.meta.url),
      'utf8',
    )

    expect(routeSource).toContain('<ActiveEventLayers')
    expect(layerSource).toContain('active-event-walking-line')
    expect(layerSource).toContain('active-event-parking-origin')
    expect(layerSource).toContain('active-event-entrance-destination')
    expect(layerSource).toContain('showPointLayers = true')
    expect(routeSource).not.toContain('Drawer')
  })

  it('shows an error toast when the event cannot be loaded', () => {
    const source = readFileSync(
      new URL('./address.$addressId_.event.$eventId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain("import { toast } from 'sonner'")
    expect(source).toContain('if (event !== null)')
    expect(source).toContain("toast.error('Event not found'")
    expect(source).toContain('id: `event-not-found-${eventId}`')
  })
})
