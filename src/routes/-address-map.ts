export type AddressPoint = {
  type: 'Point'
  coordinates: Array<number>
}

export type AddressWithPoints = {
  parkingPoint?: AddressPoint
  entrancePoint?: AddressPoint
} | null | undefined

export type AddressMarker = {
  id: 'parking' | 'entrance'
  label: string
  longitude: number
  latitude: number
}

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

function pointToMarker(
  id: AddressMarker['id'],
  label: string,
  point: AddressPoint | undefined,
): AddressMarker | null {
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

  return {
    id,
    label,
    longitude,
    latitude,
  }
}

export function getAddressMarkers(address: AddressWithPoints): Array<AddressMarker> {
  if (!address) {
    return []
  }

  return [
    pointToMarker('parking', 'Parking point', address.parkingPoint),
    pointToMarker('entrance', 'Entrance point', address.entrancePoint),
  ].filter((marker): marker is AddressMarker => marker !== null)
}

export function getMarkerViewportTarget(
  markers: Array<AddressMarker>,
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
