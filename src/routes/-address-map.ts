export type AddressPoint = {
  type: 'Point'
  coordinates: Array<number>
}

export type EventPointKind = 'eventParking' | 'eventEntrance'

export type EventPointFeatureProperties = {
  eventId: string
  kind: EventPointKind
  label: string
  date?: string
}

export type EventPointFeature = {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: EventPointFeatureProperties
}

export type EventPointFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<EventPointFeature>
}

export type EventWithPoints =
  | {
      _id?: string
      date?: string
      parkingPoint?: AddressPoint
      entrancePoint?: AddressPoint
    }
  | null
  | undefined

export type AddressWithPoints =
  | {
      parkingPoint?: AddressPoint
      entrancePoint?: AddressPoint
    }
  | null
  | undefined

export type MapViewportPoint = {
  id?: string
  label?: string
  longitude: number
  latitude: number
}

export type AddressMarker = {
  id: 'parking' | 'entrance' | 'userLocation'
  label: string
  longitude: number
  latitude: number
}

export type UserLocationPoint =
  | {
      longitude: number
      latitude: number
    }
  | null
  | undefined

export type MapCenterPoint =
  | {
      lng: number
      lat: number
    }
  | null
  | undefined

export type MarkerViewportTarget =
  | {
      type: 'fitBounds'
      bounds: [[number, number], [number, number]]
    }
  | {
      type: 'flyTo'
      longitude: number
      latitude: number
      zoom: number
    }
  | null

const MARKER_ZOOM = 17
const MAP_FIT_PADDING = 80

function getValidPointCoordinates(
  point: AddressPoint | undefined,
): [number, number] | null {
  const longitude = point?.coordinates[0]
  const latitude = point?.coordinates[1]

  if (
    typeof longitude !== 'number' ||
    typeof latitude !== 'number' ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude)
  ) {
    return null
  }

  return [longitude, latitude]
}

function pointToMarker(
  id: AddressMarker['id'],
  label: string,
  point: AddressPoint | undefined,
): AddressMarker | null {
  const coordinates = getValidPointCoordinates(point)

  if (!coordinates) {
    return null
  }

  const [longitude, latitude] = coordinates

  return {
    id,
    label,
    longitude,
    latitude,
  }
}

export function getAddressMarkers(
  address: AddressWithPoints,
): Array<AddressMarker> {
  if (!address) {
    return []
  }

  return [
    pointToMarker('parking', 'Parking point', address.parkingPoint),
    pointToMarker('entrance', 'Entrance point', address.entrancePoint),
  ].filter((marker): marker is AddressMarker => marker !== null)
}

export function getAddressParkingMarker(
  address: AddressWithPoints,
): AddressMarker | null {
  if (!address) {
    return null
  }

  return pointToMarker('parking', 'Parking point', address.parkingPoint)
}

export function getUserLocationMarker(
  userLocation: UserLocationPoint,
): AddressMarker | null {
  if (
    !userLocation ||
    !Number.isFinite(userLocation.longitude) ||
    !Number.isFinite(userLocation.latitude)
  ) {
    return null
  }

  return {
    id: 'userLocation',
    label: 'Your current location',
    longitude: userLocation.longitude,
    latitude: userLocation.latitude,
  }
}

export function getParkingFlowMarkers(
  address: AddressWithPoints,
  userLocation: UserLocationPoint,
): Array<AddressMarker> {
  return [
    getAddressParkingMarker(address),
    getUserLocationMarker(userLocation),
  ].filter((marker): marker is AddressMarker => marker !== null)
}

export function getPointFromViewportPoint(
  point: UserLocationPoint,
): AddressPoint | null {
  if (
    !point ||
    !Number.isFinite(point.longitude) ||
    !Number.isFinite(point.latitude)
  ) {
    return null
  }

  return {
    type: 'Point',
    coordinates: [point.longitude, point.latitude],
  }
}

export function getPointFromMapCenter(
  center: MapCenterPoint,
): AddressPoint | null {
  if (!center || !Number.isFinite(center.lng) || !Number.isFinite(center.lat)) {
    return null
  }

  return {
    type: 'Point',
    coordinates: [center.lng, center.lat],
  }
}

function eventPointLabel(kind: EventPointKind) {
  if (kind === 'eventParking') {
    return 'Historical parking point'
  }

  return 'Historical entrance point'
}

function eventPointId(event: EventWithPoints, eventIndex: number) {
  if (event?._id) {
    return event._id
  }

  return `event-${eventIndex}`
}

function eventPointToFeature(
  event: EventWithPoints,
  eventIndex: number,
  kind: EventPointKind,
  point: AddressPoint | undefined,
): EventPointFeature | null {
  const coordinates = getValidPointCoordinates(point)

  if (!event || !coordinates) {
    return null
  }

  const properties: EventPointFeatureProperties = {
    eventId: eventPointId(event, eventIndex),
    kind,
    label: eventPointLabel(kind),
  }

  if (typeof event.date === 'string') {
    properties.date = event.date
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates,
    },
    properties,
  }
}

export function getEventPointFeatureCollection(
  events: Array<EventWithPoints> | null | undefined,
): EventPointFeatureCollection {
  if (!events) {
    return {
      type: 'FeatureCollection',
      features: [],
    }
  }

  return {
    type: 'FeatureCollection',
    features: events.flatMap((event, eventIndex) =>
      [
        eventPointToFeature(
          event,
          eventIndex,
          'eventParking',
          event?.parkingPoint,
        ),
        eventPointToFeature(
          event,
          eventIndex,
          'eventEntrance',
          event?.entrancePoint,
        ),
      ].filter((feature): feature is EventPointFeature => feature !== null),
    ),
  }
}

export function getEventParkingPointFeatureCollection(
  events: Array<EventWithPoints> | null | undefined,
): EventPointFeatureCollection {
  if (!events) {
    return {
      type: 'FeatureCollection',
      features: [],
    }
  }

  return {
    type: 'FeatureCollection',
    features: events
      .map((event, eventIndex) =>
        eventPointToFeature(
          event,
          eventIndex,
          'eventParking',
          event?.parkingPoint,
        ),
      )
      .filter((feature): feature is EventPointFeature => feature !== null),
  }
}

export function getEventPointMarkers(
  events: Array<EventWithPoints> | null | undefined,
): Array<MapViewportPoint> {
  return getEventPointFeatureCollection(events).features.map((feature) => {
    const [longitude, latitude] = feature.geometry.coordinates

    return {
      longitude,
      latitude,
    }
  })
}

export function getMarkerViewportTarget(
  markers: Array<MapViewportPoint>,
): MarkerViewportTarget {
  if (markers.length === 0) {
    return null
  }

  if (markers.length === 1) {
    const [marker] = markers

    return {
      type: 'flyTo',
      longitude: marker.longitude,
      latitude: marker.latitude,
      zoom: MARKER_ZOOM,
    }
  }

  const longitudes = markers.map((marker) => marker.longitude)
  const latitudes = markers.map((marker) => marker.latitude)

  return {
    type: 'fitBounds',
    bounds: [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ],
  }
}

export function getMapFitPadding(drawerHeight: number | null | undefined) {
  const bottomInset =
    typeof drawerHeight === 'number' &&
    Number.isFinite(drawerHeight) &&
    drawerHeight > 0
      ? Math.ceil(drawerHeight)
      : 0

  return {
    top: MAP_FIT_PADDING,
    right: MAP_FIT_PADDING,
    bottom: MAP_FIT_PADDING + bottomInset,
    left: MAP_FIT_PADDING,
  }
}
