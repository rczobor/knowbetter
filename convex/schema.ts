import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  events: defineTable({
    addressId: v.string(),
    date: v.string(),
    parkingPoint: v.object({
      type: v.literal('Point'),
      coordinates: v.array(v.number()),
    }),
    walkingTraces: v.object({
      type: v.literal('MultiPoint'),
      coordinates: v.array(v.array(v.number())),
    }),
  }).index('by_addressId', ['addressId']),

  address: defineTable({
    addressId: v.string(),
    parkingPoint: v.optional(
      v.object({
        type: v.literal('Point'),
        coordinates: v.array(v.number()),
      }),
    ),
    entrancePoint: v.optional(
      v.object({
        type: v.literal('Point'),
        coordinates: v.array(v.number()),
      }),
    ),
  }).index('by_addressId', ['addressId']),
})
