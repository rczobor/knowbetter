import { useEffect, useState } from 'react'

export type UserLocation = {
  longitude: number
  latitude: number
}

export function useUserLocation(): UserLocation | null {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return
    }

    let active = true

    navigator.geolocation.getCurrentPosition((position) => {
      const { longitude, latitude } = position.coords

      if (
        !active ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
      ) {
        return
      }

      setUserLocation({ longitude, latitude })
    })

    return () => {
      active = false
    }
  }, [])

  return userLocation
}
