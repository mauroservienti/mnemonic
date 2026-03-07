import fs from "fs/promises";
import path from "path";

import type { ProjectMemoryPolicy } from "./project-memory-policy.js";

export interface MnemonicConfig {
  reindexEmbedConcurrency: number;
  projectMemoryPolicies: Record<string, ProjectMemoryPolicy>;
}

const defaultConfig: MnemonicConfig = {
  reindexEmbedConcurrency: 4,
  projectMemoryPolicies: {},
};

function normalizeConcurrency(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultConfig.reindexEmbedConcurrency;
  }

  return Math.min(16, Math.max(1, Math.floor(value)));
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

  private async readAll(): Promise<MnemonicConfig> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<MnemonicConfig>;
      return {
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
