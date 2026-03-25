# tool-guardian

Guardrail hook built with Bun + TypeScript to detect high-risk destructive command patterns.

## Install

```bash
bun install
```

## Run

```bash
echo '{"command":"git reset --hard"}' | bun run guard-tool.ts
```

## Modes

Default mode is `warn`.

```bash
echo '{"command":"git reset --hard"}' | bun run guard-tool.ts
```

Block mode exits with code `2` on suspicious payloads.

```bash
GUARD_MODE=block echo '{"command":"git reset --hard"}' | bun run guard-tool.ts
```

## Type Check

```bash
bun run check
```
