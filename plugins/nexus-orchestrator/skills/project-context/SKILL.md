---
name: project-context
description: 'Configurable project context injected into all agents. The LLM maintains this skill automatically by reading the project structure, manifests, and config files. All agents reference this instead of hardcoding project-specific details.'
user-invocable: true
metadata:
  created_at: '2026-04-13T23:00:00Z'
  updated_at: '2026-04-14T00:38:00Z'
---

# Project Context

This skill defines the shared project context consumed by every agent in the Nexus Orchestrator pipeline. Instead of hardcoding stack-specific details in each agent definition, agents reference this single source of truth.

## How to Use

### For New Projects
When installing Nexus Orchestrator on a new project, the LLM will automatically populate this file by analyzing the project structure. You can also manually edit it if needed.

### For Existing Projects
The LLM should periodically verify and update this file when:
- Dependencies change (manifest updates)
- Framework versions change
- New build/test/deploy commands are added
- Code conventions evolve

### Self-Maintenance Protocol
All agents should consult this file before any task. If an agent detects that a value here is outdated (e.g., a version bump, a new script), it should flag it for update. The historian or curator agent will update this skill accordingly.

---

## Runtime & Framework

<!-- [LLM: Auto-detect from package.json, Cargo.toml, requirements.txt, go.mod, pom.xml, or equivalent manifest] -->
- **Runtime**: <!-- e.g. Node.js 22, Bun 1.x, Python 3.12, Go 1.22, Rust 1.78 -->
- **Framework**: <!-- e.g. Next.js 16 with App Router, Django 5.x, FastAPI 0.110, Rails 7.x -->
- **Language**: <!-- e.g. TypeScript (strict mode), Python, Go, Rust -->

## Authentication

<!-- [LLM: Auto-detect from auth libraries in manifest or auth config files] -->
- **Auth**: <!-- e.g. Better Auth, NextAuth, Passport.js, Django Auth, Clerk, etc. -->

## Database

<!-- [LLM: Auto-detect from ORM/driver in manifest and schema files] -->
- **DB**: <!-- e.g. PostgreSQL via Drizzle ORM, Prisma, SQLAlchemy, etc. -->
- **Schema Location**: <!-- e.g. database/schemas/, prisma/schema.prisma, etc. -->

## UI Stack

<!-- [LLM: Auto-detect from UI dependencies in manifest] -->
- **Components**: <!-- e.g. shadcn, Radix, Material UI, Chakra, etc. -->
- **Styling**: <!-- e.g. Tailwind CSS v4, CSS Modules, styled-components, etc. -->
- **Icons**: <!-- e.g. Lucide, Phosphor, Heroicons, etc. -->
- **Forms**: <!-- e.g. Zod + react-hook-form, Formik, etc. -->

## Linting & Formatting

<!-- [LLM: Auto-detect from linter config files (.eslintrc, biome.json, .prettierrc, etc.) and manifest scripts] -->
- **Linter**: <!-- e.g. ESLint, Biome, Ruff, Clippy, etc. -->
- **Lint Command**: <!-- e.g. npm run lint, bun run lint, cargo clippy -->
- **Fix Command**: <!-- e.g. npm run lint:fix, bun run lint:fix, ruff format . -->

## Deployment

<!-- [LLM: Auto-detect from deployment config files (vercel.json, Dockerfile, fly.toml, etc.)] -->
- **Platform**: <!-- e.g. Vercel, AWS, GCP, Fly.io, Docker, etc. -->
- **Production**: <!-- e.g. push to main, CI/CD pipeline trigger -->
- **Preview**: <!-- e.g. PR-based automatic deploys -->

## Setup Commands

<!-- [LLM: Auto-detect from manifest scripts section (package.json scripts, Makefile, etc.)] -->
| Purpose | Command |
|---|---|
| Install deps | <!-- e.g. npm install, bun install, pip install -r requirements.txt --> |
| Dev server | <!-- e.g. npm run dev, bun run dev, python manage.py runserver --> |
| Build (release only) | <!-- e.g. npm run build, bun run build, cargo build --release --> |
| Lint | <!-- e.g. npm run lint, bun run lint, ruff check . --> |
| Test | <!-- e.g. npm test, bun test, pytest --> |

## Code Style Rules

<!-- [LLM: Auto-detect from linter config, editorconfig, and project conventions] -->
- <!-- e.g. TypeScript strict mode — no any types -->
- <!-- e.g. import type {} for type-only imports -->
- <!-- e.g. Functional patterns preferred -->

## Framework-Specific Notes

<!-- [LLM: Auto-detect from framework docs location and version-specific patterns] -->
- **Framework Docs Location**: <!-- e.g. .next-docs/, docs/, etc. -->
- <!-- e.g. Use smoke checks as default local gate -->
- <!-- e.g. Reserve production builds for release/ops/deploy tracks -->

## Time Source

<!-- Configurable canonical UTC source for auditable timestamps -->
- **Canonical Time Source**: System clock UTC
- **Fallback**: If configured source fails, abort auditable writes and return recoverable error
- **Override**: Set a custom URL or API endpoint for canonical time if needed

## Project-Specific MCP Servers

<!-- [LLM: Add project-specific MCP servers below as they are configured] -->
<!-- Example:
- `better-auth/*` — Auth operations
- `shadcn/*` — Component scaffolding
- `vercel/*` — Deployment management
-->

## Project-Specific Tools

<!-- [LLM: Add project-specific tools for agent use below] -->
<!-- These tools should be added to agent frontmatter `tools:` lists when working on this project -->
<!-- Example:
- `docfork/*` — Documentation forking
- `gitkraken/*` — Git visual management
-->

## Memory Root

- **Path**: `.memories/` at project root
- **Knowledge Graph**: `.memories/context/knowledge-graph.index.jsonc`
- **Entity Registry**: `.memories/context/entity-registry.jsonc`
- **Index**: `.memories/index.md`
- **Log**: `.memories/log.md`
