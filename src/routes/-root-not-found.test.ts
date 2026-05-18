import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Root route not-found handling', () => {
  it('configures a root not-found component to avoid TanStack Router fallback warnings', () => {
    const source = readFileSync(
      new URL('./__root.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('notFoundComponent:')
  })

  it('sets the document title to the app name', () => {
    const source = readFileSync(
      new URL('./__root.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain("title: 'knowbetter'")
  })
})
