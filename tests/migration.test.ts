import { describe, it, expect, beforeEach, vi } from "vitest";
import { Migrator } from "../src/migration.js";
import { Storage } from "../src/storage.js";
import { GitOps } from "../src/git.js";
import type { Vault, VaultManager } from "../src/vault.js";
import * as fs from "fs/promises";
import * as path from "path";
import os from "os";

describe("Migrator", () => {
  let tempDir: string;
  let storage: Storage;
  let vault: Vault;
  let vaultManager: VaultManager;
  let migrator: Migrator;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mnemonic-test-"));
    
    storage = new Storage(tempDir);
    await storage.init();
    
    vault = {
      storage,
      git: new GitOps(tempDir, "notes"),
      notesRelDir: "notes",
      isProject: false,
    };

    vaultManager = {
      main: vault,
      allKnownVaults: vi.fn().mockReturnValue([vault]),
      getProjectVaultIfExists: vi.fn().mockResolvedValue(vault),
    } as unknown as VaultManager;

    migrator = new Migrator(vaultManager);
  });

  describe("listAvailableMigrations", () => {
    it("should include built-in migrations", () => {
      const migrations = migrator.listAvailableMigrations();
      expect(migrations.length).toBeGreaterThan(0);
      expect(migrations.some(m => m.name === "v0.1.0-backfill-memory-versions")).toBe(true);
    });
  });

  describe("getPendingMigrations", () => {
    it("should return migrations for older schema version", async () => {
      const pending = await migrator.getPendingMigrations("0.0");
      expect(pending.some(m => m.name === "v0.1.0-backfill-memory-versions")).toBe(true);
    });

    it("should return no migrations when already at latest version", async () => {
      const pending = await migrator.getPendingMigrations("1.0");
      expect(pending.length).toBe(0);
    });
  });

  describe("v0.1.0-backfill-memory-versions migration", () => {
    const writeOldNote = async (id: string, title: string) => {
      const content = `---
title: ${title}
tags: []
createdAt: 2026-01-01T00:00:00.000Z
updatedAt: 2026-01-01T00:00:00.000Z
---

Content of ${title}`;
      await fs.writeFile(path.join(tempDir, "notes", `${id}.md`), content, "utf-8");
    };

    const writeNewNote = async (id: string, title: string) => {
      const content = `---
title: ${title}
tags: []
createdAt: 2026-01-01T00:00:00.000Z
updatedAt: 2026-01-01T00:00:00.000Z
memoryVersion: 1
---

Content of ${title}`;
      await fs.writeFile(path.join(tempDir, "notes", `${id}.md`), content, "utf-8");
    };

    const writeInvalidVersionNote = async (id: string, title: string) => {
      const content = `---
title: ${title}
tags: []
createdAt: 2026-01-01T00:00:00.000Z
updatedAt: 2026-01-01T00:00:00.000Z
memoryVersion: nope
---

Content of ${title}`;
      await fs.writeFile(path.join(tempDir, "notes", `${id}.md`), content, "utf-8");
    };

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, "notes"), { recursive: true });
    });

    it("should detect notes without memoryVersion", async () => {
      await writeOldNote("old-note-1", "Old Note 1");
      await writeNewNote("new-note-1", "New Note 1");
      
      const migration = migrator.listAvailableMigrations()
        .find(m => m.name === "v0.1.0-backfill-memory-versions")!;
      
      const result = await migration.run(vault, true);
      
      expect(result.notesProcessed).toBe(2);
      expect(result.notesModified).toBe(1);
      expect(result.errors).toEqual([]);
    });

    it("should add memoryVersion to old notes in dry-run mode", async () => {
      await writeOldNote("old-note", "Old Note");
      
      const migration = migrator.listAvailableMigrations()
        .find(m => m.name === "v0.1.0-backfill-memory-versions")!;
      
      const result = await migration.run(vault, true);
      
      expect(result.notesModified).toBe(1);
      
      const note = await storage.readNote("old-note");
      expect(note?.memoryVersion).toBe(0);
    });

    it("should add memoryVersion to old notes when dryRun=false", async () => {
      await writeOldNote("old-note", "Old Note");
      
      const migration = migrator.listAvailableMigrations()
        .find(m => m.name === "v0.1.0-backfill-memory-versions")!;
      
      const result = await migration.run(vault, false);
      
      expect(result.notesModified).toBe(1);
      
      const note = await storage.readNote("old-note");
      expect(note?.memoryVersion).toBe(1);
    });

    it("should not modify notes that already have memoryVersion", async () => {
      await writeNewNote("new-note", "New Note");
      
      const migration = migrator.listAvailableMigrations()
        .find(m => m.name === "v0.1.0-backfill-memory-versions")!;
      
      const result = await migration.run(vault, false);
      
      expect(result.notesProcessed).toBe(1);
      expect(result.notesModified).toBe(0);
    });

    it("should repair invalid memoryVersion values", async () => {
      await writeInvalidVersionNote("bad-note", "Bad Note");

      const migration = migrator.listAvailableMigrations()
        .find(m => m.name === "v0.1.0-backfill-memory-versions")!;

      const result = await migration.run(vault, false);

      expect(result.notesProcessed).toBe(1);
      expect(result.notesModified).toBe(1);

      const note = await storage.readNote("bad-note");
      expect(note?.memoryVersion).toBe(1);
    });

    it("should handle multiple notes mixed old and new", async () => {
      await writeOldNote("note-1", "Note 1");
      await writeOldNote("note-2", "Note 2");
      await writeNewNote("note-3", "Note 3");
      await writeOldNote("note-4", "Note 4");
      
      const migration = migrator.listAvailableMigrations()
        .find(m => m.name === "v0.1.0-backfill-memory-versions")!;
      
      const result = await migration.run(vault, false);
      
      expect(result.notesProcessed).toBe(4);
      expect(result.notesModified).toBe(3);
      expect(result.errors).toEqual([]);
    });

    it("should skip non-markdown files", async () => {
      await fs.writeFile(
        path.join(tempDir, "notes", "not-a-note.txt"),
        "This is not a markdown file",
        "utf-8"
      );
      
      const migration = migrator.listAvailableMigrations()
        .find(m => m.name === "v0.1.0-backfill-memory-versions")!;
      
      const result = await migration.run(vault, false);
      
      expect(result.notesProcessed).toBe(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe("runMigration", () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, "notes"), { recursive: true });
      
      const content = `---
title: Test Note
tags: []
createdAt: 2026-01-01T00:00:00.000Z
updatedAt: 2026-01-01T00:00:00.000Z
---

Test content`;
      await fs.writeFile(path.join(tempDir, "notes", "test-note.md"), content, "utf-8");
    });

    it("should run migration on all vaults by default", async () => {
      const { results, vaultsProcessed } = await migrator.runMigration(
        "v0.1.0-backfill-memory-versions",
        { dryRun: true }
      );
      
      expect(vaultsProcessed).toBe(1);
      expect(results.get(tempDir)?.notesModified).toBe(1);
    });

    it("should run migration on specific project vault when cwd provided", async () => {
      const otherDir = await fs.mkdtemp(path.join(os.tmpdir(), "mnemonic-other-"));
      const otherStorage = new Storage(otherDir);
      await otherStorage.init();
      const otherVault: Vault = {
        storage: otherStorage,
        git: new GitOps(otherDir, "notes"),
        notesRelDir: "notes",
        isProject: true,
      };

      vaultManager.allKnownVaults = vi.fn().mockReturnValue([vault, otherVault]);
      vaultManager.getProjectVaultIfExists = vi.fn().mockImplementation(async (cwd: string) => {
        return cwd === tempDir ? vault : otherVault;
      });
      
      const { results, vaultsProcessed } = await migrator.runMigration(
        "v0.1.0-backfill-memory-versions",
        { dryRun: true, cwd: tempDir }
      );
      
      expect(vaultsProcessed).toBe(1);
      expect(results.has(tempDir)).toBe(true);
      expect(results.has(otherDir)).toBe(false);
    });

    it("should throw error for unknown migration", async () => {
      await expect(
        migrator.runMigration("unknown-migration", { dryRun: true })
      ).rejects.toThrow("Unknown migration: unknown-migration");
    });
  });

  describe("runAllPending", () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, "notes"), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, "config.json"),
        JSON.stringify({ schemaVersion: "0.0", reindexEmbedConcurrency: 4, projectMemoryPolicies: {} }, null, 2),
        "utf-8"
      );

      const content = `---
title: Test Note
tags: []
createdAt: 2026-01-01T00:00:00.000Z
updatedAt: 2026-01-01T00:00:00.000Z
---

Test content`;
      await fs.writeFile(path.join(tempDir, "notes", "test-note.md"), content, "utf-8");
    });

    it("persists the latest schema version after successful execution", async () => {
      const commitSpy = vi.spyOn(vault.git, "commit").mockResolvedValue();
      const pushSpy = vi.spyOn(vault.git, "push").mockResolvedValue();

      const result = await migrator.runAllPending({ dryRun: false });

      expect(result.vaultsProcessed).toBe(1);
      expect(commitSpy).toHaveBeenCalled();
      expect(pushSpy).toHaveBeenCalled();

      const config = JSON.parse(await fs.readFile(path.join(tempDir, "config.json"), "utf-8")) as {
        schemaVersion: string;
      };
      expect(config.schemaVersion).toBe("1.0");
    });

    it("does not persist schema version during dry-run", async () => {
      await migrator.runAllPending({ dryRun: true });

      const config = JSON.parse(await fs.readFile(path.join(tempDir, "config.json"), "utf-8")) as {
        schemaVersion: string;
      };
      expect(config.schemaVersion).toBe("0.0");
    });

    it("does not advance global schema version for cwd-scoped runs", async () => {
      vi.spyOn(vault.git, "commit").mockResolvedValue();
      vi.spyOn(vault.git, "push").mockResolvedValue();

      await migrator.runAllPending({ dryRun: false, cwd: tempDir });

      const config = JSON.parse(await fs.readFile(path.join(tempDir, "config.json"), "utf-8")) as {
        schemaVersion: string;
      };
      expect(config.schemaVersion).toBe("0.0");
    });
  });

  describe("Version comparison", () => {
    it("should correctly compare version strings", async () => {
      const migratorAny = new Migrator(vaultManager);
      expect(await migratorAny.getPendingMigrations("0.0")).toHaveLength(1);
      expect(await migratorAny.getPendingMigrations("0.9")).toHaveLength(1);
      expect(await migratorAny.getPendingMigrations("1.0")).toHaveLength(0);
      expect(await migratorAny.getPendingMigrations("1.1")).toHaveLength(0);
    });

    it("rejects invalid schema versions", async () => {
      const migratorAny = new Migrator(vaultManager);
      await expect(migratorAny.getPendingMigrations("v1")).rejects.toThrow("Invalid schema version: v1");
    });
  });
});
