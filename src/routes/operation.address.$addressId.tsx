import { useContext, useEffect, useState } from 'react'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Layer, Source, useMap } from 'react-map-gl/mapbox'
import { Layers } from 'lucide-react'
import { useQuery } from 'convex/react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'
import useWalkingTracesLayer from '@/hooks/use-walking-traces'
import { Switch } from '@/components/ui/switch'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { getAddressMarkers } from './-address-map'
import { AddressMapMarker } from './-address-map-marker'
import { api } from '../../convex/_generated/api'
import RouteArrowHeadLayer from '@/components/ui/route-arrow-head-layer'
import bbox from '@turf/bbox'
import { OperationMapLoadedContext } from './operation'

export const Route = createFileRoute('/operation/address/$addressId')({
  component: Address,
})

const routeApi = getRouteApi('/operation/address/$addressId')

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
  const { addressId } = routeApi.useParams()
  const [showWalkingTraces, setShowWalkingTraces] = useState(true)
  const [showParking, setShowParking] = useState(true)
  const [showEntrance, setShowEntrance] = useState(true)
  const [hasMoved, setHasMoved] = useState(false)

  const mapLoaded = useContext(OperationMapLoadedContext)
  const { current: map } = useMap()

  const address = useQuery(api.address.getAddressByAddressId, { addressId })
  const addressMarkers = getAddressMarkers(address).filter((m) =>
    m.id === 'parking' ? showParking : showEntrance,
  )
  const { geojson, layer, endpointsGeojson, endpointsLayer } =
    useWalkingTracesLayer(addressId, showWalkingTraces)

  useEffect(() => {
    if (!map) return
    const handle = () => setHasMoved(true)
    map.on('drag', handle)
    return () => { map.off('drag', handle) }
  }, [map])

  useEffect(() => {
    if (!mapLoaded || !map || hasMoved) return
    const [minLng, minLat, maxLng, maxLat] = bbox(geojson)
    if (!isFinite(minLng) || !isFinite(minLat) || !isFinite(maxLng) || !isFinite(maxLat)) return
    map.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 150, maxZoom: 18, duration: 600 },
    )
  }, [map, mapLoaded, geojson, hasMoved])

  return (
    <>
      {addressMarkers.map((marker) => (
        <AddressMapMarker key={marker.id} marker={marker} />
      ))}

      <Source id="walking-traces" type="geojson" data={geojson}>
        <Layer {...layer} />
        <RouteArrowHeadLayer id={layer.id} color={layer.paint['line-color']} />
      </Source>
      <Source
        id="walking-traces-endpoints"
        type="geojson"
        data={endpointsGeojson}
      >
        <Layer {...endpointsLayer} />
      </Source>

      <LayersTrigger />
      <LayersSidebar
        showWalkingTraces={showWalkingTraces}
        onToggleWalkingTraces={() => setShowWalkingTraces((v) => !v)}
        showParking={showParking}
        onToggleParking={() => setShowParking((v) => !v)}
        showEntrance={showEntrance}
        onToggleEntrance={() => setShowEntrance((v) => !v)}
      />
    </>
  )
}
