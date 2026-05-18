import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('address Convex mutations', () => {
  it('preserves omitted address point fields when patching an address', () => {
    const source = readFileSync(
      new URL('../../convex/address.ts', import.meta.url),
      'utf8',
    )

    expect(source).toContain('const addressPatch')
    expect(source).toContain('if (args.parkingPoint !== undefined)')
    expect(source).toContain('if (args.entrancePoint !== undefined)')
    expect(source).toContain('...addressPatch')
  })

  it('omits empty event fields when creating an arrival event', () => {
    const source = readFileSync(
      new URL('../../convex/address.ts', import.meta.url),
      'utf8',
    )

    expect(source).toContain('const event')
    expect(source).toContain('if (args.parkingPoint !== undefined)')
    expect(source).toContain('if (args.entrancePoint !== undefined)')
    expect(source).toContain('if (args.walkingTraces !== undefined)')
    expect(source).toContain('...event')
  })

  it('finishes an event by saving entrance point to the event and address', () => {
    const source = readFileSync(
      new URL('../../convex/address.ts', import.meta.url),
      'utf8',
    )

    expect(source).toContain('export const finishEventAtEntrance = mutation')
    expect(source).toContain("eventId: v.id('events')")
    expect(source).toContain('if (existingEvent.addressId !== args.addressId)')
    expect(source).toContain(
      "throw new Error('Event does not belong to address')",
    )
    expect(source).toContain('entrancePoint: args.entrancePoint')
    expect(source).toContain('...addressPatch')
  })
})
