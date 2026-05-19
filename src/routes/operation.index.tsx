import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import Map from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { api } from '../../convex/_generated/api'
import { AddressListPanel } from './-address-list-panel'

export const Route = createFileRoute('/operation/')({ component: Operation })

const MAPBOX_ACCESS_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN
const INITIAL_VIEW_STATE = {
  longitude: 19.076422156938513,
  latitude: 47.55561160380166,
  zoom: 14,
}

function Operation() {
  const addresses = useQuery(api.address.listAddresses, {})

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      <Map
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        initialViewState={INITIAL_VIEW_STATE}
        style={{ height: '100%', width: '100%', position: 'relative' }}
        mapStyle="mapbox://styles/robertczobor/clnu2vyeo00n801qw3eyz5fm3"
      />
      <AddressListPanel
        addresses={addresses}
        addressTo="/operation/address/$addressId"
      />
    </div>
  )
}
