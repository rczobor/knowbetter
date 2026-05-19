import { useEffect, useMemo, useState } from 'react'
import { useMap } from 'react-map-gl/mapbox'

export function useCheckMapImageLoaded(id: string | string[]) {
  const { current: mapRef } = useMap()
  const [imagesLoaded, setImagesLoaded] = useState(false)

  const idArray = useMemo(() => (Array.isArray(id) ? id : [id]), [id])

  useEffect(() => {
    if (!mapRef) return
    const checkImages = () => {
      if (idArray.every((id) => mapRef?.hasImage(id))) {
        setImagesLoaded(true)
      }
    }
    checkImages()
    mapRef.on('styledata', checkImages)
    return () => {
      mapRef.off('styledata', checkImages)
    }
  }, [idArray, mapRef])

  return imagesLoaded
}
