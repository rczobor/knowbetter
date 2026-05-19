import { useCheckMapImageLoaded } from '@/hooks/use-check-map-image-loaded'
import { Layer } from 'react-map-gl/mapbox'

type Props = {
  id: string
  color?: string
  hidden?: boolean
  source?: string
}

const RouteArrowHeadLayer = ({ id, color, source, hidden = false }: Props) => {
  const iconImageLoaded = useCheckMapImageLoaded(['arrowheads'])

  if (!iconImageLoaded) return null

  return (
    <Layer
      id={`${id}-arrows`}
      source={source}
      type={'symbol'}
      layout={{
        'symbol-placement': 'line',
        // 'symbol-spacing': [
        //   'interpolate',
        //   ['linear'],
        //   ['zoom'],
        //   6,
        //   80,
        //   12,
        //   100,
        //   16,
        //   140,
        // ],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-image': 'arrowheads',
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          6,
          0.6,
          12,
          0.9,
          16,
          1.15,
        ],
        visibility: hidden ? 'none' : 'visible',
      }}
      paint={{
        'icon-halo-color': '#FFFFFF',
        'icon-halo-width': 3,
        'icon-color': color ?? ['get', 'color'],
      }}
      beforeId={id}
    />
  )
}

export default RouteArrowHeadLayer
