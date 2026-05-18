export type AddressPoint = {
  type: 'Point'
  coordinates: Array<number>
}

export type AddressMultiPoint = {
  type: 'MultiPoint'
  coordinates: Array<Array<number>>
}

export type EventPointKind = 'eventParking' | 'eventEntrance'

export type ActiveEventPointKind = 'activeParking' | 'activeEntrance'

export type EventPointFeatureProperties = {
  eventId: string
  kind: EventPointKind | ActiveEventPointKind
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

export type ActiveEventWalkingTraceFeature = {
  type: 'Feature'
  geometry: {
    type: 'LineString'
    coordinates: Array<[number, number]>
  }
  properties: {
    eventId: string
    kind: 'activeWalkingTrace'
    label: string
  }
}

export type ActiveEventWalkingTraceFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<ActiveEventWalkingTraceFeature>
}

export type ActiveEventFeatureCollections = {
  points: EventPointFeatureCollection
  line: ActiveEventWalkingTraceFeatureCollection
}

export type EventWithPoints =
  | {
      _id?: string
      date?: string
      parkingPoint?: AddressPoint
      entrancePoint?: AddressPoint
      walkingTraces?: AddressMultiPoint
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

export type ParkingArrivalLocationStatus =
  | 'loading'
  | 'available'
  | 'error'
  | 'unsupported'

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
const WALKING_TRACE_TIME_THRESHOLD_MS = 5000
const WALKING_TRACE_DISTANCE_THRESHOLD_METERS = 5
const EARTH_RADIUS_METERS = 6371000

function getValidCoordinates(
  coordinates: Array<number> | undefined,
): [number, number] | null {
  const longitude = coordinates?.[0]
  const latitude = coordinates?.[1]

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

function getValidPointCoordinates(
  point: AddressPoint | undefined,
): [number, number] | null {
  return getValidCoordinates(point?.coordinates)
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

export function getParkingArrivalViewportMarkers(
  address: AddressWithPoints,
  userLocation: UserLocationPoint,
  locationStatus: ParkingArrivalLocationStatus,
): Array<AddressMarker> {
  if (locationStatus === 'loading' && !getUserLocationMarker(userLocation)) {
    return []
  }

  return getParkingFlowMarkers(address, userLocation)
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

function activeEventPointLabel(kind: ActiveEventPointKind) {
  if (kind === 'activeParking') {
    return 'Parking point'
  }

  return 'Entrance point'
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

function activeEventPointToFeature(
  event: EventWithPoints,
  kind: ActiveEventPointKind,
  point: AddressPoint | undefined,
): EventPointFeature | null {
  const coordinates = getValidPointCoordinates(point)

  if (!event || !coordinates) {
    return null
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates,
    },
    properties: {
      eventId: eventPointId(event, 0),
      kind,
      label: activeEventPointLabel(kind),
    },
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

export function getActiveEventFeatureCollections(
  event: EventWithPoints,
): ActiveEventFeatureCollections {
  const parkingCoordinates = getValidPointCoordinates(event?.parkingPoint)
  const entranceCoordinates = getValidPointCoordinates(event?.entrancePoint)
  const points: EventPointFeatureCollection = {
    type: 'FeatureCollection',
    features: [
      activeEventPointToFeature(event, 'activeParking', event?.parkingPoint),
      activeEventPointToFeature(event, 'activeEntrance', event?.entrancePoint),
    ].filter((feature): feature is EventPointFeature => feature !== null),
  }
  const traceCoordinates =
    event?.walkingTraces?.coordinates
      .map(getValidCoordinates)
      .filter(
        (coordinate): coordinate is [number, number] => coordinate !== null,
      ) ?? []
  const lineCoordinates = [
    parkingCoordinates,
    ...traceCoordinates,
    entranceCoordinates,
  ].reduce<Array<[number, number]>>((coordinates, coordinate) => {
    if (!coordinate) {
      return coordinates
    }

    const previousCoordinate = coordinates[coordinates.length - 1]

    if (
      coordinates.length > 0 &&
      previousCoordinate[0] === coordinate[0] &&
      previousCoordinate[1] === coordinate[1]
    ) {
      return coordinates
    }

    return [...coordinates, coordinate]
  }, [])
  const line: ActiveEventWalkingTraceFeatureCollection = {
    type: 'FeatureCollection',
    features:
      event && lineCoordinates.length >= 2
        ? [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: lineCoordinates,
              },
              properties: {
                eventId: eventPointId(event, 0),
                kind: 'activeWalkingTrace',
                label: 'Walking trace',
              },
            },
          ]
        : [],
  }

  return {
    points,
    line,
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

export function getActiveEventViewportMarkers(
  event: EventWithPoints,
): Array<MapViewportPoint> {
  if (!event) {
    return []
  }

  const parkingCoordinates = getValidPointCoordinates(event.parkingPoint)
  const entranceCoordinates = getValidPointCoordinates(event.entrancePoint)
  const traceCoordinates =
    event.walkingTraces?.coordinates
      .map(getValidCoordinates)
      .filter(
        (coordinate): coordinate is [number, number] => coordinate !== null,
      ) ?? []

  return [parkingCoordinates, ...traceCoordinates, entranceCoordinates].flatMap(
    (coordinate) => {
      if (!coordinate) {
        return []
      }

      const [longitude, latitude] = coordinate

      return {
        longitude,
        latitude,
      }
    },
  )
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

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function getDistanceInMeters(
  firstPoint: UserLocationPoint,
  secondPoint: UserLocationPoint,
) {
  if (
    !firstPoint ||
    !secondPoint ||
    !Number.isFinite(firstPoint.longitude) ||
    !Number.isFinite(firstPoint.latitude) ||
    !Number.isFinite(secondPoint.longitude) ||
    !Number.isFinite(secondPoint.latitude)
  ) {
    return Number.POSITIVE_INFINITY
  }

  const deltaLatitude = toRadians(secondPoint.latitude - firstPoint.latitude)
  const deltaLongitude = toRadians(secondPoint.longitude - firstPoint.longitude)
  const firstLatitude = toRadians(firstPoint.latitude)
  const secondLatitude = toRadians(secondPoint.latitude)
  const haversine =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2)

  return (
    EARTH_RADIUS_METERS *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  )
}

export function shouldAppendWalkingTracePoint({
  lastPoint,
  nextPoint,
  lastAppendTime,
  nextAppendTime,
}: {
  lastPoint: UserLocationPoint
  nextPoint: UserLocationPoint
  lastAppendTime: number | null
  nextAppendTime: number
}) {
  if (!getPointFromViewportPoint(nextPoint)) {
    return false
  }

  if (!lastPoint || lastAppendTime === null) {
    return true
  }

  if (nextAppendTime - lastAppendTime >= WALKING_TRACE_TIME_THRESHOLD_MS) {
    return true
  }

  return (
    getDistanceInMeters(lastPoint, nextPoint) >=
    WALKING_TRACE_DISTANCE_THRESHOLD_METERS
  )
}
