# Nexus Orchestrator

See `AGENTS.md` for workflow overview and agent index.
See `agents/` for individual agent definitions.
See `skills/project-context/SKILL.md` for project-specific configuration.

## Safety Defaults

- Never perform destructive git operations unless explicitly requested.
- Prefer reversible changes and incremental validation.
- Preserve auditability on memory writes.
