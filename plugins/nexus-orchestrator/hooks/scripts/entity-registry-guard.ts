import { existsSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();
const memoriesRoot = join(workspaceRoot, ".memories");
const kgPath = join(memoriesRoot, "context", "knowledge-graph.index.jsonc");
const registryPath = join(
	memoriesRoot,
	"context",
	"entity-registry.jsonc",
);

interface RegistryEntry {
	canonicalName: string;
	aliases: string[];
	entityType: string;
}

interface EntityRegistry {
	registryGeneratedAtUtc: string;
	entries: RegistryEntry[];
}

interface KGEntity {
	entityName: string;
	entityType: string;
	observations?: string[];
}

interface KnowledgeGraph {
	graphGeneratedAtUtc: string;
	entities: KGEntity[];
	relations: unknown[];
}

function stripJsoncComments(raw: string): string {
	return raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function normalizeKey(name: string): string {
	return name.trim().toLowerCase().replace(/[\s_-]+/g, "-");
}

function levenshtein(a: string, b: string): number {
	const matrix: number[][] = [];
	for (let i = 0; i <= a.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= b.length; j++) {
		matrix[0][j] = j;
	}
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,
				matrix[i][j - 1] + 1,
				matrix[i - 1][j - 1] + cost,
			);
		}
	}
	return matrix[a.length][b.length];
}

function isSimilar(a: string, b: string, threshold = 2): boolean {
	const na = normalizeKey(a);
	const nb = normalizeKey(b);
	if (na === nb) return true;
	if (na.includes(nb) || nb.includes(na)) return true;
	return levenshtein(na, nb) <= threshold;
}

async function loadRegistry(): Promise<EntityRegistry | null> {
	if (!existsSync(registryPath)) return null;
	const raw = await Bun.file(registryPath).text();
	try {
		return JSON.parse(stripJsoncComments(raw)) as EntityRegistry;
	} catch {
		return null;
	}
}

async function loadKnowledgeGraph(): Promise<KnowledgeGraph | null> {
	if (!existsSync(kgPath)) return null;
	const raw = await Bun.file(kgPath).text();
	try {
		return JSON.parse(stripJsoncComments(raw)) as KnowledgeGraph;
	} catch {
		return null;
	}
}

async function validateEntityRegistry(): Promise<string[]> {
	const warnings: string[] = [];
	const kg = await loadKnowledgeGraph();
	if (!kg || !Array.isArray(kg.entities)) return warnings;

	const registry = await loadRegistry();

	// Check for near-duplicate entities within the KG itself
	const seen: Map<string, string> = new Map();
	for (const entity of kg.entities) {
		const key = normalizeKey(entity.entityName);
		const existing = seen.get(key);
		if (existing && existing !== entity.entityName) {
			warnings.push(
				`Near-duplicate entity: '${entity.entityName}' matches existing '${existing}' (normalized: '${key}')`,
			);
		}
		seen.set(key, entity.entityName);
	}

	// Cross-check for fuzzy similarity
	const entityNames = kg.entities.map((e) => e.entityName);
	for (let i = 0; i < entityNames.length; i++) {
		for (let j = i + 1; j < entityNames.length; j++) {
			const a = entityNames[i];
			const b = entityNames[j];
			if (normalizeKey(a) !== normalizeKey(b) && isSimilar(a, b)) {
				warnings.push(
					`Potentially duplicate entities: '${a}' and '${b}' are very similar — consider merging or adding aliases`,
				);
			}
		}
	}

	// Validate against registry if it exists
	if (registry?.entries) {
		const registeredCanonicals = new Set(
			registry.entries.map((e) => normalizeKey(e.canonicalName)),
		);
		const registeredAliases = new Map<string, string>();
		for (const entry of registry.entries) {
			for (const alias of entry.aliases) {
				registeredAliases.set(normalizeKey(alias), entry.canonicalName);
			}
		}

		for (const entity of kg.entities) {
			const key = normalizeKey(entity.entityName);
			const aliasTarget = registeredAliases.get(key);
			if (aliasTarget && key !== normalizeKey(aliasTarget)) {
				warnings.push(
					`Entity '${entity.entityName}' is a known alias for '${aliasTarget}' — use the canonical name in the KG`,
				);
			}
		}

		// Check for KG entities not in registry
		for (const entity of kg.entities) {
			const key = normalizeKey(entity.entityName);
			if (
				!registeredCanonicals.has(key) &&
				!registeredAliases.has(key)
			) {
				warnings.push(
					`Entity '${entity.entityName}' exists in KG but not in entity-registry.jsonc — consider registering it`,
				);
			}
		}
	}

	return warnings;
}

try {
	const warnings = await validateEntityRegistry();

	if (warnings.length === 0) {
		process.exit(0);
	}

	console.warn("Entity registry guard warnings:");
	for (const warning of warnings) {
		console.warn(`  ⚠ ${warning}`);
	}

	// Warn, don't block
	process.exit(0);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Entity registry guard error: ${message}`);
	process.exit(0);
}
