import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { MapRef } from 'react-map-gl/mapbox'
import Map, { Layer, Source } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Layers } from 'lucide-react'
import { useQuery } from 'convex/react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar'
import useWalkingTracesLayer from '@/hooks/use-walking-traces'
import { Switch } from '@/components/ui/switch'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { getAddressMarkers } from './-address-map'
import { AddressMapMarker } from './-address-map-marker'
import { api } from '../../convex/_generated/api'
import MapImages from '@/components/map-image'
import RouteArrowHeadLayer from '@/components/ui/route-arrow-head-layer'
import bbox from '@turf/bbox'

export const Route = createFileRoute('/address')({ component: Address })

const MAPBOX_ACCESS_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN
const CENTER = { lng: 19.07744443713043, lat: 47.55396193398739 }
const MOCK_ADDRESS_ID = 'my_house'

function LayersTrigger() {
  const { toggleSidebar } = useSidebar()
  return (
      <Button
        className="shadow-md p-2 absolute right-4 top-4 z-50"
        size="icon-lg"
        variant="secondary"
        onClick={toggleSidebar}
      >
        <Layers className="size-6" />
      </Button>
  )
}

function LayerToggle({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: () => void
}) {
  return (
    <Field orientation="horizontal" className="max-w-sm py-3">
      <FieldContent>
        <FieldLabel htmlFor={id} className="font-bold">
          {label}
        </FieldLabel>
      </FieldContent>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </Field>
  )
}

function LayersSidebar({
  showWalkingTraces,
  onToggleWalkingTraces,
  showParking,
  onToggleParking,
  showEntrance,
  onToggleEntrance,
}: {
  showWalkingTraces: boolean
  onToggleWalkingTraces: () => void
  showParking: boolean
  onToggleParking: () => void
  showEntrance: boolean
  onToggleEntrance: () => void
}) {
  return (
    <Sidebar side="right" collapsible="offcanvas">
      <SidebarHeader className="border-b px-4 py-3">
        <span className="font-bold">Layers</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <LayerToggle
              id="walking-traces"
              label="Walking Traces"
              checked={showWalkingTraces}
              onCheckedChange={onToggleWalkingTraces}
            />
            <LayerToggle
              id="parking"
              label="Parking Spot"
              checked={showParking}
              onCheckedChange={onToggleParking}
            />
            <LayerToggle
              id="entrance"
              label="Address"
              checked={showEntrance}
              onCheckedChange={onToggleEntrance}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function Address() {
  const [showWalkingTraces, setShowWalkingTraces] = useState(true)
  const [showParking, setShowParking] = useState(true)
  const [showEntrance, setShowEntrance] = useState(true)
  const [hasMoved, setHasMoved] = useState(false)

  const mapRef = useRef<MapRef | null>(null)
  const address = useQuery(api.address.getAddressByAddressId, {
    addressId: MOCK_ADDRESS_ID,
  })
  const addressMarkers = getAddressMarkers(address).filter(
    (m) => (m.id === 'parking' ? showParking : showEntrance),
  )
  const { geojson, layer, endpointsGeojson, endpointsLayer } = useWalkingTracesLayer(showWalkingTraces)

  useEffect(() => {
    const map = mapRef.current

    if (!map || hasMoved) return
    const [minLng, minLat, maxLng, maxLat] = bbox(geojson)

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 80,
        maxZoom: 19,
        duration: 600,
      },
    )
  }, [mapRef, geojson, hasMoved])

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarInset className="relative overflow-hidden">
        <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          initialViewState={{
            longitude: CENTER.lng,
            latitude: CENTER.lat,
            zoom: 16,
          }}
          style={{ height: '100%', width: '100%', position: 'relative' }}
          mapStyle="mapbox://styles/robertczobor/clnu2vyeo00n801qw3eyz5fm3"
          ref={mapRef}
          onDrag={() => setHasMoved(true)}
        >
          <MapImages />

          {addressMarkers.map((marker) => (
            <AddressMapMarker key={marker.id} marker={marker} />
          ))}

          <Source id="walking-traces" type="geojson" data={geojson}>
            <Layer {...layer} />
            <RouteArrowHeadLayer
              id={layer.id}
              color={layer.paint['line-color']}
            />
          </Source>
          <Source id="walking-traces-endpoints" type="geojson" data={endpointsGeojson}>
            <Layer {...endpointsLayer} />
          </Source>
        </Map>

        <LayersTrigger />
      </SidebarInset>
      <LayersSidebar
        showWalkingTraces={showWalkingTraces}
        onToggleWalkingTraces={() => setShowWalkingTraces((v) => !v)}
        showParking={showParking}
        onToggleParking={() => setShowParking((v) => !v)}
        showEntrance={showEntrance}
        onToggleEntrance={() => setShowEntrance((v) => !v)}
      />
    </SidebarProvider>
  )
}
