import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/../../convex/_generated/api'
import type { LayerProps } from 'react-map-gl/mapbox-legacy'

const MOCK_ADDRESS_ID = 'my_house'

const randomizeEventColor = (i: number) =>
  `hsl(${(i * 137.508) % 360}, 70%, 55%)`

export default function useWalkingTracesLayer(showWalkingTraces: boolean) {
  const events = useQuery(api.address.getEventsByAddressId, {
    addressId: MOCK_ADDRESS_ID,
  })

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: (events ?? []).flatMap((event, i) => {
        if (!event.walkingTraces) return []
        return [{
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: event.walkingTraces.coordinates,
          },
          properties: { eventIndex: i },
        }]
      }),
    }),
    [events],
  )

  const endpointsGeojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: (events ?? []).flatMap((event, i) => {
        const coords = event.walkingTraces?.coordinates
        if (!coords || coords.length < 1) return []
        const color = randomizeEventColor(i)
        const toPoint = (coord: number[]) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: coord },
          properties: { color },
        })
        return coords.length === 1
          ? [toPoint(coords[0])]
          : [toPoint(coords[0]), toPoint(coords[coords.length - 1])]
      }),
    }),
    [events],
  )

  const layer = useMemo(() => {
    const colorExpr = events?.length
      ? [
          'match',
          ['get', 'eventIndex'],
          ...events.flatMap((_, i) => [i, randomizeEventColor(i)]),
          '#191a1a',
        ]
      : '#191a1a'

    return {
      id: 'walking-traces',
      type: 'line' as const,
      paint: {
        'line-color': colorExpr as string,
        'line-width': 2,
        'line-dasharray': [2, 3],
        'line-opacity': 0.85,
      },
      layout: {
        'line-cap': 'round' as const,
        'line-join': 'round' as const,
        visibility: showWalkingTraces ? 'visible' : 'none',
      },
    }
  }, [events, showWalkingTraces]) satisfies LayerProps

  const endpointsLayer = useMemo(
    () => ({
      id: 'walking-traces-endpoints',
      type: 'circle' as const,
      paint: {
        'circle-color': ['get', 'color'] as unknown as string,
        'circle-radius': 5,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
      layout: {
        visibility: showWalkingTraces ? 'visible' : 'none',
      },
    }),
    [showWalkingTraces],
  ) satisfies LayerProps

  return { geojson, layer, endpointsGeojson, endpointsLayer }
}
