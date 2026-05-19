import { useEffect, useState } from 'react'

export type UserLocation = {
  longitude: number
  latitude: number
}

export type UserLocationStatus =
  | 'loading'
  | 'available'
  | 'error'
  | 'unsupported'

export type UserLocationState = {
  status: UserLocationStatus
  location: UserLocation | null
  errorMessage?: string
}

export function useUserLocation(): UserLocationState {
  const [userLocationState, setUserLocationState] = useState<UserLocationState>(
    {
      status: 'loading',
      location: null,
    },
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setUserLocationState({
        status: 'unsupported',
        location: null,
        errorMessage: 'Location is not available in this browser.',
      })
      return
    }

    let active = true

    function updateCurrentPosition() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords

          if (
            !active ||
            !Number.isFinite(longitude) ||
            !Number.isFinite(latitude)
          ) {
            return
          }

          setUserLocationState({
            status: 'available',
            location: { longitude, latitude },
          })
        },
        (error) => {
          if (!active) {
            return
          }

          setUserLocationState({
            status: 'error',
            location: null,
            errorMessage: error.message,
          })
        },
      )
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        updateCurrentPosition()
      }
    }

    updateCurrentPosition()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return userLocationState
}
