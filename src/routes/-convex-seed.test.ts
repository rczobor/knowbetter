import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Convex seed data', () => {
  it('defines an idempotent default seed mutation with addresses and events', () => {
    const source = readFileSync(
      new URL('../../convex/seed.ts', import.meta.url),
      'utf8',
    )
    const packageJson = readFileSync(
      new URL('../../package.json', import.meta.url),
      'utf8',
    )

    expect(source).toContain('export const defaults = mutation')
    expect(source).toContain("addressId: 'my_house2'")
    expect(source).toContain("addressId: 'my_house'")
    expect(source).toContain(
      'coordinates: [19.076139540833008, 47.55537243989521]',
    )
    expect(source).toContain(
      'coordinates: [19.077512084359313, 47.55559171479811]',
    )
    expect(source).toContain("type: 'MultiPoint'")
    expect(source).toContain('walkingTraces')
    expect(source).toContain(".query('address')")
    expect(source).toContain(".query('events')")
    expect(source).toContain('event.date === seedEvent.date')
    expect(source).toContain('await ctx.db.patch(existingEvent._id')
    expect(source).toContain("await ctx.db.insert('events'")
    expect(packageJson).toContain('"seed": "convex run seed:defaults"')
  })
})
