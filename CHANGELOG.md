# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

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
