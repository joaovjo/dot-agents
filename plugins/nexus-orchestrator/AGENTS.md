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

## Workflow

```
User Request
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
[5] REMEMBER → Persist to memory bank
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
