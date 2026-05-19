import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { AddressListPanel } from './-address-list-panel'

export const Route = createFileRoute('/operation/')({ component: Operation })

function Operation() {
  const addresses = useQuery(api.address.listAddresses, {})

  return (
    <AddressListPanel
      addresses={addresses}
      addressTo="/operation/address/$addressId"
    />
  )
}
