import { describe, expect, it } from 'vitest'

import {
  getAddressParkingMarker,
  getEventPointFeatureCollection,
  getEventParkingPointFeatureCollection,
  getEventPointMarkers,
  getParkingFlowMarkers,
  getPointFromMapCenter,
  getPointFromViewportPoint,
  getAddressMarkers,
  getMarkerViewportTarget,
  getUserLocationMarker,
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

  it('builds a user location marker from browser coordinates', () => {
    expect(
      getUserLocationMarker({
        longitude: 19.0712,
        latitude: 47.5534,
      }),
    ).toEqual({
      id: 'userLocation',
      label: 'Your current location',
      longitude: 19.0712,
      latitude: 47.5534,
    })
  })

  it('builds only parking and user markers for the parking flow', () => {
    const markers = getParkingFlowMarkers(
      {
        parkingPoint: {
          type: 'Point',
          coordinates: [19.0764, 47.5556],
        },
        entrancePoint: {
          type: 'Point',
          coordinates: [19.0781, 47.5562],
        },
      },
      {
        longitude: 19.0712,
        latitude: 47.5534,
      },
    )

    expect(markers).toEqual([
      {
        id: 'parking',
        label: 'Parking point',
        longitude: 19.0764,
        latitude: 47.5556,
      },
      {
        id: 'userLocation',
        label: 'Your current location',
        longitude: 19.0712,
        latitude: 47.5534,
      },
    ])
  })

  it('builds an address parking marker without entrance markers', () => {
    expect(
      getAddressParkingMarker({
        parkingPoint: {
          type: 'Point',
          coordinates: [19.0764, 47.5556],
        },
        entrancePoint: {
          type: 'Point',
          coordinates: [19.0781, 47.5562],
        },
      }),
    ).toEqual({
      id: 'parking',
      label: 'Parking point',
      longitude: 19.0764,
      latitude: 47.5556,
    })
  })

  it('converts user location coordinates to a GeoJSON point', () => {
    expect(
      getPointFromViewportPoint({
        longitude: 19.0712,
        latitude: 47.5534,
      }),
    ).toEqual({
      type: 'Point',
      coordinates: [19.0712, 47.5534],
    })
  })

  it('converts a valid map center to a GeoJSON point', () => {
    expect(
      getPointFromMapCenter({
        lng: 19.0812,
        lat: 47.5594,
      }),
    ).toEqual({
      type: 'Point',
      coordinates: [19.0812, 47.5594],
    })
  })

  it('rejects invalid user location and map center coordinates', () => {
    expect(
      getPointFromViewportPoint({
        longitude: Number.NaN,
        latitude: 47.5534,
      }),
    ).toBeNull()
    expect(
      getPointFromMapCenter({
        lng: 19.0812,
        lat: Number.POSITIVE_INFINITY,
      }),
    ).toBeNull()
  })

  it('computes a fit viewport target for address and user location markers', () => {
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
      {
        id: 'userLocation',
        label: 'Your current location',
        longitude: 19.0712,
        latitude: 47.5534,
      },
    ])

    expect(viewportTarget).toEqual({
      type: 'fitBounds',
      bounds: [
        [19.0712, 47.5534],
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

  it('builds GeoJSON features for event parking points', () => {
    const featureCollection = getEventPointFeatureCollection([
      {
        _id: 'event-1',
        date: '2026-05-18',
        parkingPoint: {
          type: 'Point',
          coordinates: [19.0791, 47.5572],
        },
      },
    ])

    expect(featureCollection).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [19.0791, 47.5572],
          },
          properties: {
            eventId: 'event-1',
            kind: 'eventParking',
            label: 'Historical parking point',
            date: '2026-05-18',
          },
        },
      ],
    })
  })

  it('builds GeoJSON features for optional event entrance points', () => {
    const featureCollection = getEventPointFeatureCollection([
      {
        _id: 'event-2',
        parkingPoint: {
          type: 'Point',
          coordinates: [19.0791, 47.5572],
        },
        entrancePoint: {
          type: 'Point',
          coordinates: [19.0803, 47.5584],
        },
      },
    ])

    expect(featureCollection.features).toEqual([
      expect.objectContaining({
        geometry: {
          type: 'Point',
          coordinates: [19.0791, 47.5572],
        },
        properties: expect.objectContaining({
          kind: 'eventParking',
        }),
      }),
      expect.objectContaining({
        geometry: {
          type: 'Point',
          coordinates: [19.0803, 47.5584],
        },
        properties: expect.objectContaining({
          kind: 'eventEntrance',
          label: 'Historical entrance point',
        }),
      }),
    ])
  })

  it('builds GeoJSON features for event parking points only', () => {
    const featureCollection = getEventParkingPointFeatureCollection([
      {
        _id: 'event-2',
        parkingPoint: {
          type: 'Point',
          coordinates: [19.0791, 47.5572],
        },
        entrancePoint: {
          type: 'Point',
          coordinates: [19.0803, 47.5584],
        },
      },
    ])

    expect(featureCollection.features).toEqual([
      expect.objectContaining({
        geometry: {
          type: 'Point',
          coordinates: [19.0791, 47.5572],
        },
        properties: expect.objectContaining({
          kind: 'eventParking',
        }),
      }),
    ])
  })

  it('ignores malformed event coordinates', () => {
    const featureCollection = getEventPointFeatureCollection([
      {
        _id: 'event-1',
        parkingPoint: {
          type: 'Point',
          coordinates: [19.0791],
        },
        entrancePoint: {
          type: 'Point',
          coordinates: [19.0803, Number.POSITIVE_INFINITY],
        },
      },
    ])

    expect(featureCollection.features).toEqual([])
  })

  it('computes a viewport target for address, event, and user location points', () => {
    const addressMarkers = getAddressMarkers({
      parkingPoint: {
        type: 'Point',
        coordinates: [19.0764, 47.5556],
      },
      entrancePoint: {
        type: 'Point',
        coordinates: [19.0781, 47.5562],
      },
    })
    const eventMarkers = getEventPointMarkers([
      {
        _id: 'event-1',
        parkingPoint: {
          type: 'Point',
          coordinates: [19.0812, 47.5594],
        },
      },
    ])
    const userLocationMarker = getUserLocationMarker({
      longitude: 19.0712,
      latitude: 47.5534,
    })

    const viewportTarget = getMarkerViewportTarget([
      ...addressMarkers,
      ...eventMarkers,
      ...(userLocationMarker ? [userLocationMarker] : []),
    ])

    expect(viewportTarget).toEqual({
      type: 'fitBounds',
      bounds: [
        [19.0712, 47.5534],
        [19.0812, 47.5594],
      ],
    })
  })
})
