---
name: project-context
description: 'Configurable project context injected into all agents. The LLM maintains this skill automatically by reading the project structure, package.json, and config files. All agents reference this instead of hardcoding project-specific details.'
user-invocable: true
metadata:
  created_at: '2026-04-13T23:00:00Z'
  updated_at: '2026-04-13T23:44:00Z'
---

# Project Context

This skill defines the shared project context consumed by every agent in the Nexus Orchestrator pipeline. Instead of hardcoding stack-specific details in each agent definition, agents reference this single source of truth.

## How to Use

### For New Projects
When installing Nexus Orchestrator on a new project, the LLM will automatically populate this file by analyzing the project structure. You can also manually edit it if needed.

### For Existing Projects
The LLM should periodically verify and update this file when:
- Dependencies change (package.json updates)
- Framework versions change
- New build/test/deploy commands are added
- Code conventions evolve

### Self-Maintenance Protocol
All agents should consult this file before any task. If an agent detects that a value here is outdated (e.g., a version bump, a new script), it should flag it for update. The historian or curator agent will update this skill accordingly.

---

## Runtime & Framework

<!-- [LLM: Update these values based on the project's package.json and tsconfig.json] -->
- **Runtime**: Bun v1.3.10 — use `bun --bun` prefix for all commands
- **Framework**: Next.js 16.1.6 with App Router, React 19, PPR enabled
- **Language**: TypeScript (strict mode)

## Authentication

<!-- [LLM: Update based on auth libraries in package.json] -->
- **Auth**: Better Auth v1.5.4 with Drizzle adapter, passkey, i18n plugins

## Database

<!-- [LLM: Update based on ORM/driver in package.json and schema location] -->
- **DB**: PostgreSQL via Drizzle ORM v0.45.1
- **Schema Location**: `database/schemas/`

## UI Stack

<!-- [LLM: Update based on UI dependencies in package.json] -->
- **Components**: shadcn v4 + Base UI
- **Styling**: Tailwind CSS v4
- **Class Merging**: `cn()` from `lib/utils` (clsx + tailwind-merge)
- **Variants**: CVA (Class Variance Authority)
- **Icons**: `@phosphor-icons/react`
- **Forms**: Zod v4 + react-hook-form

## Linting & Formatting

<!-- [LLM: Update based on linter config files and package.json scripts] -->
- **Linter**: Biome v2.4.9 (NOT ESLint/Prettier)
- **Lint Command**: `bun run lint`
- **Fix Command**: `bun run lint:fix`

## Deployment

<!-- [LLM: Update based on deployment config files and CI/CD setup] -->
- **Platform**: Vercel
- **Production**: push to `main` branch
- **Preview**: PR-based automatic deploys
- **Config**: `vercel.json` at project root
- **Observability**: @vercel/analytics, @vercel/speed-insights, @vercel/otel

## Setup Commands

<!-- [LLM: Update based on package.json scripts section] -->
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

<!-- [LLM: Update based on linter config and project conventions] -->
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

<!-- [LLM: Update based on framework docs location and version-specific patterns] -->
- **Framework Docs Location**: `.next-docs/` for Next.js 16 API specifics
- Use smoke checks as default local gate
- Reserve production builds for release/ops/deploy tracks
- Always consider App Router patterns (RSC, Server Actions, `use cache`)

## Memory Root

- **Path**: `.memories/` at project root
- **Knowledge Graph**: `.memories/context/knowledge-graph.index.jsonc`
- **Entity Registry**: `.memories/context/entity-registry.jsonc`
- **Index**: `.memories/index.md`
- **Log**: `.memories/log.md`
