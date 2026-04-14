# Nexus Orchestrator

Agentic workflow for orchestrated software delivery with persistent LLM Wiki knowledge base, entity registry, and structural invariant enforcement.

Flow: Think → Plan → Execute → Validate → Curate → Remember.

## Entry Point

All tasks are initiated via **`/orchestrator`** — the single user-facing command that routes to the appropriate subagent(s). No other commands are needed.

## Architecture

Nexus Orchestrator implements the **LLM Wiki** pattern (inspired by [Karpathy's article](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)):

### Memory Layers
1. **Raw Sources** (`.memories/raw/`) — Immutable source documents. Never modified by the LLM.
2. **Wiki** (`.memories/wiki/`) — LLM-compiled knowledge: entity pages, concept pages, source summaries, cross-cutting synthesis.
3. **Operational Memory** (`.memories/`) — Session records, plans, executions, errors, architecture decisions.
4. **Infrastructure** (`.memories/infrastructure/`) — Design records for the pipeline itself (agent changes, hook config, schema evolution).
5. **Entity Registry** (`.memories/context/entity-registry.jsonc`) — Canonical entity names with aliases to prevent duplicate entities.

### Schema Contracts

The `memory-bank` skill is the single source of truth for data structures:
- Frontmatter contracts
- JSONC graph schema and dedup keys
- Entity registry resolution rules
- Directory structure and naming conventions

Agents reference `memory-bank` for contracts — operational procedures live in agent definitions (curator, historian).

### Structural Invariants (enforced by hooks)
- **Frontmatter validation**: All `.memories/` markdown files require `created_at`, `updated_at`, and `utc_datetime_prefix`.
- **Wiki cross-references**: Bidirectionality checks, broken link detection, orphan page detection, staleness scoring.
- **Entity registry guard**: Near-duplicate detection via Levenshtein distance and alias matching.
- **Raw immutability guard**: Detects and warns about writes to `.memories/raw/`.
- **Log format enforcement**: Verifies `log.md` entries use the parseable `## [UTC] operation | title` format.

Hooks use **matchers** to fire only on file-write tool calls, reducing noise during read-only operations.

### Claim Provenance
Every wiki page claim uses provenance annotations:
- `[!SOURCE]` — Verbatim or close paraphrase from a source
- `[!ANALYSIS]` — Inference derived from sourced facts
- `[!UNVERIFIED]` — Plausible claim without authoritative source
- `[!GAP]` — Explicitly missing information

### Scale-Aware Retrieval
The curator uses adaptive retrieval based on wiki size:
- Small (< 50 pages): full index scan
- Medium (50-200): heading + one-liner scan, drill into top 3-5
- Large (200+): MCP search tool or grep, then drill

### Filed-Back Queries
Valuable query results are automatically filed back into the wiki as synthesis pages, ensuring knowledge compounds over time.

## Agents

| Agent | Role |
|---|---|
| **orchestrator** | Pure delegation router — never implements |
| **thinker** | Task decomposition with wiki-first protocol |
| **planner** | Execution-ready implementation plans |
| **executor** | Full implementation with verification |
| **executor-local** | Code-only local changes |
| **executor-ops** | Release and CI/CD operations |
| **reviewer** | Evidence-based technical review |
| **historian** | Memory persistence with entity registry |
| **docs** | Technical documentation |
| **deploy** | Deployment preparation and validation |
| **curator** | Wiki maintenance: ingest, query, lint, synthesize |

## Platform Support

- GitHub Copilot CLI plugin
- Gemini CLI extension
- Claude Code plugin
- Qwen Code integration

## Single Source Of Truth

To avoid duplication across model ecosystems, this plugin uses:

1. `plugin.json` at the plugin root as canonical shared manifest metadata.
2. Platform manifest files as adapters, kept in sync via `bun run versions:sync`.
3. `AGENTS.md` as the canonical cross-model schema/context file.
4. `settings.json` ships default settings (e.g., default agent = orchestrator).
5. `memory-bank` skill as the canonical schema reference for memory data structures.

## Local Validation and Build

From repository root:

```bash
bun run ci
```

This checks version alignment, validates structure, and builds dist artifacts for all platforms.

## Dist Artifacts

The build creates:

- `dist/nexus-orchestrator-copilot`
- `dist/nexus-orchestrator-gemini`
- `dist/nexus-orchestrator-claude`

## Install: GitHub Copilot CLI

Install from local folder:

```bash
copilot plugin install ./dist/nexus-orchestrator-copilot
```

## Install: Gemini CLI

```bash
gemini extensions install ./dist/nexus-orchestrator-gemini --consent --skip-settings
```

## Install: Claude Code

For local development session:

```bash
claude --plugin-dir ./dist/nexus-orchestrator-claude
```

## Hooks

### PostToolUse Chain (file-write tools only)
1. `validate-memories-frontmatter.ts` — Frontmatter schema validation
2. `validate-wiki-crossrefs.ts` — Broken links, orphans, backlinks, staleness scoring
3. `entity-registry-guard.ts` — Near-duplicate entity detection
4. `raw-immutability-guard.ts` — Raw source write detection
5. `validate-log-format.ts` — Log format enforcement

### PreToolUse Chain (file-write tools only)
1. `raw-immutability-guard.ts` — Catches raw writes before they happen

All hooks use **matchers** and are **warn-only** (exit code 0) — they never block operations.

## Versioning

Version source of truth:

- `plugins/nexus-orchestrator/plugin.json`

Sync all target manifests and marketplace metadata:

```bash
bun run versions:sync
```

Check version alignment in CI:

```bash
bun run versions:check
```
