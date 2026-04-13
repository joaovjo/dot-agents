---
name: project-context
description: 'Configurable project context injected into all agents. Edit this skill to match your project stack, commands, and code style conventions. All agents reference this instead of hardcoding project-specific details.'
user-invocable: true
metadata:
  created_at: '2026-04-13T23:00:00Z'
  updated_at: '2026-04-13T23:00:00Z'
---

# Project Context

This skill defines the shared project context consumed by every agent in the Nexus Orchestrator pipeline. Instead of hardcoding stack-specific details in each agent definition, agents reference this single source of truth.

## How to Use

When installing Nexus Orchestrator on a new project, **edit only this file** to match your stack. All agents will automatically use the updated context.

Agents should read this skill before starting work and use the values here for all project-specific decisions (runtime commands, code style, deployment targets, etc.).

---

## Runtime & Framework

- **Runtime**: Bun v1.3.10 — use `bun --bun` prefix for all commands
- **Framework**: Next.js 16.1.6 with App Router, React 19, PPR enabled
- **Language**: TypeScript (strict mode)

## Authentication

- **Auth**: Better Auth v1.5.4 with Drizzle adapter, passkey, i18n plugins

## Database

- **DB**: PostgreSQL via Drizzle ORM v0.45.1
- **Schema Location**: `database/schemas/`

## UI Stack

- **Components**: shadcn v4 + Base UI
- **Styling**: Tailwind CSS v4
- **Class Merging**: `cn()` from `lib/utils` (clsx + tailwind-merge)
- **Variants**: CVA (Class Variance Authority)
- **Icons**: `@phosphor-icons/react`
- **Forms**: Zod v4 + react-hook-form

## Linting & Formatting

- **Linter**: Biome v2.4.9 (NOT ESLint/Prettier)
- **Lint Command**: `bun run lint`
- **Fix Command**: `bun run lint:fix`

## Deployment

- **Platform**: Vercel
- **Production**: push to `main` branch
- **Preview**: PR-based automatic deploys
- **Config**: `vercel.json` at project root
- **Observability**: @vercel/analytics, @vercel/speed-insights, @vercel/otel

## Setup Commands

| Purpose | Command |
|---|---|
| Install deps | `bun install` |
| Dev server | `bun run dev` |
| Local smoke gate | `bun run dev` (start, readiness, HTTP request, teardown) |
| Build (release only) | `bun run build` |
| Lint | `bun run lint` |
| Fix lint | `bun run lint:fix` |
| DB generate | `bun run db:generate` |
| DB migrate | `bun run db:migrate` |
| DB seed | `bun run db:seed` |

## Code Style Rules

- TypeScript strict mode — no `any` types
- Biome for linting/formatting (NOT ESLint/Prettier)
- `import type {}` for type-only imports
- Functional patterns preferred
- React Server Components by default; `'use client'` only when hooks/interactivity required
- Use `cn()` from `lib/utils` for class merging
- Validate forms with Zod v4 + react-hook-form
- Use `@phosphor-icons/react` for icons
- Wrap dynamic data in `<Suspense>` for PPR compatibility

## Framework-Specific Notes

- Reference `.next-docs/` for Next.js 16 API specifics
- Use `bun run dev` smoke checks as default local gate
- Reserve `bun run build` for release/ops/deploy tracks
- Always consider App Router patterns (RSC, Server Actions, `use cache`)

## Memory Root

- **Path**: `.memories/` at project root
- **Knowledge Graph**: `.memories/context/knowledge-graph.index.jsonc`
- **Index**: `.memories/index.md`
- **Log**: `.memories/log.md`
