# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [1.3.0] - 2026-04-14

### Changed
- **memory-bank SKILL.md**: Rewritten as schema-only reference (428 → ~160 lines). Removed duplicated content that belongs to curator (claim types, staleness scoring, index format) and historian (persistence procedures). Agents now reference this skill for contracts.
- **curator.md**: Added Schema Reference section, Scale-Aware Retrieval Strategy (small/medium/large wiki), Context Budget Discipline improvements, and Optional CLI Tooling section.
- **historian.md**: Added Schema Reference section pointing to memory-bank for contracts.
- **thinker.md**: Added Schema Reference section for wiki-related decomposition tasks.
- **AGENTS.md**: Expanded Cross-CLI Capability Map from 7 to 15 capabilities (added LSP, settings, channels, scheduled tasks, bin, agent teams, tool restrictions). Added Entry Point section, CURATE workflow step, reuse principle note, and canonical policy section.
- **hooks.json**: Added matchers to all hooks — they now fire only on file-write tool calls instead of every tool call.
- **README.md**: Updated to reflect all v1.3.0 changes.

### Added
- `settings.json`: Ships default agent = orchestrator for Claude Code.

### Removed
- Eliminated `hooks/memory-schema-guard.json` (duplicate of hooks.json).
- Removed duplicated wiki procedures from memory-bank SKILL.md (canonical owners: curator + historian).


## [1.0.0] - 2026-03-25

### Added
- Multi-CLI manifest support for Copilot CLI, Gemini CLI, and Claude Code.
- Platform adapter hooks for Gemini and Claude.
- Shared Node-based tool guardian hook command.
- Build, validation, and version-sync scripts.
- CI workflow for multi-platform validation and artifact build.
- Release workflow for packaging and publishing target artifacts.
- Cross-platform installation and maintenance documentation.

### Changed
- Corrected marketplace source path for nexus-orchestrator.
- Switched Copilot hook command from Bun to Node for portability.
