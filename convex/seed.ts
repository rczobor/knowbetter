import { mutation } from './_generated/server'

type Point = {
  type: 'Point'
  coordinates: Array<number>
}

type MultiPoint = {
  type: 'MultiPoint'
  coordinates: Array<Array<number>>
}

type SeedAddress = {
  addressId: string
  parkingPoint: Point
  entrancePoint: Point
  events: Array<{
    date: string
    parkingPoint: Point
    entrancePoint: Point
    walkingTraces: MultiPoint
  }>
}

const seedAddresses: Array<SeedAddress> = [
  {
    addressId: 'my_house2',
    entrancePoint: {
      coordinates: [19.076139540833008, 47.55537243989521],
      type: 'Point',
    },
    parkingPoint: {
      coordinates: [19.07813891845683, 47.555167883222765],
      type: 'Point',
    },
    events: [
      {
        date: '2026-05-17T08:15:00.000Z',
        parkingPoint: {
          coordinates: [19.07809463399649, 47.55519712268567],
          type: 'Point',
        },
        entrancePoint: {
          coordinates: [19.07616548379023, 47.55535268814388],
          type: 'Point',
        },
        walkingTraces: {
          type: 'MultiPoint',
          coordinates: [
            [19.07787984311573, 47.55520432171175],
            [19.07739214331862, 47.55525299810259],
            [19.07687802042105, 47.55531209674356],
            [19.07639722757043, 47.55535410841227],
          ],
        },
      },
      {
        date: '2026-05-18T14:40:00.000Z',
        parkingPoint: {
          coordinates: [19.07821077682695, 47.55513128954822],
          type: 'Point',
        },
        entrancePoint: {
          coordinates: [19.07611659428302, 47.55539467196216],
          type: 'Point',
        },
        walkingTraces: {
          type: 'MultiPoint',
          coordinates: [
            [19.0780011124068, 47.55516662090208],
            [19.07748327136511, 47.55521944273824],
            [19.07694133539091, 47.55529121160185],
            [19.0764328768401, 47.5553604779382],
          ],
        },
      },
    ],
  },
  {
    addressId: 'my_house',
    entrancePoint: {
      coordinates: [19.076212445611553, 47.55539479625918],
      type: 'Point',
    },
    parkingPoint: {
      coordinates: [19.077512084359313, 47.55559171479811],
      type: 'Point',
    },
    events: [
      {
        date: '2026-05-17T09:00:29',
        entrancePoint: {
          type: 'Point',
          coordinates: [19.0781635, 47.5525282],
        },
        parkingPoint: { coordinates: [19.0776055, 47.552705], type: 'Point' },
        walkingTraces: {
          coordinates: [
            [19.0776608, 47.5527356],
            [19.0779074, 47.552739],
            [19.078066, 47.5527016],
            [19.0781692, 47.5526711],
            [19.078149, 47.5525624],
            [19.0781465, 47.5525624],
          ],
          type: 'MultiPoint',
        },
      },
      {
        date: '2026-05-16T09:00:29',
        entrancePoint: {
          type: 'Point',
          coordinates: [19.0781274, 47.5525184],
        },
        parkingPoint: { coordinates: [19.0776822, 47.5528319], type: 'Point' },
        walkingTraces: {
          coordinates: [
            [19.0776759, 47.5527866],
            [19.0778898, 47.5527237],
            [19.0780635, 47.5526864],
            [19.0781465, 47.5526677],
            [19.0781314, 47.5525862],
          ],
          type: 'MultiPoint',
        },
      },
      {
        date: '2026-05-15T09:00:29',
        entrancePoint: {
          type: 'Point',
          coordinates: [19.0781242, 47.5524729],
        },
        parkingPoint: { coordinates: [19.077689, 47.552825], type: 'Point' },
        walkingTraces: {
          coordinates: [
            [19.077673, 47.5527764],
            [19.077753, 47.5527202],
            [19.0778762, 47.5527073],
            [19.0779322, 47.552595],
            [19.0780186, 47.5525485],
            [19.0780746, 47.5525345],
            [19.0781387, 47.552528],
            [19.0781403, 47.5525032],
          ],
          type: 'MultiPoint',
        },
      },
    ],
  },
]

export const defaults = mutation({
  args: {},
  handler: async (ctx) => {
    let addressCount = 0
    let insertedEventCount = 0
    let updatedEventCount = 0

    for (const seedAddress of seedAddresses) {
      const existingAddress = await ctx.db
        .query('address')
        .withIndex('by_addressId', (q) =>
          q.eq('addressId', seedAddress.addressId),
        )
        .unique()

      if (existingAddress) {
        await ctx.db.patch(existingAddress._id, {
          parkingPoint: seedAddress.parkingPoint,
          entrancePoint: seedAddress.entrancePoint,
        })
      } else {
        await ctx.db.insert('address', {
          addressId: seedAddress.addressId,
          parkingPoint: seedAddress.parkingPoint,
          entrancePoint: seedAddress.entrancePoint,
        })
      }

      addressCount += 1

      const existingEvents = await ctx.db
        .query('events')
        .withIndex('by_addressId', (q) =>
          q.eq('addressId', seedAddress.addressId),
        )
        .collect()

      for (const seedEvent of seedAddress.events) {
        const existingEvent = existingEvents.find(
          (event) => event.date === seedEvent.date,
        )

        if (existingEvent) {
          await ctx.db.patch(existingEvent._id, {
            parkingPoint: seedEvent.parkingPoint,
            entrancePoint: seedEvent.entrancePoint,
            walkingTraces: seedEvent.walkingTraces,
          })
          updatedEventCount += 1
          continue
        }

        await ctx.db.insert('events', {
          addressId: seedAddress.addressId,
          date: seedEvent.date,
          parkingPoint: seedEvent.parkingPoint,
          entrancePoint: seedEvent.entrancePoint,
          walkingTraces: seedEvent.walkingTraces,
        })
        insertedEventCount += 1
      }
    }

    return {
      addresses: addressCount,
      eventsInserted: insertedEventCount,
      eventsUpdated: updatedEventCount,
    }
  },
})
