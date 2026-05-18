import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const pointValidator = v.object({
  type: v.literal('Point'),
  coordinates: v.array(v.number()),
})

const multiPointValidator = v.object({
  type: v.literal('MultiPoint'),
  coordinates: v.array(v.array(v.number())),
})

type Point = {
  type: 'Point'
  coordinates: Array<number>
}

type MultiPoint = {
  type: 'MultiPoint'
  coordinates: Array<Array<number>>
}

export const getAddressByAddressId = query({
  args: {
    addressId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('address')
      .withIndex('by_addressId', (q) => q.eq('addressId', args.addressId))
      .unique()
  },
})

export const updateAddressByAddressId = mutation({
  args: {
    addressId: v.string(),
    parkingPoint: v.optional(pointValidator),
    entrancePoint: v.optional(pointValidator),
  },
  handler: async (ctx, args) => {
    const addressPatch: {
      parkingPoint?: Point
      entrancePoint?: Point
    } = {}

    if (args.parkingPoint !== undefined) {
      addressPatch.parkingPoint = args.parkingPoint
    }

    if (args.entrancePoint !== undefined) {
      addressPatch.entrancePoint = args.entrancePoint
    }

    const existingAddress = await ctx.db
      .query('address')
      .withIndex('by_addressId', (q) => q.eq('addressId', args.addressId))
      .unique()

    if (existingAddress) {
      await ctx.db.patch(existingAddress._id, addressPatch)

      return await ctx.db.get(existingAddress._id)
    }

    const addressId = await ctx.db.insert('address', {
      addressId: args.addressId,
      ...addressPatch,
    })

    return await ctx.db.get(addressId)
  },
})

export const addEventForAddressId = mutation({
  args: {
    addressId: v.string(),
    date: v.string(),
    parkingPoint: v.optional(pointValidator),
    entrancePoint: v.optional(pointValidator),
    walkingTraces: v.optional(multiPointValidator),
  },
  handler: async (ctx, args) => {
    const event: {
      parkingPoint?: Point
      entrancePoint?: Point
      walkingTraces?: MultiPoint
    } = {}

    if (args.parkingPoint !== undefined) {
      event.parkingPoint = args.parkingPoint
    }

    if (args.entrancePoint !== undefined) {
      event.entrancePoint = args.entrancePoint
    }

    if (args.walkingTraces !== undefined) {
      event.walkingTraces = args.walkingTraces
    }

    const eventId = await ctx.db.insert('events', {
      addressId: args.addressId,
      date: args.date,
      ...event,
    })

    return await ctx.db.get(eventId)
  },
})

export const getEventsByAddressId = query({
  args: {
    addressId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('events')
      .withIndex('by_addressId', (q) => q.eq('addressId', args.addressId))
      .collect()
  },
})

export const updateEventWalkingTraces = mutation({
  args: {
    eventId: v.id('events'),
    point: pointValidator,
  },
  handler: async (ctx, args) => {
    const existingEvent = await ctx.db.get(args.eventId)

    if (!existingEvent) {
      throw new Error('Event not found')
    }

    const existingCoordinates = existingEvent.walkingTraces?.coordinates ?? []
    const nextCoordinates = [...existingCoordinates, args.point.coordinates]

    await ctx.db.patch(args.eventId, {
      walkingTraces: {
        type: 'MultiPoint',
        coordinates: nextCoordinates,
      },
    })

    return await ctx.db.get(args.eventId)
  },
})
