import { Link } from '@tanstack/react-router'
import { ChevronRight, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Doc } from '../../convex/_generated/dataModel'
import { Badge } from '../components/ui/badge'

type HomeAddress = Doc<'address'>

export function AddressListPanel({
  addresses,
  addressTo,
  onHeightChange,
  onHoverAddress,
}: {
  addresses: Array<HomeAddress> | undefined
  addressTo: '/address/$addressId' | '/operation/address/$addressId'
  onHeightChange?: (height: number) => void
  onHoverAddress?: (addressId: string | null) => void
}) {
  const [panelElement, setPanelElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!onHeightChange) return
    if (!panelElement) {
      onHeightChange(0)
      return
    }

    const updateHeight = () => {
      onHeightChange(Math.ceil(panelElement.getBoundingClientRect().height))
    }

    updateHeight()

    if (typeof ResizeObserver === 'undefined') return

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(panelElement)
    return () => resizeObserver.disconnect()
  }, [onHeightChange, panelElement])

  return (
    <section
      ref={setPanelElement}
      className="max-w-3xl md:w-lg md:left-1/2 md:-translate-x-1/2 safe-bottom-panel absolute inset-x-3 z-30 max-h-[min(20rem,45dvh)] overflow-hidden rounded-lg border border-white/40 bg-white/95 shadow-xl shadow-black/15 backdrop-blur-md"
      aria-label="Available addresses"
    >
      <div className="border-b border-zinc-200/80 px-4 py-3">
        <h1 className="text-sm font-semibold text-zinc-950">
          Available addresses
        </h1>
      </div>
      <div className="max-h-[calc(min(20rem,45dvh)-3rem)] overflow-y-auto">
        {addresses === undefined ? (
          <p className="px-4 py-5 text-sm text-zinc-500">
            Loading addresses...
          </p>
        ) : addresses.length === 0 ? (
          <p className="px-4 py-5 text-sm text-zinc-500">No addresses yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200/80">
            {addresses.map((address) => (
              <li
                key={address._id}
                onMouseEnter={() => onHoverAddress?.(address.addressId)}
                onMouseLeave={() => onHoverAddress?.(null)}
              >
                <Link
                  to={addressTo}
                  params={{ addressId: address.addressId }}
                  className="flex min-h-16 items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-100/80 focus-visible:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-950">
                      {address.addressId}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {address.parkingPoint ? (
                        <Badge variant="secondary">Parking</Badge>
                      ) : null}
                      {address.entrancePoint ? (
                        <Badge variant="outline">Entrance</Badge>
                      ) : null}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-zinc-400"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
