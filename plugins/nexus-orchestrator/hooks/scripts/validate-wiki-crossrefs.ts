import { existsSync } from "node:fs";
import { basename, join, sep } from "node:path";
import { Glob } from "bun";

const workspaceRoot = process.cwd();
const memoriesRoot = join(workspaceRoot, ".memories");
const wikiRoot = join(memoriesRoot, "wiki");
const kgPath = join(memoriesRoot, "context", "knowledge-graph.index.jsonc");

const wikilinkPattern = /\[\[([^\]]+)\]\]/g;

interface ValidationResult {
	brokenLinks: { file: string; link: string }[];
	orphanPages: string[];
	missingEntities: { file: string; entity: string }[];
	missingBacklinks: { source: string; target: string }[];
	stalePages: { page: string; staleScore: number; staleDays: number }[];
}

async function extractWikilinks(content: string): Promise<string[]> {
	const links: string[] = [];
	let match: RegExpExecArray | null;
	const regex = new RegExp(wikilinkPattern);
	while ((match = regex.exec(content)) !== null) {
		links.push(match[1]);
	}
	return links;
}

async function loadKnowledgeGraph(): Promise<Set<string>> {
	const entities = new Set<string>();
	if (!existsSync(kgPath)) return entities;

	const raw = await Bun.file(kgPath).text();
	// Strip JSONC comments for parsing
	const cleaned = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
	try {
		const graph = JSON.parse(cleaned);
		if (Array.isArray(graph.entities)) {
			for (const entity of graph.entities) {
				if (entity.entityName) {
					entities.add(entity.entityName.trim().toLowerCase());
				}
			}
		}
	} catch {
		// If KG is unparseable, skip entity validation
	}
	return entities;
}

function parseFrontmatterDate(content: string, key: string): Date | null {
	const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!fmMatch) return null;
	const dateMatch = fmMatch[1].match(
		new RegExp(`${key}:\\s*'([^']+)'|${key}:\\s*"([^"]+)"|${key}:\\s*(\\S+)`),
	);
	if (!dateMatch) return null;
	const dateStr = dateMatch[1] || dateMatch[2] || dateMatch[3];
	const parsed = new Date(dateStr);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function validateWikiCrossrefs(): Promise<ValidationResult> {
	const result: ValidationResult = {
		brokenLinks: [],
		orphanPages: [],
		missingEntities: [],
		missingBacklinks: [],
		stalePages: [],
	};

	if (!existsSync(wikiRoot)) {
		return result;
	}

	const glob = new Glob("**/*.md");
	const allPages = new Set<string>();
	const inboundLinks = new Set<string>();
	const fileLinks: Map<string, string[]> = new Map();
	const pageUpdatedAt: Map<string, Date> = new Map();

	// Phase 1: Scan all wiki pages and collect wikilinks + metadata
	for await (const file of glob.scan({ cwd: wikiRoot })) {
		const normalizedPage = file.replace(/\.md$/, "").split(sep).join("/");
		allPages.add(normalizedPage);

		const fullPath = join(wikiRoot, file);
		const content = await Bun.file(fullPath).text();
		const links = await extractWikilinks(content);

		// Parse updated_at for staleness scoring
		const updatedAt = parseFrontmatterDate(content, "updated_at");
		if (updatedAt) {
			pageUpdatedAt.set(normalizedPage, updatedAt);
		}

		const resolvedLinks: string[] = [];
		for (const link of links) {
			// Normalize: remove wiki/ prefix if present, strip .md
			let normalized = link.replace(/^wiki\//, "").replace(/\.md$/, "");
			normalized = normalized.split(sep).join("/");
			resolvedLinks.push(normalized);
			inboundLinks.add(normalized);
		}

		fileLinks.set(file, resolvedLinks);
	}

	// Phase 2: Check for broken links
	for (const [file, links] of fileLinks) {
		for (const link of links) {
			if (!allPages.has(link)) {
				// Also check if the target exists as a full path in memories
				const fullTarget = join(memoriesRoot, `${link}.md`);
				if (!existsSync(fullTarget)) {
					result.brokenLinks.push({ file, link });
				}
			}
		}
	}

	// Phase 3: Find orphan pages (no inbound links) — warning only
	for (const page of allPages) {
		if (!inboundLinks.has(page)) {
			// Skip index-like pages
			const pageName = basename(page);
			if (pageName === "index" || pageName === "overview") continue;
			result.orphanPages.push(page);
		}
	}

	// Phase 4: Check frontmatter entities against knowledge graph
	const knownEntities = await loadKnowledgeGraph();
	if (knownEntities.size > 0) {
		for await (const file of glob.scan({ cwd: wikiRoot })) {
			const fullPath = join(wikiRoot, file);
			const content = await Bun.file(fullPath).text();

			// Extract entity references from frontmatter
			const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
			if (!fmMatch) continue;

			const tagMatch = fmMatch[1].match(/tags:\s*\[([^\]]*)\]/);
			if (!tagMatch) continue;

			const tags = tagMatch[1]
				.split(",")
				.map((t) => t.trim().replace(/['"]/g, "").toLowerCase())
				.filter(Boolean);

			for (const tag of tags) {
				if (
					!knownEntities.has(tag) &&
					!["source", "analysis", "unverified", "gap", "concept", "entity", "synthesis"].includes(tag)
				) {
					result.missingEntities.push({ file, entity: tag });
				}
			}
		}
	}

	// Phase 5: Bidirectionality check — if A links to B, does B link back to A?
	const reverseLinks: Map<string, Set<string>> = new Map();
	for (const [file, links] of fileLinks) {
		const sourcePage = file.replace(/\.md$/, "").split(sep).join("/");
		for (const link of links) {
			if (!reverseLinks.has(link)) {
				reverseLinks.set(link, new Set());
			}
			reverseLinks.get(link)!.add(sourcePage);
		}
	}

	for (const [file, links] of fileLinks) {
		const sourcePage = file.replace(/\.md$/, "").split(sep).join("/");
		for (const link of links) {
			if (!allPages.has(link)) continue; // Skip broken links (already reported)
			const targetLinks = fileLinks.get(`${link.split("/").join(sep)}.md`) ??
				fileLinks.get(`${link}.md`);
			if (targetLinks && !targetLinks.includes(sourcePage)) {
				// Only warn for entity/concept pages (not source/synthesis pages)
				if (
					sourcePage.startsWith("entities/") ||
					sourcePage.startsWith("concepts/")
				) {
					result.missingBacklinks.push({
						source: sourcePage,
						target: link,
					});
				}
			}
		}
	}

	// Phase 6: Staleness scoring — forward-only dependency freshness
	const now = new Date();
	for (const [file, links] of fileLinks) {
		const sourcePage = file.replace(/\.md$/, "").split(sep).join("/");
		const sourceUpdated = pageUpdatedAt.get(sourcePage);
		if (!sourceUpdated || links.length === 0) continue;

		let maxDependencyUpdate: Date | null = null;
		for (const link of links) {
			const depUpdated = pageUpdatedAt.get(link);
			if (depUpdated && (!maxDependencyUpdate || depUpdated > maxDependencyUpdate)) {
				maxDependencyUpdate = depUpdated;
			}
		}

		if (maxDependencyUpdate && maxDependencyUpdate > sourceUpdated) {
			const staleDays = Math.floor(
				(maxDependencyUpdate.getTime() - sourceUpdated.getTime()) / (1000 * 60 * 60 * 24),
			);
			if (staleDays >= 3) {
				result.stalePages.push({
					page: sourcePage,
					staleScore: maxDependencyUpdate.getTime() - sourceUpdated.getTime(),
					staleDays,
				});
			}
		}
	}

	return result;
}

try {
	const result = await validateWikiCrossrefs();
	const warnings: string[] = [];

	if (result.brokenLinks.length > 0) {
		for (const { file, link } of result.brokenLinks) {
			warnings.push(`${file}: broken wikilink [[${link}]] — target does not exist`);
		}
	}

	if (result.orphanPages.length > 0) {
		for (const page of result.orphanPages) {
			warnings.push(`wiki/${page}.md: orphan page — no inbound wikilinks found`);
		}
	}

	if (result.missingEntities.length > 0) {
		for (const { file, entity } of result.missingEntities) {
			warnings.push(
				`${file}: tag '${entity}' not found in knowledge-graph.index.jsonc`,
			);
		}
	}

	if (result.missingBacklinks.length > 0) {
		for (const { source, target } of result.missingBacklinks) {
			warnings.push(
				`wiki/${source}.md → wiki/${target}.md: missing backlink — consider adding [[${source}]] to ${target}`,
			);
		}
	}

	if (result.stalePages.length > 0) {
		// Sort by staleness descending
		result.stalePages.sort((a, b) => b.staleDays - a.staleDays);
		for (const { page, staleDays } of result.stalePages) {
			const severity = staleDays > 7 ? "🔴 stale" : "⚠️ aging";
			warnings.push(
				`wiki/${page}.md: ${severity} (${staleDays}d behind its dependencies)`,
			);
		}
	}

	if (warnings.length === 0) {
		process.exit(0);
	}

	// Warnings only — do not block
	console.warn("Wiki crossref warnings:");
	for (const warning of warnings) {
		console.warn(`  ⚠ ${warning}`);
	}

	// Exit 0 (warn, don't block) per design
	process.exit(0);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Wiki crossref validation error: ${message}`);
	// Non-blocking — exit 0
	process.exit(0);
}
