import { existsSync } from "node:fs";
import { basename, join, sep } from "node:path";
import { Glob } from "bun";

const workspaceRoot = process.cwd();
const memoriesRoot = join(workspaceRoot, ".memories");

const requiredFrontmatterKeys = [
  "created_at",
  "updated_at",
  "utc_datetime_prefix",
];

const utcPrefixPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)__/;
const prefixEnforcedDirs = [
  "sessions",
  "plans",
  "executions",
  "errors",
  "agents",
  "architecture",
];

function requiresUtcPrefix(relativePath: string): boolean {
  const normalized = relativePath.split(sep).join("/");
  return prefixEnforcedDirs.some(
    (dir) => normalized.startsWith(`${dir}/`) && normalized.endsWith(".md"),
  );
}

async function validateMemories(): Promise<string[]> {
  if (!existsSync(memoriesRoot)) {
    return [];
  }

  const violations: string[] = [];
  const glob = new Glob("**/*.md");

  for await (const file of glob.scan({ cwd: memoriesRoot })) {
    const fullPath = join(memoriesRoot, file);
    const content = await Bun.file(fullPath).text();

    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) {
      violations.push(
        `${file}: missing YAML frontmatter block delimited by ---`,
      );
      continue;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = Bun.YAML.parse(match[1]) as Record<string, unknown>;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      violations.push(`${file}: invalid YAML frontmatter: ${message}`);
      continue;
    }

    if (!parsed || typeof parsed !== "object") {
      violations.push(`${file}: YAML frontmatter is not an object`);
      continue;
    }

    for (const key of requiredFrontmatterKeys) {
      if (!(key in parsed)) {
        violations.push(`${file}: missing required key '${key}'`);
      }
    }

    if (requiresUtcPrefix(file)) {
      const filenameStr = basename(file);
      const prefixMatch = filenameStr.match(utcPrefixPattern);

      if (!prefixMatch) {
        violations.push(
          `${file}: filename must start with UTC prefix YYYY-MM-DDTHH-MM-SSZ__`,
        );
      } else {
        const expectedPrefix = prefixMatch[1];
        if (parsed.utc_datetime_prefix !== expectedPrefix) {
          violations.push(
            `${file}: frontmatter 'utc_datetime_prefix' ('${parsed.utc_datetime_prefix}') does not match filename prefix ('${expectedPrefix}')`,
          );
        }
      }
    }
  }

  return violations;
}

try {
  const violations = await validateMemories();

  if (violations.length === 0) {
    process.exit(0);
  }

  console.error("Memory schema guard failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }

  process.exit(2);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Memory schema guard error: ${message}`);
  process.exit(2);
}
