# dot-agents-marketplace

Plugin marketplace repository for distributing curated agent plugins.

This repository is a marketplace catalog for GitHub Copilot CLI, Claude Code, Gemini CLI, and Qwen Code, currently distributing `nexus-orchestrator` from a local plugin source.

## Why this repository exists

Marketplaces are the discovery and installation layer for CLI plugins. Instead of sharing plugin folders manually, users add one marketplace and install plugins by name.

This repository exists to:

- Publish a plugin catalog (`marketplace.json`) that users can add directly
- Keep plugin metadata and source paths centralized
- Build target-specific artifacts for Copilot, Gemini, Claude, and Qwen from one plugin source
- Enforce validation and version consistency before release

Marketplace manifests are maintained in parallel for compatibility with all CLIs:

- `.claude-plugin/marketplace.json` (Claude Code)
- `.github/plugin/marketplace.json` (GitHub Copilot CLI)
- `.qwen-code/marketplace.json` (Qwen Code)

In short: this is the marketplace home, with reproducible multi-CLI packaging and release checks.

## How users consume this marketplace

Users add this repository as a marketplace, then install plugins from it.

GitHub Copilot CLI example:

```bash
copilot plugin marketplace add <owner>/<repo>
copilot plugin install nexus-orchestrator@dot-agents-marketplace
```

Claude Code example:

```text
/plugin marketplace add <owner>/<repo>
/plugin install nexus-orchestrator@dot-agents-marketplace
```

Qwen Code example:

```text
/extension marketplace add <owner>/<repo>
/extension install nexus-orchestrator@dot-agents-marketplace
/nexus <your task>
```

For local testing, both CLIs also support adding a local marketplace path.

## Scope

- Maintain marketplace metadata and plugin catalog
- Keep plugin sources organized under `plugins/`
- Build and validate multi-CLI distribution artifacts
- Keep Copilot, Gemini, Claude, Qwen, and marketplace versions aligned
- Keep hooks and required plugin files consistent across targets

This is not an application runtime service.

## Project structure

- `plugins/nexus-orchestrator/`: Canonical plugin source (agents, skills, commands, hooks, manifests)
- `scripts/build-multicli.ts`: Generates `dist/nexus-orchestrator-{copilot,gemini,claude}`
- `scripts/validate-multicli.ts`: Validates required files, version parity, hook commands, and skill frontmatter
- `scripts/sync-versions.ts`: Synchronizes version fields across manifests and marketplace metadata

## Commands

Install dependencies:

```bash
bun install
```

Validate all target assumptions:

```bash
bun run validate
```

Build all target artifacts:

```bash
bun run build
```

Sync versions:

```bash
bun run versions:sync
```

Check version drift (CI-safe):

```bash
bun run versions:check
```

Run full pipeline:

```bash
bun run ci
```

## Output artifacts

`bun run build` generates:

- `dist/nexus-orchestrator-copilot`
- `dist/nexus-orchestrator-gemini`
- `dist/nexus-orchestrator-claude`
- `dist/nexus-orchestrator-qwen`

Each folder can be installed in its respective CLI.
