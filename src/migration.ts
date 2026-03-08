import type { Vault, VaultManager } from "./vault.js";
import type { Note } from "./storage.js";
import { MnemonicConfigStore } from "./config.js";

export interface MigrationResult {
  notesProcessed: number;
  notesModified: number;
  modifiedNoteIds: string[];
  errors: Array<{ noteId: string; error: string }>;
  warnings: string[];
}

export interface Migration {
  name: string;
  description: string;
  minSchemaVersion?: string;
  maxSchemaVersion?: string;
  run(vault: Vault, dryRun: boolean): Promise<MigrationResult>;
}

export class Migrator {
  private migrations: Map<string, Migration> = new Map();
  private readonly configStore: MnemonicConfigStore;

  constructor(private vaultManager: VaultManager) {
    this.configStore = new MnemonicConfigStore(vaultManager.main.storage.vaultPath);
    this.registerBuiltInMigrations();
  }

  registerMigration(migration: Migration): void {
    if (this.migrations.has(migration.name)) {
      throw new Error(`Migration already registered: ${migration.name}`);
    }

    this.migrations.set(migration.name, migration);
  }

  listAvailableMigrations(): Migration[] {
    return Array.from(this.migrations.values());
  }

  async getPendingMigrations(currentSchemaVersion: string, targetSchemaVersion?: string): Promise<Migration[]> {
    const all = this.listAvailableMigrations();
    const current = this.parseVersion(currentSchemaVersion);
    const target = targetSchemaVersion ? this.parseVersion(targetSchemaVersion) : undefined;
    
    return all.filter(mig => {
      // Primary filter: maxSchemaVersion means "this migration upgrades TO this version"
      // Run if current < max, don't run if current >= max
      if (mig.maxSchemaVersion) {
        const max = this.parseVersion(mig.maxSchemaVersion);
        if (target && this.compareVersions(max, target) > 0) return false;
        if (this.compareVersions(current, max) >= 0) return false;
        return true;
      }
      
      // If no max, check min: minSchemaVersion means "this migration was introduced at this version"
      // Run if current < min (haven't reached that version yet)
      if (mig.minSchemaVersion) {
        const min = this.parseVersion(mig.minSchemaVersion);
        if (target && this.compareVersions(min, target) > 0) return false;
        if (this.compareVersions(current, min) < 0) return true;
        return false;
      }
      
      // No version constraints, always run
      return true;
    });
  }

  async runMigration(
    migrationName: string,
    options: { dryRun: boolean; backup?: boolean; cwd?: string }
  ): Promise<{ results: Map<string, MigrationResult>; vaultsProcessed: number }> {
    const migration = this.migrations.get(migrationName);
    if (!migration) {
      throw new Error(`Unknown migration: ${migrationName}`);
    }

    const vaults: Vault[] = [];
    if (options.cwd) {
      const projectVault = await this.vaultManager.getProjectVaultIfExists(options.cwd);
      if (projectVault) vaults.push(projectVault);
    } else {
      vaults.push(...this.vaultManager.allKnownVaults());
    }

    const results = new Map<string, MigrationResult>();
    const modifiedVaults: typeof vaults = [];
    
    for (const vault of vaults) {
      const result = await migration.run(vault, options.dryRun);
      results.set(vault.storage.vaultPath, result);
      
      if (!options.dryRun && result.notesModified > 0) {
        modifiedVaults.push(vault);
      }
    }

    // Auto-commit for non-dry-run migrations that modified notes
    if (!options.dryRun && modifiedVaults.length > 0) {
      for (const vault of modifiedVaults) {
        const result = results.get(vault.storage.vaultPath)!;
        const files = result.modifiedNoteIds.map(id => `${vault.notesRelDir}/${id}.md`);
        const commitMessage = `migrate: ${migrationName}\n\n- Modified: ${result.notesModified} note(s)\n- Processed: ${result.notesProcessed} note(s)`;
        
        try {
          await vault.git.commit(commitMessage, files);
          await vault.git.push();
        } catch (err) {
          // Non-fatal: log but don't fail migration
          console.error(`[migration] Failed to commit for ${vault.storage.vaultPath}: ${err}`);
          result.warnings.push(`Auto-commit failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    return { results, vaultsProcessed: vaults.length };
  }

  async runAllPending(options: { dryRun: boolean; backup?: boolean; cwd?: string }): Promise<{
    migrationResults: Map<string, { migration: string; result: MigrationResult }[]>;
    vaultsProcessed: number;
  }> {
    const config = await this.configStore.load();
    const currentVersion = config.schemaVersion;
    const pending = await this.getPendingMigrations(currentVersion);
    const migrationResults = new Map<string, { migration: string; result: MigrationResult }[]>();

    for (const migration of pending) {
      const { results } = await this.runMigration(migration.name, options);
      for (const [vaultPath, result] of results) {
        const vaultResults = migrationResults.get(vaultPath) ?? [];
        vaultResults.push({ migration: migration.name, result });
        migrationResults.set(vaultPath, vaultResults);
      }
    }

    const vaultsProcessed = options.cwd
      ? (await this.vaultManager.getProjectVaultIfExists(options.cwd) ? 1 : 0)
      : this.vaultManager.allKnownVaults().length;

    const shouldAdvanceSchemaVersion =
      !options.dryRun &&
      !options.cwd &&
      pending.length > 0 &&
      !hasMigrationFailures(migrationResults);

    if (shouldAdvanceSchemaVersion) {
      await this.configStore.setSchemaVersion(this.getLatestSchemaVersion(currentVersion, pending));
    }

    return { migrationResults, vaultsProcessed };
  }

  private registerBuiltInMigrations(): void {
    this.registerMigration(createV010BackfillMemoryVersionMigration());
  }

  private parseVersion(version: string): number[] {
    if (!/^\d+(\.\d+)*$/.test(version)) {
      throw new Error(`Invalid schema version: ${version}`);
    }

    return version.split(".").map(n => parseInt(n, 10));
  }

  private compareVersions(a: number[], b: number[]): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const aPart = a[i] || 0;
      const bPart = b[i] || 0;
      if (aPart !== bPart) return aPart - bPart;
    }
    return 0;
  }

  private getLatestSchemaVersion(currentSchemaVersion: string, migrations: Migration[]): string {
    let latest = currentSchemaVersion;

    for (const migration of migrations) {
      const candidate = migration.maxSchemaVersion ?? migration.minSchemaVersion;
      if (!candidate) {
        continue;
      }

      if (this.compareVersions(this.parseVersion(candidate), this.parseVersion(latest)) > 0) {
        latest = candidate;
      }
    }

    return latest;
  }
}

function hasMigrationFailures(
  migrationResults: Map<string, { migration: string; result: MigrationResult }[]>
): boolean {
  for (const results of migrationResults.values()) {
    if (results.some(({ result }) => result.errors.length > 0)) {
      return true;
    }
  }

  return false;
}

function createV010BackfillMemoryVersionMigration(): Migration {
  return {
    name: "v0.1.0-backfill-memory-versions",
    description: "Adds memoryVersion: 1 to all notes that lack a version marker",
    minSchemaVersion: "0.0",
    maxSchemaVersion: "1.0",
    async run(vault, dryRun): Promise<MigrationResult> {
      const result: MigrationResult = {
        notesProcessed: 0,
        notesModified: 0,
        modifiedNoteIds: [],
        errors: [],
        warnings: [],
      };

      const notes = await vault.storage.listNotes();
      result.notesProcessed = notes.length;

      for (const note of notes) {
        try {
          if (note.memoryVersion === undefined || note.memoryVersion === 0) {
            result.notesModified++;
            result.modifiedNoteIds.push(note.id);
            
            if (!dryRun) {
              const updatedNote: Note = {
                ...note,
                memoryVersion: 1,
              };
              await vault.storage.writeNote(updatedNote);
            }
          }
        } catch (err) {
          result.errors.push({
            noteId: note.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      return result;
    },
  };
}
