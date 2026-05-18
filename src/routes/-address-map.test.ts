import { describe, expect, it } from 'vitest'

import {
  getAddressMarkers,
  getMarkerViewportTarget,
} from './-address-map'

describe('address map helpers', () => {
  it('builds parking and entrance markers from address point coordinates', () => {
    const markers = getAddressMarkers({
      parkingPoint: {
        type: 'Point',
        coordinates: [19.0764, 47.5556],
      },
      entrancePoint: {
        type: 'Point',
        coordinates: [19.0781, 47.5562],
      },
    })

    expect(markers).toEqual([
      {
        id: 'parking',
        label: 'Parking point',
        longitude: 19.0764,
        latitude: 47.5556,
      },
      {
        id: 'entrance',
        label: 'Entrance point',
        longitude: 19.0781,
        latitude: 47.5562,
      },
    ])
  })

  it('omits missing optional address points', () => {
    expect(
      getAddressMarkers({
        parkingPoint: {
          type: 'Point',
          coordinates: [19.0764, 47.5556],
        },
      }),
    ).toHaveLength(1)
  })

  it('ignores malformed coordinate pairs', () => {
    const markers = getAddressMarkers({
      parkingPoint: {
        type: 'Point',
        coordinates: [19.0764],
      },
      entrancePoint: {
        type: 'Point',
        coordinates: [Number.NaN, 47.5562],
      },
    })

    expect(markers).toEqual([])
  })

  it('computes a fit viewport target for two markers', () => {
    const viewportTarget = getMarkerViewportTarget([
      {
        id: 'parking',
        label: 'Parking point',
        longitude: 19.0764,
        latitude: 47.5556,
      },
      {
        id: 'entrance',
        label: 'Entrance point',
        longitude: 19.0781,
        latitude: 47.5562,
      },
    ])

    expect(viewportTarget).toEqual({
      type: 'fitBounds',
      bounds: [
        [19.0764, 47.5556],
        [19.0781, 47.5562],
      ],
    })
  })

  it('computes a fly-to viewport target for one marker', () => {
    const viewportTarget = getMarkerViewportTarget([
      {
        id: 'parking',
        label: 'Parking point',
        longitude: 19.0764,
        latitude: 47.5556,
      },
    ])

    expect(viewportTarget).toEqual({
      type: 'flyTo',
      longitude: 19.0764,
      latitude: 47.5556,
      zoom: 17,
    })
  })
})
