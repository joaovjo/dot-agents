# Nexus Orchestrator

Canonical schema and context for this extension lives in `AGENTS.md`.

Use these files as primary references:
- `AGENTS.md` for workflow, structure, and cross-CLI mapping.
- `agents/` for agent definitions.
- `skills/project-context/SKILL.md` for project-specific runtime metadata.
- `plugin.json` for canonical extension metadata and shared policy.

## Safety Defaults

- Never perform destructive git operations unless explicitly requested.
- Prefer reversible changes and incremental validation.
- Preserve auditability on memory writes.
