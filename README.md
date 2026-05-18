# Knowbetter

Knowbetter is a hackathon project for improving last-meter delivery accuracy.

Couriers often receive inaccurate or incomplete location data for an address.
The street address may be technically correct, but it does not tell them where
to park, which entrance to use, or how previous couriers actually reached the
door. Knowbetter lets couriers correct that missing delivery context when they
arrive.

## What It Solves

For many deliveries, the hardest part is not reaching the street address. It is
finding the practical delivery route:

- Where can the courier park?
- Which entrance should they use?
- How should they walk from the parking spot to the entrance?
- How has this address been delivered to before?

Knowbetter turns each delivery into useful operational knowledge for the next
courier.

## Core Idea

When a courier arrives at an address, they can update the delivery location
details from the map:

- Save or correct the parking location.
- Save or correct the entrance location.
- Keep a history of where each courier parked.
- Log the walking trace from parking to entrance.
- Review delivery history for a specific address over time.

This creates a living address record. Instead of every courier rediscovering the
same information, the app keeps a history of real delivery attempts and uses it
to make future deliveries faster and more accurate.

## Example Flow

1. A courier opens a delivery address in the app.
2. The map shows known parking and entrance points for that address.
3. When the courier arrives, they save their current parking location.
4. If the suggested point is wrong, they adjust it on the map.
5. The courier continues to the entrance while the app can store the walking
   trace.
6. Future couriers can see the accumulated delivery history for that address.

## Tech Stack

- [TanStack Start](https://tanstack.com/start) for the application framework.
- [TanStack Router](https://tanstack.com/router) for file-based routing.
- [Convex](https://convex.dev) for realtime backend data.
- [Mapbox](https://www.mapbox.com/) for map rendering.
- [React](https://react.dev/) for the UI.
- [Tailwind CSS](https://tailwindcss.com/) for styling.
- [Vitest](https://vitest.dev/) for tests.
- [Bun](https://bun.sh/) for package management and scripts.

## Data Model

The Convex backend stores two main concepts:

- `address`: the latest known delivery context for an address, including
  parking and entrance points.
- `events`: the delivery history for an address, including courier parking
  points, entrance points, timestamps, and walking traces.

This lets the app show both the current best-known delivery information and the
historical record of how couriers delivered to the same address over time.

## Getting Started

Install dependencies:

```bash
bun install
```

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env.local
```

Required environment variables:

```bash
CONVEX_DEPLOYMENT=
VITE_CONVEX_URL=
VITE_MAPBOX_ACCESS_TOKEN=
```

Start the Convex backend:

```bash
bunx --bun convex dev
```

Start the app:

```bash
bun --bun run dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
bun --bun run dev
bun --bun run build
bun --bun run start
bun --bun run test
bun --bun run lint
bun --bun run format
bun --bun run check
```

## Project Structure

- `src/routes`: TanStack Router routes and route-local helpers.
- `src/components`: Shared UI components.
- `src/integrations`: Convex and TanStack Query providers.
- `convex`: Convex schema, queries, and mutations.
- `convex/_generated`: Convex generated files.

Do not edit `src/routeTree.gen.ts` or files under `convex/_generated` by hand.
Regenerate them through the project tooling.
