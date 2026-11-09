#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const appDir = path.resolve(import.meta.dirname, "..");
const projectRoot = path.resolve(appDir, "../..");
const source = path.resolve(process.env.MARKET_DATA_DIR || path.join(projectRoot, "public-data"));
const target = path.join(appDir, "public", "data");

if (!fs.existsSync(path.join(source, "manifest.json"))) {
  console.error(`Missing public data manifest: ${source}`);
  process.exit(1);
}

execFileSync(process.execPath, [path.join(projectRoot, "scripts", "validate-public-data.mjs"), source], {
  cwd: projectRoot,
  stdio: "inherit",
});

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.cpSync(source, target, { recursive: true });

const communityDirectory = path.join(target, "communities");
const communityIndex = fs
  .readdirSync(communityDirectory)
  .filter((name) => name.endsWith(".json"))
  .map((name) => {
    const data = JSON.parse(fs.readFileSync(path.join(communityDirectory, name), "utf8"));
    return {
      id: data.community.id,
      slug: data.community.slug,
      name: data.community.name,
      district_name: data.community.district_name,
      submarket: data.community.submarket,
      property_use: data.community.property_use,
      latest: data.latest,
      observation: data.observation,
      history_count: data.transactions.length,
    };
  })
  .sort(
    (left, right) =>
      right.observation.median_unit_price - left.observation.median_unit_price,
  );
fs.writeFileSync(
  path.join(target, "community-index.json"),
  JSON.stringify(communityIndex),
  "utf8",
);

const searchIndexPath = path.join(target, "search-index.json");
const searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, "utf8"));
fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex), "utf8");
console.log(`Prepared static data from ${source}`);
