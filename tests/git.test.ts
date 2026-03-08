import { beforeEach, describe, expect, it, vi } from "vitest";

const add = vi.fn();
const status = vi.fn();
const commit = vi.fn();
const getRemotes = vi.fn();
const push = vi.fn();
const checkIsRepo = vi.fn();
const init = vi.fn();
const log = vi.fn();
const raw = vi.fn();
const fetch = vi.fn();
const pull = vi.fn();

vi.mock("simple-git", () => ({
  simpleGit: vi.fn(() => ({
    add,
    status,
    commit,
    getRemotes,
    push,
    checkIsRepo,
    init,
    log,
    raw,
    fetch,
    pull,
  })),
}));

describe("GitOps", () => {
  beforeEach(() => {
    vi.resetModules();
    add.mockReset();
    status.mockReset();
    commit.mockReset();
    getRemotes.mockReset();
    push.mockReset();
    checkIsRepo.mockReset();
    init.mockReset();
    log.mockReset();
    raw.mockReset();
    fetch.mockReset();
    pull.mockReset();

    checkIsRepo.mockResolvedValue(true);
    status.mockResolvedValue({ staged: ["notes/test.md"] });
    getRemotes.mockResolvedValue([{ name: "origin" }]);
  });

  it("throws when commit fails", async () => {
    const { GitOps } = await import("../src/git.js");
    const git = new GitOps("/tmp/repo");
    await git.init();

    commit.mockRejectedValueOnce(new Error("signing failed"));

    await expect(git.commit("remember: test", ["notes/test.md"])).rejects.toThrow(
      "Git commit failed: signing failed"
    );
  });

  it("returns false when there is nothing staged to commit", async () => {
    const { GitOps } = await import("../src/git.js");
    const git = new GitOps("/tmp/repo");
    await git.init();

    status.mockResolvedValueOnce({ staged: [] });

    await expect(git.commit("remember: test", ["notes/test.md"])).resolves.toBe(false);
    expect(commit).not.toHaveBeenCalled();
  });

  it("throws when push fails", async () => {
    const { GitOps } = await import("../src/git.js");
    const git = new GitOps("/tmp/repo");
    await git.init();

    push.mockRejectedValueOnce(new Error("network down"));

    await expect(git.push()).rejects.toThrow("Git push failed: network down");
  });
});
