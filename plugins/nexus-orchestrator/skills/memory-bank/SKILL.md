---
name: memory-bank
description: 'Schema definitions and validation rules for the persistent memory system. Defines directory structure, frontmatter contracts, JSONC graph schema, entity registry format, deduplication keys, and operation modes. Agents reference this skill for structural contracts — operational procedures live in agent definitions (curator, historian).'
argument-hint: 'mode=bootstrap|retrieve|update|reconcile; task=<goal>; project=<slug optional>'
user-invocable: true
metadata:
  created_at: '2026-03-25T02:10:07.1689810Z'
  updated_at: '2026-04-14T23:10:00Z'
---

# Memory Bank — Schema & Contracts

Canonical reference for the memory system's data structures. Agents consult this skill for **what** the data looks like, not **how** to operate on it:

- **Curator** → owns wiki operations (ingest, query, lint, synthesize)
- **Historian** → owns memory persistence (sessions, plans, executions, log appends)
- **This skill** → owns schema contracts, validation rules, and operation modes

## Auditability and Time Source

- Fetch canonical UTC time from the source defined in `project-context` skill (defaults to system clock UTC).
- If the configured time source is unavailable, abort write operations and return a recoverable error.
- Every memory file name must start with the normalized prefix: `YYYY-MM-DDTHH-MM-SSZ`.
  - Normalization: `2026-03-24T22:40:05` → `2026-03-24T22-40-05Z`.

## Record Metadata Contract

All auditable markdown memory files must start with:

```yaml
---
created_at: '<canonical UTC time>'
updated_at: '<canonical UTC time>'
utc_datetime_prefix: '<YYYY-MM-DDTHH-MM-SSZ>'
---
```

- For new files: `created_at = updated_at = time`.
- For updates: preserve `created_at`, refresh `updated_at`.

## Memory Directory Structure

```
.memories/
├── raw/                    # Immutable source documents — NEVER modified
│   └── assets/             # Images and binaries from sources
├── wiki/                   # LLM-compiled knowledge (owned by curator)
│   ├── entities/           # One page per canonical entity
│   ├── concepts/           # Thematic and conceptual pages
│   ├── sources/            # Summary page for each ingested source
│   └── synthesis/          # Cross-cutting analyses, filed-back queries
├── infrastructure/         # Pipeline design records
│   └── decisions/          # ADRs about agents, hooks, conventions
├── sessions/               # Session records and timelines
├── plans/                  # Implementation plans
├── executions/             # Execution reports
├── errors/                 # Error logs
├── architecture/decisions/ # Project ADRs
├── agents/handoffs/        # Subagent handoff records
├── context/                # Knowledge graph and context files
│   ├── knowledge-graph.index.jsonc
│   └── entity-registry.jsonc
├── index.md                # Discoverable record catalog (by category)
└── log.md                  # Append-only chronological operation timeline
```

File naming: `<utc_datetime_prefix>__<intention-revealing-name>.md`

## Naming Standard

- Use intention-revealing names: `taskExecutionSummary` not `result`, `dependencyRelation` not `link`.
- Avoid ambiguous names: `data`, `info`, `temp`, `item`, `unknown`.
- Keep naming consistent across markdown records and JSONC graph fields.

## Entity Registry Schema

File: `.memories/context/entity-registry.jsonc`

```jsonc
{
  "registryGeneratedAtUtc": "2026-03-24T22:40:05Z",
  "entries": [
    {
      "canonicalName": "orchestrator",
      "aliases": ["nexus-orchestrator", "main-orchestrator"],
      "entityType": "service"
    }
  ]
}
```

Resolution rules:
- `canonicalKey = entry.canonicalName.trim().toLowerCase()`
- `aliasKey = alias.trim().toLowerCase()`
- Before adding an entity, check if its normalized name matches any canonicalKey or aliasKey.
- If matched → use the canonical name. If not → add and register.

## Knowledge Graph Schema

File: `.memories/context/knowledge-graph.index.jsonc`

```jsonc
{
  "graphGeneratedAtUtc": "2026-03-24T22:40:05Z",
  "entities": [
    {
      "entityName": "orchestrator",
      "entityType": "service",
      "observations": ["Coordinates thinker, planner, executor, historian"]
    }
  ],
  "relations": [
    {
      "sourceEntityName": "orchestrator",
      "targetEntityName": "planner",
      "relationType": "delegates_to"
    }
  ]
}
```

### Deterministic Deduplication Keys

- Entity: `entityName.trim().toLowerCase()`
- Relation: `source|relationType|target` (all trimmed, lowercased)
- Observation: `entityName|observationText` (trimmed)
- Keep first-seen on collision. Sort entities by name, relations by source→type→target, observations lexicographically.

### JSONC Validation

Required top-level keys: `graphGeneratedAtUtc`, `entities`, `relations`.
Reject records with non-meaningful names (empty, `data`, `info`, `temp`, `item`, `unknown`).
Write atomically: temp file → re-parse → replace target.

## Operation Modes

### `bootstrap`
Create missing core tree. Initialize empty `knowledge-graph.index.jsonc`. Register files in `index.md`.

### `retrieve`
Read in order: `index.md` → `context/project.md` → latest session → relevant plans/executions → knowledge graph.
Build a retrieval packet with: relevant entities/relations, top observations, prior decisions, known failure preventions.

### `update`
Persist new memory. Enforce metadata policy (immutable `created_at`, refresh `updated_at`). Apply deduplication. Update `index.md` last.

### `reconcile`
Validate consistency between records and graph. Mark stale/conflicting facts as superseded (never silently remove). Emit health summary.

## Quality Gates

Before closing any memory cycle:
- [ ] Canonical UTC time was fetched
- [ ] Every new/updated file starts with UTC prefix
- [ ] Valid `created_at` and `updated_at` in frontmatter
- [ ] Memory root isolation respected
- [ ] `index.md` reflects all new artifacts
- [ ] Observations are atomic and actionable
- [ ] Relations use directed, active-voice naming
- [ ] JSONC graph is valid with intention-revealing field names
- [ ] Deduplication executed with canonical keys and stable sorting
- [ ] Superseded facts linked, not erased
- [ ] Retrieval packet sufficient for downstream agents without hidden assumptions

## Nexus Integration

- `orchestrator`: calls `retrieve` before first planning, `update` after execution.
- `historian`: owns file persistence and index maintenance. Consult this skill for schema contracts.
- `curator`: owns wiki operations. Consult this skill for frontmatter and JSONC contracts.
- `thinker`: consumes retrieval packet to reduce ambiguity.
- `planner`: references decisions, constraints, and linked failures.
- `executor`: writes execution outcomes for subsequent memory updates.

## Output Contract

```markdown
## Memory Operation
- mode: <bootstrap|retrieve|update|reconcile>
- project: <slug>
- status: <success|partial|failed>
- memory_write_timestamp_utc: <canonical UTC>
- utc_datetime_prefix: <YYYY-MM-DDTHH-MM-SSZ>

## Retrieved or Updated Artifacts
- <path>: <why it matters>

## Graph Delta
- entities_added_count: <count>
- relations_added_count: <count>
- observations_added_count: <count>
- superseded_records_count: <count>

## Memory Health
- index_synced: <yes|no>
- consistency_warnings: <none|list>
```