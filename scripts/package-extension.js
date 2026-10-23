"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const extensionDir = path.join(rootDir, "extension");
const manifest = JSON.parse(
  fs.readFileSync(path.join(extensionDir, "manifest.json"), "utf8"),
);
const distDir = path.join(rootDir, "dist");
const zipPath = path.join(
  distDir,
  `bootstrap-css-breakpoint-indicator-${manifest.version}.zip`,
);

fs.mkdirSync(distDir, { recursive: true });
fs.rmSync(zipPath, { force: true });

const result = spawnSync(
  "npx",
  ["--yes", "bestzip@4.0.3", "--no-follow-sym-links", zipPath, "*"],
  {
    cwd: extensionDir,
    shell: true,
    stdio: "inherit",
  },
);

if (result.status !== 0) {
  process.exit(result.status === null ? 1 : result.status);
}

console.log(zipPath);
