import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('RouteArrowHeadLayer', () => {
  it('rotates the left-pointing arrow asset into the route direction', () => {
    const source = readFileSync(
      new URL('./route-arrow-head-layer.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain("'icon-rotate': 180")
  })

  it('lets operation routes hide arrows with walking traces', () => {
    const source = readFileSync(
      new URL('../../routes/operation.address.$addressId.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('hidden={!showWalkingTraces}')
  })
})
