import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Home route map layout', () => {
  it('uses viewport-based sizing instead of fixed map pixels', () => {
    const source = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8')

    expect(source).toContain('className="h-dvh w-screen overflow-hidden"')
    expect(source).toContain("height: '100%'")
    expect(source).toContain("width: '100%'")
    expect(source).not.toContain('style={{ width: 1000, height: 700 }}')
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
})
