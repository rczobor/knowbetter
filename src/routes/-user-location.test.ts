import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('user location hook', () => {
  it('refreshes the current position when the app returns to the foreground', () => {
    const source = readFileSync(
      new URL('./-user-location.ts', import.meta.url),
      'utf8',
    )

    expect(source).toContain('updateCurrentPosition()')
    expect(source).toContain("document.visibilityState === 'visible'")
    expect(source).toContain(
      "document.addEventListener('visibilitychange', handleVisibilityChange)",
    )
    expect(source).toContain(
      "document.removeEventListener('visibilitychange', handleVisibilityChange)",
    )
  })
})
