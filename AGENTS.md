<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

# Project instructions

This is a TanStack Start app with a Convex backend. Use Bun for package
management and scripts.

## Commands

- Install dependencies with `bun install`.
- Run project scripts with `bun --bun run <script>`, for example
  `bun --bun run dev`, `bun --bun run test`, `bun --bun run lint`, and
  `bun --bun run build`.
- Before starting `bun dev` or `bun --bun run dev`, check whether the dev
  server is already running on the local device. Do not start a second local
  dev server for this app; multiple local TanStack Start dev processes can
  fight over route generation and cause infinite rerenders.
- Run one-off CLIs with `bunx --bun`, for example
  `bunx --bun convex dev`, `bunx --bun convex codegen`, and
  `bunx --bun shadcn@latest add button`.
- Do not use `npm`, `pnpm`, or `npx` commands unless there is no Bun-compatible
  path for the tool.

## TanStack Start

- Routes live in `src/routes`; keep file-based routing conventions intact.
- Do not edit `src/routeTree.gen.ts` by hand. Let the TanStack router tooling
  regenerate it.
- This project uses Vite/Nitro via `vite.config.ts`. Keep Start configuration in
  Vite-era APIs; do not add legacy Vinxi or `@tanstack/start` patterns.

## Convex

- Before editing any Convex code, read `convex/_generated/ai/guidelines.md`.
- Convex generated files under `convex/_generated` should be updated with Convex
  tooling, not manual edits.
- Use `bunx --bun convex ai-files install` to refresh Convex AI guidance and
  skills when needed.

## Environment

- Client-exposed environment variables must use the `VITE_` prefix.
- Keep `.env.example` and `src/env.ts` in sync when adding or renaming
  environment variables.
