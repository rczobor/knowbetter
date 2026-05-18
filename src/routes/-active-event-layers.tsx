import { Layer, Source } from 'react-map-gl/mapbox'
import type { LayerProps } from 'react-map-gl/mapbox'

import type { ActiveEventFeatureCollections } from './-address-map'

const ACTIVE_EVENT_WALKING_LINE_LAYER: LayerProps = {
  id: 'active-event-walking-line',
  type: 'line',
  paint: {
    'line-color': '#18181b',
    'line-width': 4,
    'line-dasharray': [1.5, 1.5],
    'line-opacity': 0.8,
  },
}

const ACTIVE_EVENT_PARKING_ORIGIN_LAYER: LayerProps = {
  id: 'active-event-parking-origin',
  type: 'circle',
  filter: ['==', ['get', 'kind'], 'activeParking'],
  paint: {
    'circle-color': '#2563eb',
    'circle-radius': 8,
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
}

const ACTIVE_EVENT_ENTRANCE_DESTINATION_LAYER: LayerProps = {
  id: 'active-event-entrance-destination',
  type: 'circle',
  filter: ['==', ['get', 'kind'], 'activeEntrance'],
  paint: {
    'circle-color': '#f97316',
    'circle-radius': 8,
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
}

export function ActiveEventLayers({
  activeEventFeatureCollections,
}: {
  activeEventFeatureCollections: ActiveEventFeatureCollections
}) {
  return (
    <>
      <Source
        id="active-event-walking-line"
        type="geojson"
        data={activeEventFeatureCollections.line}
      >
        <Layer {...ACTIVE_EVENT_WALKING_LINE_LAYER} />
      </Source>
      <Source
        id="active-event-points"
        type="geojson"
        data={activeEventFeatureCollections.points}
      >
        <Layer {...ACTIVE_EVENT_PARKING_ORIGIN_LAYER} />
        <Layer {...ACTIVE_EVENT_ENTRANCE_DESTINATION_LAYER} />
      </Source>
    </>
  )
}
