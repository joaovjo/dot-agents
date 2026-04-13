---
name: memory-bank
description: 'Apply MCP-style persistent memory in orchestrator by combining a project-scoped file memory bank with an entity-relation-observation index. Use this skill to bootstrap memory, retrieve relevant context before planning, and persist validated learnings after execution with strict project isolation.'
argument-hint: 'mode=bootstrap|retrieve|update|reconcile; task=<goal>; project=<slug optional>'
user-invocable: true
metadata:
  created_at: '2026-03-25T02:10:07.1689810Z'
  updated_at: '2026-03-25T02:11:33.0763890Z'
---

# Memory Bank for Orchestrator

Use this skill to apply the same core concept from MCP memory servers inside the workflow:
- Persistent memory across sessions.
- Structured retrieval before reasoning and planning.
- Structured updates after execution.
- Project-isolated memory operations.

## Auditability and Time Source
- Before any memory write (`bootstrap`, `update`, `reconcile`), query `https://www.horariodebrasilia.org/`.
- Parse the current BRT time from the response and treat it as the canonical write timestamp.
- If the URL is temporarily unavailable, abort write operations and return a recoverable error. Do not generate local fallback timestamps for auditable records.
- Every memory file name must start with the normalized prefix derived from the captured time.
- Normalization rule: convert `2026-03-24T22:40:05` to `2026-03-24T22-40-05Z`.
- Every markdown memory file must include `created_at` and `updated_at` in YAML frontmatter.
- For new files: set `created_at = updated_at = time`.
- For updates: preserve original `created_at` and set `updated_at = time`.

## Record Metadata Contract
All auditable markdown memory files must start with:

```yaml
---
created_at: '<time from horariodebrasilia>'
updated_at: '<time from horariodebrasilia>'
utc_datetime_prefix: '<YYYY-MM-DDTHH-MM-SSZ>'
---
```

## Naming Standard (Meaningful Names)
- Use intention-revealing names for files, entities, relations, observations, keys, and helper functions.
- Avoid ambiguous names such as `data`, `info`, `temp`, or `item` when a specific name is available.
- Prefer domain names that communicate purpose, for example:
  - `taskExecutionSummary` instead of `result`
  - `dependencyRelation` instead of `link`
  - `memoryWriteTimestampUtc` instead of `timestamp`
- Keep naming consistent across markdown records and JSONC graph fields.

## When to Use
- Before planning a non-trivial task that depends on prior context.
- After execution to persist decisions, outcomes, and new patterns.
- During failure recovery to reuse known resolutions.
- When the user asks to initialize or update project memory.

## Expected Inputs
- `mode`: `bootstrap`, `retrieve`, `update`, or `reconcile`.
- `task`: objective being solved now.
- `project` (optional): project slug for scoped memory access.
- `constraints` (optional): policy, time, tool, or architecture constraints.

## Memory Model
This skill uses two complementary layers:

1. File Memory Bank (source of truth)
- Directory root: `.memories/`.
- Primary records: sessions, plans, executions, errors, architecture decisions, and context.
- Index: `.memories/index.md` must always reflect discoverable records.
- File naming format: `<utc_datetime_prefix>__<intention-revealing-name>.md`.

2. Knowledge Graph Index (retrieval accelerator)
- Entity: named object (`person`, `service`, `feature`, `incident`, etc.).
- Relation: directed link in active voice (`depends_on`, `blocked_by`, `supersedes`, etc.).
- Observation: atomic fact attached to one entity.

If graph artifacts do not exist yet, create and maintain:
- `.memories/context/knowledge-graph.index.jsonc`

Suggested JSONC structure:

```jsonc
{
  // Canonical time value from horariodebrasilia.org
  "graphGeneratedAtUtc": "2026-03-24T22:40:05-03:00",
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

## Operation Map (MCP Concept -> Nexus Action)
- `create_entities` -> Add canonical entities in `knowledge-graph.index.jsonc`.
- `create_relations` -> Add directed relations in `knowledge-graph.index.jsonc`.
- `add_observations` -> Append atomic observations inside each entity in `knowledge-graph.index.jsonc`.
- `search_nodes` -> Search entity names, relation types, and observation content before planning.
- `open_nodes` -> Expand specific entities and directly connected relations.
- `read_graph` -> Read full graph snapshot for broad context tasks.
- `delete_*` -> Prefer deprecating with status/supersedes notes instead of hard deletion.

## Deterministic JSONC Validation and Deduplication
Apply this sequence before writing `knowledge-graph.index.jsonc`:

1. Parse and validate JSONC
- Accept comments and trailing commas in input JSONC.
- Reject invalid structure when required keys are missing:
  - `graphGeneratedAtUtc`
  - `entities`
  - `relations`
- Reject records with non-meaningful names (empty or placeholder values such as
  `data`, `info`, `temp`, `item`, `unknown`).

2. Normalize records into canonical keys
- `canonicalEntityKey = entityName.trim().toLowerCase()`
- `canonicalRelationKey = sourceEntityName.trim().toLowerCase() + "|" + relationType.trim().toLowerCase() + "|" + targetEntityName.trim().toLowerCase()`
- `canonicalObservationKey = entityName.trim().toLowerCase() + "|" + observationText.trim()`

3. Deduplicate deterministically
- Keep first-seen entity per `canonicalEntityKey`.
- Keep first-seen relation per `canonicalRelationKey`.
- Keep first-seen observation per `canonicalObservationKey`.
- Track counts in deterministic counters:
  - `entitiesAddedCount`
  - `relationsAddedCount`
  - `observationsAddedCount`
  - `supersededRecordsCount`

4. Sort output for stable diffs
- Sort `entities` by `entityName` ascending.
- Sort `relations` by `sourceEntityName`, then `relationType`, then `targetEntityName`.
- Sort `observations` lexicographically inside each entity.

5. Write atomically
- Write to temporary file first.
- Re-parse written JSONC for integrity check.
- Replace target file only after successful validation.

Example validation result contract:

```markdown
## JsoncValidationResult
- jsoncSchemaValid: <true|false>
- invalidRecordReasons: <none|list>

## DeduplicationResult
- entitiesAddedCount: <count>
- relationsAddedCount: <count>
- observationsAddedCount: <count>
- supersededRecordsCount: <count>
```

## Procedure
1. Pre-flight Validation
- Resolve effective memory root (default: `.memories/`).
- Ensure operations stay inside memory root; reject path traversal patterns.
- Ensure core files exist: `index.md`, `context/project.md`.
- For write-capable modes (`bootstrap`, `update`, `reconcile`), query `https://www.horariodebrasilia.org/` and capture canonical time.
- For write-capable modes (`bootstrap`, `update`, `reconcile`), derive `utcDateTimePrefix` using the normalization rule and cache it for the current write batch.
- If missing, create minimum structure before continuing.

2. Mode: `bootstrap`
- Create missing core tree used by Historian.
- Create `knowledge-graph.index.jsonc` with empty `entities` and `relations` arrays.
- Register all newly created files in `index.md`.
- Record initialization event in session timeline.

3. Mode: `retrieve`
- Read in this order:
  1) `index.md`
  2) `context/project.md`
  3) Latest `sessions/*__session-overview.md` and `sessions/*__session-timeline.md`
  4) Relevant `plans/`, `executions/`, `errors/`, `architecture/decisions/`
  5) `knowledge-graph.index.jsonc`
- Build a retrieval packet containing:
  - Relevant entities and relations.
  - Top observations tied to the current task.
  - Reusable prior decisions and known failure preventions.

4. Mode: `update`
- Persist new memory from current work:
  - Session deltas and execution outcomes.
  - New decisions and rationale.
  - New entities, relations, and atomic observations.
- For markdown files, enforce metadata policy:
  - Keep `created_at` immutable.
  - Refresh `updated_at` from current write-cycle canonical time.
  - Keep `utc_datetime_prefix` aligned with filename prefix.
- Apply deduplication rules:
  - Entity names are unique.
  - Duplicate relations are skipped.
  - Repeated observations are collapsed.
- Update `index.md` last.

File naming examples for auditable records:
- `2026-03-24T22-40-05Z__session-summary.md`
- `2026-03-24T22-40-05Z__feature-x-plan.md`
- `2026-03-24T22-40-05Z__auth-login-failure.md`

5. Mode: `reconcile`
- Validate consistency between event records and graph entries.
- Mark stale or conflicting facts as superseded, never silently remove history.
- Ensure unresolved issues in `errors/` are linked to active plans when applicable.
- Emit a concise "memory health" summary for the Orchestrator.

## Decision Points and Branching
- If task scope is narrow and known: run targeted `retrieve` (`open_nodes` equivalent).
- If task scope is broad or ambiguous: run full `read_graph` + contextual file scan.
- If contradictory memory is found: branch into `reconcile` before planning.
- If execution fails repeatedly: persist failure pattern first, then re-plan.

## Quality Gates
Before closing any memory cycle, confirm:
- `canonical time` was fetched from `https://www.horariodebrasilia.org/` for this write cycle.
- Every new/updated file starts with the UTC prefix.
- Every markdown memory file contains valid `created_at` and `updated_at` metadata.
- Memory root isolation was respected.
- `index.md` reflects all new artifacts.
- New observations are atomic and actionable.
- Relations use directed, active-voice naming.
- JSONC graph is valid and uses intention-revealing field names.
- Deduplication was executed using canonical keys and stable sorting.
- Superseded facts are linked, not erased.
- Retrieval packet is sufficient for Planner and Executor without hidden assumptions.

## Nexus Integration
- `orchestrator`: call this skill in `retrieve` before first planning and `update` after execution.
- `historian`: owns file persistence and index maintenance.
- `thinker`: consumes retrieval packet to reduce ambiguity.
- `planner`: references decisions, constraints, and linked failures.
- `executor`: writes execution outcomes for subsequent memory updates.

## Output Contract
Return this structure to the caller:

```markdown
## Memory Operation
- mode: <bootstrap|retrieve|update|reconcile>
- project: <slug>
- status: <success|partial|failed>
- memory_write_timestamp_utc: <canonical time from horariodebrasilia>
- utc_datetime_prefix: <YYYY-MM-DDTHH-MM-SSZ>
- created_at: <set when file is created>
- updated_at: <refreshed on every write>

## Retrieved or Updated Artifacts
- <path>: <why it matters>

## Graph Delta
- entities_added_count: <count>
- relations_added_count: <count>
- observations_added_count: <count>
- superseded_records_count: <count>

## Planning-Relevant Context
- constraints: <list>
- prior_decisions: <list>
- known_failures_and_preventions: <list>

## Memory Health
- index_synced: <yes|no>
- consistency_warnings: <none|list>
```