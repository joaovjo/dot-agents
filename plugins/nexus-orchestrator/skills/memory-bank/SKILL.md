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
- Before any memory write (`bootstrap`, `update`, `reconcile`), fetch canonical UTC time from the source defined in the `project-context` skill (defaults to system clock UTC).
- Treat the fetched time as the canonical write timestamp.
- If the configured time source is unavailable, abort write operations and return a recoverable error. Do not generate local fallback timestamps for auditable records.
- Every memory file name must start with the normalized prefix derived from the captured time.
- Normalization rule: convert `2026-03-24T22:40:05` to `2026-03-24T22-40-05Z`.
- Every markdown memory file must include `created_at` and `updated_at` in YAML frontmatter.
- For new files: set `created_at = updated_at = time`.
- For updates: preserve original `created_at` and set `updated_at = time`.

## Record Metadata Contract
All auditable markdown memory files must start with:

```yaml
---
created_at: '<canonical UTC time>'
updated_at: '<canonical UTC time>'
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
This skill uses four complementary layers:

### 1. Raw Sources (immutable source of truth)
- Directory: `.memories/raw/`
- Curated source documents: articles, papers, specs, transcripts, images.
- The LLM reads from them but NEVER modifies them.
- Assets (images, binaries): `.memories/raw/assets/`
- File naming: `<utc_datetime_prefix>__<descriptive-name>.<ext>`

### 2. The Wiki (LLM-compiled knowledge)
- Directory: `.memories/wiki/`
- LLM-generated markdown pages: summaries, entity pages, concept pages, comparisons, synthesis.
- The LLM (via curator agent) owns this layer entirely — creates, updates, cross-references.
- Subdirectories:
  - `entities/` — One page per canonical entity
  - `concepts/` — Thematic and conceptual pages
  - `sources/` — Summary page for each ingested source
  - `synthesis/` — Cross-cutting analyses, filed-back queries

### 3. Operational Memory (workflow records)
- Directory: `.memories/` (root level subdirectories)
- Primary records: sessions, plans, executions, errors, architecture decisions, and context.
- Index: `.memories/index.md` must always reflect discoverable records.
- Log: `.memories/log.md` for chronological operation timeline.
- File naming format: `<utc_datetime_prefix>__<intention-revealing-name>.md`.

### 4. Infrastructure Layer (pipeline design records)
- Directory: `.memories/infrastructure/`
- Design records for agents, hooks, rules, and conventions themselves.
- ADRs about the pipeline (not the project): `.memories/infrastructure/decisions/`
- Schema rationale and evolution history.

### 5. Entity Registry (canonical name resolution)
- File: `.memories/context/entity-registry.jsonc`
- Canonical entity names with aliases to prevent duplicate entities.
- The registry is maintained by the historian and curator agents.
- All agents should check the registry before creating new KG entities.

Suggested JSONC structure:

```jsonc
{
  // Canonical UTC time from project-context skill
  "registryGeneratedAtUtc": "2026-03-24T22:40:05Z",
  "entries": [
    {
      "canonicalName": "orchestrator",
      "aliases": ["nexus-orchestrator", "main-orchestrator", "orch"],
      "entityType": "service"
    },
    {
      "canonicalName": "curator",
      "aliases": ["wiki-curator", "knowledge-curator"],
      "entityType": "service"
    }
  ]
}
```

Resolution rules:
- `canonicalKey = entry.canonicalName.trim().toLowerCase()`
- `aliasKey = alias.trim().toLowerCase()`
- Before adding an entity to the KG, check if its normalized name matches any canonicalKey or aliasKey.
- If matched, use the canonical name. If not matched, add the entity and register it.

2. Knowledge Graph Index (retrieval accelerator)
- Entity: named object (`person`, `service`, `feature`, `incident`, etc.).
- Relation: directed link in active voice (`depends_on`, `blocked_by`, `supersedes`, etc.).
- Observation: atomic fact attached to one entity.

If graph artifacts do not exist yet, create and maintain:
- `.memories/context/knowledge-graph.index.jsonc`

Suggested JSONC structure:

```jsonc
{
  // Canonical UTC time from project-context skill
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
- For write-capable modes (`bootstrap`, `update`, `reconcile`), fetch canonical UTC time from the source defined in the `project-context` skill.
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

## Log File (`.memories/log.md`)

Append-only chronological record of all operations. Each entry uses a parseable prefix:

```markdown
## [2026-04-13T22:40:05Z] ingest | Karpathy LLM Wiki Article
- source: raw/2026-04-13T22-40-05Z__karpathy-llm-wiki.md
- pages_touched: 12
- entities_created: 3
- agent: curator

## [2026-04-13T23:10:00Z] query | "How does the ingest pattern work?"
- result_page: wiki/synthesis/ingest-pattern-overview.md
- filed_back: true
- agent: curator

## [2026-04-13T23:30:00Z] lint | Health Check Pass
- orphan_pages: 2
- stale_pages: 1
- contradictions: 0
- agent: curator

## [2026-04-14T01:00:00Z] execution | Feature X implementation
- plan: plans/2026-04-14T01-00-00Z__feature-x-plan.md
- status: success
- agent: executor
```

The log is parseable with `grep "^## \[" log.md | tail -5`.
The historian and curator MUST append to this log after every operation.

## Claim Type Annotations

Every wiki page claim must be annotated with its provenance type using callouts:

```markdown
> [!SOURCE] **Verbatim or close paraphrase from a source**
> Citation: path to raw source or wiki source page

> [!ANALYSIS] **Inference derived from sourced facts**
> Reasoning: explain how this was derived

> [!UNVERIFIED] **Plausible claim without authoritative source**
> Confidence: HIGH / MEDIUM / LOW

> [!GAP] **Explicitly missing information — never fill with guesses**
```

The `[!ANALYSIS]` / `[!UNVERIFIED]` split prevents paraphrasing-bias: when the model rewrites what a source says, the provenance type makes it traceable whether the rewrite is faithful.

## Staleness Scoring

During `reconcile`, compute staleness for each wiki page:

1. For each outgoing `[[wikilink]]` dependency, check its `updated_at`.
2. `staleScore = max(updated_at of outgoing dependencies) - updated_at of this page`
3. Forward-only — no backlink tracking needed for scoring.
4. Thresholds:
   - `staleScore < 3 days`: fresh ✅
   - `staleScore 3-7 days`: aging ⚠️
   - `staleScore > 7 days`: stale 🔴
5. Update `stale_score` in wiki page frontmatter.
6. Surface worst offenders in the reconcile health summary.

## Improved Index Format (`.memories/index.md`)

The index must be organized by category with one-line summaries:

```markdown
# Wiki Index

## Entities
- [[wiki/entities/orchestrator]] — Pure delegation router for the workflow (5 sources)
- [[wiki/entities/curator]] — Wiki maintainer with ingest/query/lint ops (2 sources)

## Concepts
- [[wiki/concepts/ingest-pattern]] — How raw sources become compiled wiki (2 sources)
- [[wiki/concepts/staleness-scoring]] — Mechanical freshness tracking (1 source)

## Sources
- [[wiki/sources/karpathy-llm-wiki]] — LLM Wiki pattern for personal knowledge bases (2026-04-13)

## Synthesis
- [[wiki/synthesis/wiki-vs-rag]] — Comparison of compiled wiki vs. RAG approaches

## Sessions
- [[sessions/2026-04-13T22-40-05Z__session-overview]] — Initial wiki setup session

## Plans
- [[plans/2026-04-13T22-40-05Z__feature-x-plan]] — Feature X implementation plan

## Executions
- [[executions/2026-04-13T22-40-05Z__feature-x-execution]] — Feature X execution report

## Architecture Decisions
- [[architecture/decisions/2026-04-13T22-40-05Z__adr-001]] — ADR title
```

The curator and historian share responsibility for keeping this index current.

## Decision Points and Branching
- If task scope is narrow and known: run targeted `retrieve` (`open_nodes` equivalent).
- If task scope is broad or ambiguous: run full `read_graph` + contextual file scan.
- If contradictory memory is found: branch into `reconcile` before planning.
- If execution fails repeatedly: persist failure pattern first, then re-plan.

## Quality Gates
Before closing any memory cycle, confirm:
- `canonical time` was fetched from the source defined in the `project-context` skill for this write cycle.
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
- memory_write_timestamp_utc: <canonical UTC time from project-context skill>
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