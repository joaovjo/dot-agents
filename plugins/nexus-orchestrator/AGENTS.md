# 🤖 The Autonomous Development Team

See `agents/` for individual agent definitions. This file provides a quick reference index.

## Agent Index

| Agent | Role | Invocation |
|---|---|---|
| **orchestrator** | Pure delegation router — routes tasks to subagents, never implements directly | @orchestrator |
| **thinker** | Decomposes complex problems into subtasks, maps dependencies, surfaces risks | @thinker |
| **planner** | Converts requirements into execution-ready implementation plans | @planner |
| **executor** | Executes approved plan segments with verification and evidence | @executor |
| **executor-local** | Code-only local changes within the repository | @executor-local |
| **executor-ops** | Release and CI/CD operations | @executor-ops |
| **reviewer** | Evidence-based technical audit before merge | @reviewer |
| **docs** | Technical documentation, ADRs, runbooks, migration guides | @docs |
| **deploy** | Deployment preparation, validation, and rollback guidance | @deploy |
| **historian** | Persists structured records to `.memories/` with UTC-auditable filenames | @historian |
| **curator** | Wiki maintenance — ingest, query, lint, synthesize knowledge | @curator |

## Entry Point

The **orchestrator** is the single user-facing entry point. All tasks are initiated via `/orchestrator` and routed to the appropriate subagent(s). No other commands are needed — the orchestrator detects intent and delegates automatically.

## Workflow

```
User Request → /orchestrator
    │
    ▼
[1] THINK   → Decompose task into subtasks
    │
    ▼
[2] PLAN    → Create structured implementation plan
    │
    ▼
[3] EXECUTE → Implement each plan segment
    │
    ▼
[4] VALIDATE → Review outcomes, re-delegate if needed
    │
    ▼
[5] CURATE  → File reusable knowledge into wiki
    │
    ▼
[6] REMEMBER → Persist to memory bank
    │
    ▼
Response to user
```

## Shared Conventions

- **Memory root**: `.memories/` at project root
- **Knowledge graph**: `.memories/context/knowledge-graph.index.jsonc`
- **Entity registry**: `.memories/context/entity-registry.jsonc`
- **Time source**: System clock UTC (configurable in `project-context` skill)
- **Filename prefix**: `YYYY-MM-DDTHH-MM-SSZ__`
- **Frontmatter**: All memory files require `created_at` and `updated_at`
- **Log**: Append parseable entry to `.memories/log.md` after every write
- **Wiki immutability**: `.memories/raw/` is immutable — never modify source files
- **Provenance**: Annotate claims with type (Source, Analysis, Unverified, Gap)
- **Schema contracts**: `memory-bank` skill is the single source of truth for data structures

## Cross-CLI Capability Map

Some ecosystems expose equivalent capabilities with different names. This map prevents duplicated implementation logic — implement once in the canonical location, create adapters for other platforms.

| Capability | Claude Code | VS Code Copilot | Gemini CLI | Qwen Code |
|---|---|---|---|---|
| **Agent definitions** | `agents/*.md` | `agents/*.md` | `agents/*.md` (subagents) | `agents/*.md` |
| **Skills / workflows** | `skills/*/SKILL.md` | `skills/*/SKILL.md` | `skills/*/SKILL.md` | `skills/*/SKILL.md` |
| **Slash commands** | `commands/*.md` | `commands/*.md` | `commands/*.md` | `commands/*.md` |
| **Lifecycle hooks** | `hooks/hooks.json` | `hooks.json` | `hooks/hooks.json` | hooks via extension config |
| **Context bootstrap** | `CLAUDE.md` | Plugin instructions | `GEMINI.md` / `contextFileName` | `QWEN.md` / `contextFileName` |
| **MCP servers** | `.mcp.json` | `.mcp.json` / `.vscode/mcp.json` | `mcpServers` in extension JSON | `mcpServers` in manifest |
| **LSP servers** | `.lsp.json` | Built-in (VS Code) | — | — |
| **Default settings** | `settings.json` | — | `settings` in extension JSON | — |
| **Plugin manifest** | `.claude-plugin/plugin.json` | `.plugin/plugin.json` | `gemini-extension.json` | `.qwen-code/manifest.json` |
| **Marketplace catalog** | `.claude-plugin/marketplace.json` | `.plugin/marketplace.json` | Gemini extensions registry | `.qwen-code/marketplace.json` |
| **Event channels** | `channels/` (MCP-based push) | — | — | Channels (plugins) |
| **Scheduled tasks** | `scheduled-tasks` config | — | — | `scheduled-tasks` config |
| **Executables / bin** | `bin/` (added to PATH) | — | — | — |
| **Agent teams** | `agent-teams` (multi-agent) | — | — | — |
| **Tool restrictions** | `excludeTools` in manifest | — | Policy engine | — |

> **Reuse principle**: When two platforms offer the same functionality with different names (e.g., "channels" in Claude/Qwen = external event push), implement once in the canonical plugin structure and create platform adapters that reference the canonical source. Never duplicate operational logic across platform-specific files.

## Canonical Policy

- `plugin.json` at plugin root is the single source of truth for shared metadata.
- Platform-specific manifests are adapters that should be kept in sync (via `bun run versions:sync`).
- `AGENTS.md` is the canonical schema/context document for all model families.
- `memory-bank` skill is the canonical schema reference for memory data structures.
- Each agent references `project-context` skill for runtime-specific details — never hardcode.
