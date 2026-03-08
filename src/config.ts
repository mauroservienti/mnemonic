import fs from "fs/promises";
import path from "path";

import type { ProjectMemoryPolicy } from "./project-memory-policy.js";

export interface MnemonicConfig {
  schemaVersion: string;
  reindexEmbedConcurrency: number;
  projectMemoryPolicies: Record<string, ProjectMemoryPolicy>;
}

const defaultConfig: MnemonicConfig = {
  schemaVersion: "1.0",
  reindexEmbedConcurrency: 4,
  projectMemoryPolicies: {},
};

function normalizeSchemaVersion(value: unknown): string {
  if (typeof value !== "string") {
    return defaultConfig.schemaVersion;
  }

  const trimmed = value.trim();
  return /^\d+(\.\d+)*$/.test(trimmed) ? trimmed : defaultConfig.schemaVersion;
}

function normalizeConcurrency(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultConfig.reindexEmbedConcurrency;
  }

  return Math.min(16, Math.max(1, Math.floor(value)));
}

/**
 * Read the schema version from a vault's config.json.
 * Works for both main vault and project vaults.
 * Returns the default schema version if no config exists.
 */
export async function readVaultSchemaVersion(vaultPath: string): Promise<string> {
  const filePath = path.join(path.resolve(vaultPath), "config.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { schemaVersion?: unknown };
    return normalizeSchemaVersion(parsed.schemaVersion);
  } catch {
    return defaultConfig.schemaVersion;
  }
}

/**
 * Write the schema version to a vault's config.json.
 * Preserves any existing fields in the file.
 */
export async function writeVaultSchemaVersion(vaultPath: string, schemaVersion: string): Promise<void> {
  const filePath = path.join(path.resolve(vaultPath), "config.json");
  let existing: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    existing = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // No existing config — start fresh
  }
  existing.schemaVersion = normalizeSchemaVersion(schemaVersion);
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
}

export class MnemonicConfigStore {
  readonly filePath: string;

  constructor(mainVaultPath: string) {
    this.filePath = path.join(path.resolve(mainVaultPath), "config.json");
  }

  async load(): Promise<MnemonicConfig> {
    return this.readAll();
  }

  async getProjectPolicy(projectId: string): Promise<ProjectMemoryPolicy | undefined> {
    const config = await this.readAll();
    return config.projectMemoryPolicies[projectId];
  }

  async setProjectPolicy(policy: ProjectMemoryPolicy): Promise<void> {
    const config = await this.readAll();
    config.projectMemoryPolicies[policy.projectId] = policy;
    await this.writeAll(config);
  }

  async setSchemaVersion(schemaVersion: string): Promise<void> {
    const config = await this.readAll();
    config.schemaVersion = normalizeSchemaVersion(schemaVersion);
    await this.writeAll(config);
  }

  private async readAll(): Promise<MnemonicConfig> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<MnemonicConfig>;
      return {
        schemaVersion: normalizeSchemaVersion(parsed.schemaVersion),
        reindexEmbedConcurrency: normalizeConcurrency(parsed.reindexEmbedConcurrency),
        projectMemoryPolicies: parsed.projectMemoryPolicies ?? {},
      };
    } catch {
      return { ...defaultConfig };
    }
  }

  private async writeAll(config: MnemonicConfig): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(config, null, 2) + "\n", "utf-8");
  }
}
