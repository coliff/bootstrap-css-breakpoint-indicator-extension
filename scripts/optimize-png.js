"use strict";

const { spawnSync } = require("node:child_process");
const { globSync } = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const ignoredDirectories = new Set(["dist", "node_modules"]);
const files = globSync("**/*.png", { cwd: rootDir }).filter((file) =>
  file.split(/[/\\]/u).every((part) => !ignoredDirectories.has(part)),
);

if (files.length === 0) {
  console.log("No PNG files found.");
  process.exit(0);
}

const result = spawnSync(
  "npx",
  ["--yes", "optipng-bin@9.0.0", "-o7", ...process.argv.slice(2), ...files],
  {
    cwd: rootDir,
    shell: true,
    stdio: "inherit",
  },
);

if (result.status !== 0) {
  process.exit(result.status === null ? 1 : result.status);
}
