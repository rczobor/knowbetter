import { describe, expect, it } from 'vitest'

import {
  shouldAppendWalkingTracePoint,
  getActiveEventFeatureCollections,
  getActiveEventViewportMarkers,
  getAddressParkingMarker,
  getEventPointFeatureCollection,
  getEventParkingPointFeatureCollection,
  getEventPointMarkers,
  getParkingArrivalViewportMarkers,
  getParkingFlowMarkers,
  getPointFromMapCenter,
  getPointFromViewportPoint,
  getAddressMarkers,
  getMapFitPadding,
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

  it('waits to fit the arrival viewport until geolocation resolves', () => {
    expect(
      getParkingArrivalViewportMarkers(
        {
          parkingPoint: {
            type: 'Point',
            coordinates: [19.0764, 47.5556],
          },
        },
        null,
        'loading',
      ),
    ).toEqual([])

    expect(
      getParkingArrivalViewportMarkers(
        {
          parkingPoint: {
            type: 'Point',
            coordinates: [19.0764, 47.5556],
          },
        },
        {
          longitude: 19.0712,
          latitude: 47.5534,
        },
        'available',
      ),
    ).toEqual([
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

  it('adds measured drawer height to the bottom fit padding', () => {
    expect(getMapFitPadding(256)).toEqual({
      top: 80,
      right: 80,
      bottom: 336,
      left: 80,
    })
  })

  it('uses base fit padding when the drawer height is unavailable', () => {
    expect(getMapFitPadding(null)).toEqual({
      top: 80,
      right: 80,
      bottom: 80,
      left: 80,
    })
  })

  it('builds active event origin, walking line, and destination GeoJSON', () => {
    const featureCollections = getActiveEventFeatureCollections({
      _id: 'event-1',
      parkingPoint: {
        type: 'Point',
        coordinates: [19.0764, 47.5556],
      },
      walkingTraces: {
        type: 'MultiPoint',
        coordinates: [
          [19.0764, 47.5556],
          [19.0771, 47.5561],
          [19.0781, 47.5562],
        ],
      },
      entrancePoint: {
        type: 'Point',
        coordinates: [19.0781, 47.5562],
      },
    })

    expect(featureCollections.points.features).toEqual([
      expect.objectContaining({
        geometry: {
          type: 'Point',
          coordinates: [19.0764, 47.5556],
        },
        properties: expect.objectContaining({
          kind: 'activeParking',
        }),
      }),
      expect.objectContaining({
        geometry: {
          type: 'Point',
          coordinates: [19.0781, 47.5562],
        },
        properties: expect.objectContaining({
          kind: 'activeEntrance',
        }),
      }),
    ])
    expect(featureCollections.line.features).toEqual([
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [19.0764, 47.5556],
            [19.0771, 47.5561],
            [19.0781, 47.5562],
          ],
        },
        properties: {
          eventId: 'event-1',
          kind: 'activeWalkingTrace',
          label: 'Walking trace',
        },
      },
    ])
  })

  it('ignores malformed walking trace coordinates and waits for two valid points', () => {
    const featureCollections = getActiveEventFeatureCollections({
      _id: 'event-2',
      walkingTraces: {
        type: 'MultiPoint',
        coordinates: [[19.0764], [Number.NaN, 47.5561], [19.0781, 47.5562]],
      },
    })

    expect(featureCollections.line.features).toEqual([])
  })

  it('throttles walking trace appends by elapsed time or distance', () => {
    expect(
      shouldAppendWalkingTracePoint({
        lastPoint: {
          longitude: 19.0764,
          latitude: 47.5556,
        },
        nextPoint: {
          longitude: 19.07641,
          latitude: 47.55561,
        },
        lastAppendTime: 1000,
        nextAppendTime: 3000,
      }),
    ).toBe(false)
    expect(
      shouldAppendWalkingTracePoint({
        lastPoint: {
          longitude: 19.0764,
          latitude: 47.5556,
        },
        nextPoint: {
          longitude: 19.07641,
          latitude: 47.55561,
        },
        lastAppendTime: 1000,
        nextAppendTime: 6000,
      }),
    ).toBe(true)
    expect(
      shouldAppendWalkingTracePoint({
        lastPoint: {
          longitude: 19.0764,
          latitude: 47.5556,
        },
        nextPoint: {
          longitude: 19.0764,
          latitude: 47.55565,
        },
        lastAppendTime: 1000,
        nextAppendTime: 2000,
      }),
    ).toBe(true)
  })

  it('builds viewport markers from active event parking, trace, and entrance', () => {
    const markers = getActiveEventViewportMarkers({
      _id: 'event-3',
      parkingPoint: {
        type: 'Point',
        coordinates: [19.0764, 47.5556],
      },
      walkingTraces: {
        type: 'MultiPoint',
        coordinates: [
          [19.0766, 47.5558],
          [Number.NaN, 47.556],
          [19.0771, 47.5561],
        ],
      },
      entrancePoint: {
        type: 'Point',
        coordinates: [19.0781, 47.5562],
      },
    })

    expect(markers).toEqual([
      {
        longitude: 19.0764,
        latitude: 47.5556,
      },
      {
        longitude: 19.0766,
        latitude: 47.5558,
      },
      {
        longitude: 19.0771,
        latitude: 47.5561,
      },
      {
        longitude: 19.0781,
        latitude: 47.5562,
      },
    ])
  })
})
