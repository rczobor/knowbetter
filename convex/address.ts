import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const pointValidator = v.object({
  type: v.literal('Point'),
  coordinates: v.array(v.number()),
})

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
    const existingAddress = await ctx.db
      .query('address')
      .withIndex('by_addressId', (q) => q.eq('addressId', args.addressId))
      .unique()

    if (existingAddress) {
      await ctx.db.patch(existingAddress._id, {
        parkingPoint: args.parkingPoint,
        entrancePoint: args.entrancePoint,
      })

      return await ctx.db.get(existingAddress._id)
    }

    const addressId = await ctx.db.insert('address', {
      addressId: args.addressId,
      parkingPoint: args.parkingPoint,
      entrancePoint: args.entrancePoint,
    })

    return await ctx.db.get(addressId)
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