# Nexus Orchestrator for Qwen Code

Multi-agent workflow for orchestrated software delivery with persistent LLM Wiki knowledge base, entity registry, and structural invariant enforcement.

## Installation

Add the marketplace:

```
/extension marketplace add joaovjo/dot-agents
```

Install the extension:

```
/extension install nexus-orchestrator@dot-agents-marketplace
```

## Usage

Use the `/nexus` command to start an orchestrated workflow:

```
/nexus <your task>
```

## Architecture

Canonical schema and context for this extension lives in `AGENTS.md`.

Use these files as primary references:
- `AGENTS.md` for workflow overview, conventions, and cross-CLI feature mapping.
- `agents/` for individual agent definitions with YAML frontmatter.
- `skills/` for modular capabilities (memory-bank, project-context, sequential-thinking).
- `hooks.json` for event-driven validation hooks.

The extension metadata is centralized in `plugin.json` at the plugin root.

## License

MIT
