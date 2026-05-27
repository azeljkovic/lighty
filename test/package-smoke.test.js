import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "..");
const smokeTestTimeoutMs = 120_000;

describe("package smoke test", () => {
  it(
    "packs, installs, and imports the published package",
    { timeout: smokeTestTimeoutMs },
    async () => {
      const packDir = await mkdtemp(join(tmpdir(), "lighty-pack-"));
      const projectDir = await mkdtemp(join(tmpdir(), "lighty-project-"));
      const npmCacheDir = await mkdtemp(join(tmpdir(), "lighty-npm-cache-"));
      const env = {
        NPM_CONFIG_CACHE: npmCacheDir,
        npm_config_cache: npmCacheDir,
      };

      try {
        const packOutput = run(
          "npm",
          ["pack", "--json", "--pack-destination", packDir],
          { env },
        );
        const [packedPackage] = parsePackOutput(packOutput);
        assert.equal(packedPackage.name, "lighty");
        assert.ok(
          packedPackage.files.some((file) => file.path === "dist/index.js"),
          "packed package should include dist/index.js",
        );

        const tarballPath = isAbsolute(packedPackage.filename)
          ? packedPackage.filename
          : join(packDir, packedPackage.filename);

        await writeFile(
          join(projectDir, "package.json"),
          JSON.stringify({ private: true, type: "module" }, null, 2),
        );

        run(
          "npm",
          [
            "install",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
            tarballPath,
          ],
          { cwd: projectDir, env },
        );

        const smokeTestPath = join(projectDir, "import-lighty.mjs");
        await writeFile(
          smokeTestPath,
          [
            'import assert from "node:assert/strict";',
            'import { createClient, lightyAssert, lightyRequest, request } from "lighty";',
            "",
            'assert.equal(typeof createClient, "function");',
            'assert.equal(typeof lightyAssert.responseIsOk, "function");',
            'assert.equal(typeof lightyRequest.getRequest, "function");',
            'assert.equal(typeof request, "function");',
            "",
          ].join("\n"),
        );

        run(process.execPath, [smokeTestPath], { cwd: projectDir, env });
      } finally {
        await rm(packDir, { recursive: true, force: true });
        await rm(projectDir, { recursive: true, force: true });
        await rm(npmCacheDir, { recursive: true, force: true });
      }
    },
  );
});

function run(command, args, options = {}) {
  const { env, ...spawnOptions } = options;
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_audit: "false",
      npm_config_fund: "false",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
    ...spawnOptions,
  });

  assert.equal(
    result.status,
    0,
    [
      `Command failed: ${command} ${args.join(" ")}`,
      result.stdout.trim(),
      result.stderr.trim(),
    ]
      .filter(Boolean)
      .join("\n\n"),
  );

  return result.stdout.trim();
}

function parsePackOutput(output) {
  const jsonStart = output.lastIndexOf("\n[");
  const start = jsonStart === -1 ? output.indexOf("[") : jsonStart;

  assert.notEqual(start, -1, "npm pack should emit JSON package metadata");

  return JSON.parse(output.slice(start));
}
