import { useEffect } from 'react'
import { useMap } from 'react-map-gl/mapbox'

export default function MapImages() {
  useLoadMapImage('arrowheads', '/img/arrow-head.svg')
  return null
}

function useLoadMapImage(
  id: string,
  src: string,
  { width, height } = { width: 20, height: 20 },
) {
  const { current: mapRef } = useMap()

  useEffect(() => {
    if (!mapRef) return

    const callback = () => {
      const img = new Image(width, height)
      if (mapRef.hasImage(id)) return
      img.onload = () => mapRef.addImage(id, img, { sdf: true })
      img.src = src
    }
    if (mapRef.loaded()) {
      callback()
    } else {
      mapRef.on('load', callback)
    }

    return () => {
      mapRef.off('load', callback)
    }
  }, [height, id, mapRef, src, width])
}
