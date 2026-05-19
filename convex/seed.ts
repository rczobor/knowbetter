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
        date: '2026-05-17T09:05:00.000Z',
        parkingPoint: {
          coordinates: [19.07755481215364, 47.55556597899016],
          type: 'Point',
        },
        entrancePoint: {
          coordinates: [19.07618604091242, 47.55541519515727],
          type: 'Point',
        },
        walkingTraces: {
          type: 'MultiPoint',
          coordinates: [
            [19.0773324374042, 47.55555093698071],
            [19.07701060086736, 47.55550689810065],
            [19.07667614709244, 47.5554692730947],
            [19.07639272244879, 47.55543180987305],
          ],
        },
      },
      {
        date: '2026-05-18T16:25:00.000Z',
        parkingPoint: {
          coordinates: [19.07746357764488, 47.55562406126011],
          type: 'Point',
        },
        entrancePoint: {
          coordinates: [19.07623891445162, 47.55537110285186],
          type: 'Point',
        },
        walkingTraces: {
          type: 'MultiPoint',
          coordinates: [
            [19.07726204804254, 47.55559598028914],
            [19.07694483846693, 47.55553442198225],
            [19.07661819208364, 47.55547774637008],
            [19.07637400241608, 47.55541823670746],
          ],
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
