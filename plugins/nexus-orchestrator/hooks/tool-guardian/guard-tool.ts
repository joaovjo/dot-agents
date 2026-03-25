#!/usr/bin/env bun

/**
 * Tool Guardian
 *
 * Reads hook payload from stdin and warns or blocks when suspicious destructive
 * patterns are detected.
 *
 * Modes:
 * - warn  (default): prints warning and allows execution
 * - block: exits non-zero to block execution
 */

type GuardMode = "warn" | "block";

const mode: GuardMode =
  process.env.GUARD_MODE?.toLowerCase() === "block" ? "block" : "warn";

type Rule = {
  label: string;
  regex: RegExp;
};

const patterns: Rule[] = [
  { label: "filesystem wipe", regex: /\brm\s+-rf\s+\/?\b/i },
  { label: "windows delete wildcard", regex: /\b(del|erase)\b[^\n]*\*\b/i },
  { label: "git hard reset", regex: /\bgit\s+reset\s+--hard\b/i },
  { label: "git checkout discard", regex: /\bgit\s+checkout\s+--\b/i },
  { label: "database drop", regex: /\b(drop\s+database|drop\s+table)\b/i },
  { label: "chmod broad", regex: /\bchmod\s+-R\s+777\b/i }
];

async function readStdin(): Promise<string> {
  return await new Response(Bun.stdin.stream()).text();
}

const payload = await readStdin();
const hit = patterns.find((pattern) => pattern.regex.test(payload));

if (!hit) {
  process.exit(0);
}

const message = `[tool-guardian] Suspicious command pattern detected: ${hit?.label ?? "unknown"}.`;

if (mode === "block") {
  process.stderr.write(`${message} Execution blocked.\n`);
  process.exit(2);
}

process.stderr.write(`${message} Execution allowed in warn mode.\n`);
process.exit(0);
