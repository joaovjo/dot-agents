#!/usr/bin/env bun

import { $ } from "bun";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type PluginManifest = {
    name: string;
    version: string;
};

type MarketplaceManifest = {
    metadata?: { version?: string };
    plugins?: Array<{ name: string; version?: string }>;
};

const rootDir = process.cwd();
const pluginDir = `${rootDir}/plugins/nexus-orchestrator`;
const files = {
    copilotPlugin: `${pluginDir}/.plugin/plugin.json`,
    claudePlugin: `${pluginDir}/.claude-plugin/plugin.json`,
    geminiExtension: `${pluginDir}/gemini-extension.json`,
    qwenManifest: `${pluginDir}/.qwen-code/manifest.json`,
    claudeMarketplace: `${rootDir}/.claude-plugin/marketplace.json`,
    copilotMarketplace: `${rootDir}/.github/plugin/marketplace.json`,
    qwenMarketplace: `${rootDir}/.qwen-code/marketplace.json`
};

const checkOnly = process.argv.includes("--check");

function parentDir(filePath: string): string {
    const normalizedPath = filePath.replaceAll("\\", "/");
    const lastSlashIndex = normalizedPath.lastIndexOf("/");
    return lastSlashIndex > 0 ? normalizedPath.slice(0, lastSlashIndex) : ".";
}

async function readJson<T>(filePath: string): Promise<T> {
    return (await Bun.file(filePath).json()) as T;
}

async function writeJson(filePath: string, data: JsonObject): Promise<void> {
    await $`mkdir -p ${parentDir(filePath)}`;
    await Bun.write(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function getVersionFromTagArg(): string | null {
    const tagIndex = process.argv.findIndex((arg) => arg === "--tag");
    if (tagIndex === -1 || tagIndex + 1 >= process.argv.length) {
        return null;
    }

    const rawTag = process.argv[tagIndex + 1].trim();
    return rawTag.startsWith("v") ? rawTag.slice(1) : rawTag;
}

function synchronizeMarketplace(
    marketplace: MarketplaceManifest & JsonObject,
    pluginName: string,
    targetVersion: string,
    updates: string[],
    label: string
): void {
    if (marketplace.metadata?.version !== targetVersion) {
        updates.push(`${label} metadata version ${marketplace.metadata?.version} -> ${targetVersion}`);
        marketplace.metadata = marketplace.metadata || {};
        marketplace.metadata.version = targetVersion;
    }

    if (Array.isArray(marketplace.plugins)) {
        const plugin = marketplace.plugins.find((entry) => entry.name === pluginName);
        if (plugin && plugin.version !== targetVersion) {
            updates.push(`${label} plugin version ${plugin.version} -> ${targetVersion}`);
            plugin.version = targetVersion;
        }
    }
}

async function run(): Promise<void> {
    const copilotManifest = await readJson<PluginManifest & JsonObject>(files.copilotPlugin);
    const targetVersion = getVersionFromTagArg() || copilotManifest.version;

    const claudeManifest = await readJson<PluginManifest & JsonObject>(files.claudePlugin);
    const geminiManifest = await readJson<PluginManifest & JsonObject>(files.geminiExtension);
    const qwenManifest = await readJson<PluginManifest & JsonObject>(files.qwenManifest);
    const claudeMarketplace = await readJson<MarketplaceManifest & JsonObject>(files.claudeMarketplace);
    const copilotMarketplace = await readJson<MarketplaceManifest & JsonObject>(files.copilotMarketplace);
    const qwenMarketplace = await readJson<MarketplaceManifest & JsonObject>(files.qwenMarketplace);

    const updates: string[] = [];

    if (copilotManifest.version !== targetVersion) {
        updates.push(`copilot version ${copilotManifest.version} -> ${targetVersion}`);
        copilotManifest.version = targetVersion;
    }

    if (claudeManifest.version !== targetVersion) {
        updates.push(`claude version ${claudeManifest.version} -> ${targetVersion}`);
        claudeManifest.version = targetVersion;
    }

    if (geminiManifest.version !== targetVersion) {
        updates.push(`gemini version ${geminiManifest.version} -> ${targetVersion}`);
        geminiManifest.version = targetVersion;
    }

    if (qwenManifest.version !== targetVersion) {
        updates.push(`qwen version ${qwenManifest.version} -> ${targetVersion}`);
        qwenManifest.version = targetVersion;
    }

    synchronizeMarketplace(claudeMarketplace, copilotManifest.name, targetVersion, updates, "claude marketplace");
    synchronizeMarketplace(copilotMarketplace, copilotManifest.name, targetVersion, updates, "copilot marketplace");
    synchronizeMarketplace(qwenMarketplace, copilotManifest.name, targetVersion, updates, "qwen marketplace");

    if (checkOnly) {
        if (updates.length > 0) {
            process.stderr.write(`Version drift detected:\n- ${updates.join("\n- ")}\n`);
            process.exit(1);
        }

        process.stdout.write(`All manifests are synchronized at version ${targetVersion}.\n`);
        process.exit(0);
    }

    await writeJson(files.copilotPlugin, copilotManifest);
    await writeJson(files.claudePlugin, claudeManifest);
    await writeJson(files.geminiExtension, geminiManifest);
    await writeJson(files.qwenManifest, qwenManifest);
    await writeJson(files.claudeMarketplace, claudeMarketplace);
    await writeJson(files.copilotMarketplace, copilotMarketplace);
    await writeJson(files.qwenMarketplace, qwenMarketplace);

    process.stdout.write(`Synchronized versions to ${targetVersion}.\n`);
}

run().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
});
