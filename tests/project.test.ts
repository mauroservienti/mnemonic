import { execFile } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import { afterEach, describe, expect, it } from "vitest";

import { detectProject } from "../src/project.js";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

describe("detectProject", () => {
  it("uses the git remote URL when origin exists", async () => {
    const dir = await makeTempDir("mnemonic-project-remote-");
    await execFileAsync("git", ["init"], { cwd: dir });
    await execFileAsync("git", ["remote", "add", "origin", "git@github.com:acme/myapp.git"], { cwd: dir });

    await expect(detectProject(dir)).resolves.toEqual({
      id: "github-com-acme-myapp",
      name: "myapp",
      source: "git-remote",
    });
  });

  it("falls back to the git root folder name when no remote exists", async () => {
    const parent = await makeTempDir("mnemonic-project-parent-");
    const dir = path.join(parent, "Repo Name");
    await fs.mkdir(dir);
    await execFileAsync("git", ["init"], { cwd: dir });

    await expect(detectProject(dir)).resolves.toEqual({
      id: "repo-name",
      name: "Repo Name",
      source: "git-folder",
    });
  });

  it("falls back to the directory name outside git", async () => {
    const parent = await makeTempDir("mnemonic-folder-parent-");
    const dir = path.join(parent, "Plain Folder");
    await fs.mkdir(dir);

    await expect(detectProject(dir)).resolves.toEqual({
      id: "plain-folder",
      name: "Plain Folder",
      source: "folder",
    });
  });
});
