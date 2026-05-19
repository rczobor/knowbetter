import { DoorOpen, LocateFixed, SquareParking } from 'lucide-react'
import { Marker } from 'react-map-gl/mapbox'
import type { AddressMarker } from './-address-map'

export const MARKER_CLASS_NAMES: Record<AddressMarker['id'], string> = {
  parking:
    'flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg shadow-black/25',
  entrance:
    'flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-lg shadow-black/25',
  userLocation:
    'flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-zinc-950 text-white shadow-lg shadow-black/25',
}

function AddressMapMarkerIcon({ marker }: { marker: AddressMarker }) {
  if (marker.id === 'parking') {
    return <SquareParking className="h-5 w-5" aria-hidden="true" />
  }
  if (marker.id === 'entrance') {
    return <DoorOpen className="h-5 w-5" aria-hidden="true" />
  }
  return <LocateFixed className="h-5 w-5" aria-hidden="true" />
}

export function AddressMapMarker({ marker }: { marker: AddressMarker }) {
  return (
    <Marker
      longitude={marker.longitude}
      latitude={marker.latitude}
      anchor={marker.id === 'userLocation' ? 'center' : 'bottom'}
    >
      <div className={MARKER_CLASS_NAMES[marker.id]} aria-label={marker.label}>
        {marker.id === 'userLocation' ? (
          <span className="sr-only">Your current location</span>
        ) : null}
        <AddressMapMarkerIcon marker={marker} />
      </div>
    </Marker>
  )
}
