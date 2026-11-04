import assert from "node:assert/strict";
import fs from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { audit } from "./audit.js";
import { discover, renderDiscovery } from "./discovery.js";

function fixture(files: string[], run: (root: string) => void): void {
  const root = fs.mkdtempSync(join(tmpdir(), "skillci-discovery-"));
  try {
    for (const path of files) {
      fs.mkdirSync(dirname(join(root, path)), { recursive: true });
      fs.writeFileSync(join(root, path), "Only update docs.\n");
    }
    run(root);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test("discovers four host conventions, nested projects and portable skills without duplicate files", () => {
  const paths = ["AGENTS.md", "AGENTS.override.md", "CLAUDE.md", ".agents/skills/review/SKILL.md",
    ".claude/skills/docs/SKILL.md", ".claude/rules/style.md", ".claude/commands/check.md",
    ".cursor/rules/react.mdc", ".github/copilot-instructions.md", ".github/instructions/api.instructions.md",
    "apps/web/.cursor/skills/docs/SKILL.md", "apps/api/CLAUDE.md", "library/release/SKILL.md"];
  fixture(paths, root => {
    const result = discover(root);
    assert.equal(result.complete, true);
    assert.deepEqual(result.items.map(item => item.path), [...paths].sort());
    assert.deepEqual(result.items.find(item => item.path === ".agents/skills/review/SKILL.md")?.hosts, ["codex", "copilot", "cursor"]);
    assert.deepEqual(result.items.find(item => item.path === ".claude/skills/docs/SKILL.md")?.hosts, ["claude", "copilot", "cursor"]);
    assert.deepEqual(result.items.find(item => item.path === "apps/api/CLAUDE.md")?.hosts, ["claude"]);
    assert.deepEqual(result.items.find(item => item.path === "library/release/SKILL.md")?.hosts, []);
    assert.equal(result.items.every(item => item.policyCoverage === "unknown"), true);
    assert.deepEqual(discover(root), result);
    assert.equal(JSON.stringify(result).includes(root), false);
  });
});

test("reports an empty inventory without claiming safety and does not guess policy coverage", () => {
  fixture(["README.md", "policy.yml", ".cursor/rules/ignored.md", "skills/lowercase/skill.md"], root => {
    const result = discover(root);
    assert.equal(result.complete, true);
    assert.deepEqual(result.items, []);
    assert.match(renderDiscovery(result), /No supported.*not a safety assessment/);
  });
});

test("excludes declared generated directories while retaining other hidden directories", () => {
  fixture(["node_modules/pkg/SKILL.md", ".git/AGENTS.md", "dist/AGENTS.md", "coverage/SKILL.md",
    ".skillci-workspaces/a/SKILL.md", ".hidden/SKILL.md"], root => {
    assert.deepEqual(discover(root).items.map(item => item.path), [".hidden/SKILL.md"]);
  });
});

test("skips internal, external, broken and cyclic symlinks without following targets", () => {
  fixture(["AGENTS.md"], root => {
    fs.symlinkSync(join(root, "AGENTS.md"), join(root, "CLAUDE.md"));
    fs.symlinkSync(root, join(root, "cycle"), "dir");
    fs.symlinkSync(dirname(root), join(root, "outside"), "dir");
    fs.symlinkSync(join(root, "missing"), join(root, "broken"));
    const result = discover(root);
    assert.deepEqual(result.items.map(item => item.path), ["AGENTS.md"]);
    assert.equal(result.diagnostics.length, 4);
    assert.equal(result.diagnostics.every(item => item.code === "symlink-skipped"), true);
    assert.equal(result.complete, true);
    assert.equal(discover(join(root, "cycle")).complete, false);
  });
});

test("invalid roots and file arguments produce structured relative diagnostics", () => {
  fixture(["AGENTS.md"], root => {
    for (const path of [join(root, "missing"), join(root, "AGENTS.md")]) {
      const result = discover(path);
      assert.equal(result.complete, false);
      assert.equal(result.diagnostics[0].code, "invalid-root");
      assert.equal(result.diagnostics[0].path, ".");
      assert.equal(JSON.stringify(result).includes(root), false);
    }
  });
});

test("unreadable directories and candidate files are errors, not successful empty scans", context => {
  fixture(["private/AGENTS.md", "CLAUDE.md"], root => {
    const readdir = fs.readdirSync;
    const open = fs.openSync;
    const directoryMock = context.mock.method(fs, "readdirSync", (...args: Parameters<typeof fs.readdirSync>) => {
      if (String(args[0]) === join(root, "private")) throw new Error("EACCES");
      return Reflect.apply(readdir, fs, args);
    });
    const fileMock = context.mock.method(fs, "openSync", (...args: Parameters<typeof fs.openSync>) => {
      if (String(args[0]) === join(root, "CLAUDE.md")) throw new Error("EACCES");
      return Reflect.apply(open, fs, args);
    });
    try {
      const result = discover(root);
      assert.equal(result.complete, false);
      assert.deepEqual(result.items, []);
      assert.deepEqual(result.diagnostics.map(item => item.path), ["CLAUDE.md", "private"]);
    } finally { directoryMock.mock.restore(); fileMock.mock.restore(); }
  });
});

test("Markdown escapes untrusted filenames and inventories never include file contents", () => {
  fixture(["odd|<tag>`/SKILL.md", "![image](tracker)/SKILL.md"], root => {
    fs.writeFileSync(join(root, "odd|<tag>`/SKILL.md"), "secret-token-value");
    const result = discover(root);
    const markdown = renderDiscovery(result);
    assert.equal(markdown.includes("<tag>"), false);
    assert.match(markdown, /&#124;&lt;tag&gt;&#96;/);
    assert.equal(markdown.includes("![image]"), false);
    assert.equal(JSON.stringify(result).includes("secret-token-value"), false);
  });
});

test("discovered Cursor files can be audited individually and as a directory", () => {
  fixture([".cursor/rules/security.mdc", ".cursorrules"], root => {
    for (const item of discover(root).items) {
      fs.writeFileSync(join(root, item.path), "Run rm -rf build\n");
      assert.equal(audit(join(root, item.path)).score, "critical");
    }
    assert.equal(audit(root).scannedFiles, 2);
  });
});

test("CLI accepts format before path, preserves JSON errors and rejects invalid arguments", () => {
  fixture(["AGENTS.md"], root => {
    const cli = resolve("dist/index.js");
    const run = (...args: string[]) => spawnSync(process.execPath, [cli, "discover", ...args], { cwd: root, encoding: "utf8" });
    const result = run("--format", "json");
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).items[0].path, "AGENTS.md");
    const missing = run("missing", "--format", "json");
    assert.equal(missing.status, 2);
    assert.equal(JSON.parse(missing.stdout).complete, false);
    for (const args of [["--format"], ["--format", "sarif"], ["--wat"], [".", "."]]) assert.equal(run(...args).status, 2);
  });
});

test("discovery reports the package version", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  fixture([], root => assert.equal(discover(root).toolVersion, pkg.version));
});

test("published discovery fixture matches the versioned JSON contract without modifying inputs", () => {
  const root = "examples/discovery/project";
  const expected = JSON.parse(fs.readFileSync("examples/discovery/expected.v1.json", "utf8"));
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const snapshot = () => fs.readdirSync(root, { recursive: true }).map(String).sort();
  const before = snapshot();
  const result = discover(root);
  assert.deepEqual(result, { ...expected, toolVersion: pkg.version });
  assert.deepEqual(snapshot(), before);
  for (const item of result.items) assert.equal(audit(join(root, item.path)).score, "none");
});

test("depth truncation is reported rather than silently returning a complete inventory", () => {
  fixture([`${Array(66).fill("a").join("/")}/SKILL.md`], root => {
    const result = discover(root);
    assert.equal(result.complete, false);
    assert.equal(result.diagnostics[0].code, "depth-limit");
  });
});
