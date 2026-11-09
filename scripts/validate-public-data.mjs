#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = path.resolve(process.argv[2] || "public-data");
const schemaPath = path.resolve("contracts/public-data.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(schema);

const validators = {
  manifest: ajv.getSchema(`${schema.$id}#/$defs/manifest`),
  overview: ajv.getSchema(`${schema.$id}#/$defs/overview`),
  district: ajv.getSchema(`${schema.$id}#/$defs/district`),
  community: ajv.getSchema(`${schema.$id}#/$defs/community`),
  coverage: ajv.getSchema(`${schema.$id}#/$defs/coverage`),
  "search-index": ajv.getSchema(`${schema.$id}#/$defs/search-index`),
};

function fail(message) {
  console.error(`Public data validation failed: ${message}`);
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${path.relative(root, file)}: ${error.message}`);
  }
}

function validate(kind, file) {
  const validator = validators[kind];
  if (!validator) fail(`no validator for ${kind}`);
  const payload = readJson(file);
  if (!validator(payload)) {
    const details = validator.errors
      .map((error) => `${error.instancePath || "/"} ${error.message}`)
      .join("; ");
    fail(`${path.relative(root, file)}: ${details}`);
  }
  return payload;
}

const forbiddenKeys = new Set([
  "source_id",
  "source_name",
  "source_url",
  "creator_key",
  "display_name",
  "asset_id",
  "asset_url",
  "candidate_id",
  "transaction_id",
  "evidence",
  "raw_cells",
  "floor_raw",
  "listing_price_yuan",
  "issues",
  "note",
]);

function scanPrivacy(value, file, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanPrivacy(item, file, [...trail, String(index)]));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) fail(`${file}: forbidden private field ${[...trail, key].join(".")}`);
    scanPrivacy(child, file, [...trail, key]);
  }
}

if (!fs.existsSync(root)) fail(`directory does not exist: ${root}`);
const manifestFile = path.join(root, "manifest.json");
if (!fs.existsSync(manifestFile)) fail("manifest.json is missing");
const manifest = validate("manifest", manifestFile);
scanPrivacy(manifest, "manifest.json");

const overview = validate("overview", path.join(root, "overview.json"));
scanPrivacy(overview, "overview.json");
if (overview.as_of !== manifest.as_of) fail("overview.as_of differs from manifest.as_of");
if (overview.districts.length !== 10) fail("overview must contain exactly ten districts");
if (manifest.summary.community_count !== overview.summary.community_count) {
  fail("manifest and overview community_count differ");
}
if (manifest.summary.published_community_count !== overview.summary.published_community_count) {
  fail("manifest and overview published_community_count differ");
}

const districtThreshold = overview.summary.min_district_samples;
const communityThreshold = overview.summary.min_community_samples;

function validatePointThreshold(point, minimum, context) {
  if (point.status === "published" && point.transaction_count < minimum) {
    fail(`${context}: published point has ${point.transaction_count} samples, minimum is ${minimum}`);
  }
}

for (const [index, point] of overview.city_series.entries()) {
  validatePointThreshold(point, districtThreshold, `overview.city_series[${index}]`);
}
for (const district of overview.districts) {
  validatePointThreshold(
    district.latest_point,
    districtThreshold,
    `overview.districts.${district.code}.latest_point`,
  );
}

const coverage = validate("coverage", path.join(root, "coverage.json"));
scanPrivacy(coverage, "coverage.json");
const searchIndex = validate("search-index", path.join(root, "search-index.json"));
scanPrivacy(searchIndex, "search-index.json");
if (coverage.months.length !== manifest.scope.history_months) {
  fail(
    `coverage has ${coverage.months.length} months, expected ${manifest.scope.history_months}`,
  );
}
if (coverage.cells.length !== 10 * coverage.months.length) {
  fail("coverage must contain exactly ten districts for every month");
}

const districtFiles = fs.existsSync(path.join(root, "districts"))
  ? fs.readdirSync(path.join(root, "districts")).filter((name) => name.endsWith(".json")).sort()
  : [];
if (districtFiles.length !== 10) fail(`expected ten district files, found ${districtFiles.length}`);
for (const name of districtFiles) {
  const file = path.join(root, "districts", name);
  const payload = validate("district", file);
  scanPrivacy(payload, `districts/${name}`);
  if (payload.as_of !== manifest.as_of) fail(`districts/${name}: as_of mismatch`);
  for (const [index, point] of payload.series.entries()) {
    validatePointThreshold(point, districtThreshold, `districts/${name}.series[${index}]`);
  }
  for (const [index, submarket] of payload.submarkets.entries()) {
    validatePointThreshold(
      submarket.latest,
      districtThreshold,
      `districts/${name}.submarkets[${index}].latest`,
    );
  }
  for (const [index, community] of payload.communities.entries()) {
    validatePointThreshold(
      community.latest,
      communityThreshold,
      `districts/${name}.communities[${index}].latest`,
    );
  }
}

const communityDir = path.join(root, "communities");
const communityFiles = fs.existsSync(communityDir)
  ? fs.readdirSync(communityDir).filter((name) => name.endsWith(".json")).sort()
  : [];
let publishedCommunityCount = 0;
for (const name of communityFiles) {
  const file = path.join(communityDir, name);
  const payload = validate("community", file);
  scanPrivacy(payload, `communities/${name}`);
  if (payload.as_of !== manifest.as_of) fail(`communities/${name}: as_of mismatch`);
  if (payload.observation.month !== payload.latest.month) {
    fail(`communities/${name}: observation month differs from latest month`);
  }
  if (payload.observation.transaction_count !== payload.latest.transaction_count) {
    fail(`communities/${name}: observation sample count differs from latest sample count`);
  }
  if (payload.transactions.length < payload.observation.transaction_count) {
    fail(`communities/${name}: transaction history is shorter than the latest-month sample`);
  }
  if (payload.latest.status === "published") publishedCommunityCount += 1;
  validatePointThreshold(payload.latest, communityThreshold, `communities/${name}.latest`);
  for (const [index, point] of payload.series.entries()) {
    validatePointThreshold(point, communityThreshold, `communities/${name}.series[${index}]`);
  }
}
if (overview.summary.community_count !== communityFiles.length) {
  fail(
    `overview community_count is ${overview.summary.community_count}, found ${communityFiles.length} community files`,
  );
}
if (manifest.summary.community_count !== communityFiles.length) {
  fail(
    `manifest community_count is ${manifest.summary.community_count}, found ${communityFiles.length} community files`,
  );
}
if (overview.summary.published_community_count !== publishedCommunityCount) {
  fail(
    `overview published_community_count is ${overview.summary.published_community_count}, found ${publishedCommunityCount}`,
  );
}
if (manifest.summary.published_community_count !== publishedCommunityCount) {
  fail(
    `manifest published_community_count is ${manifest.summary.published_community_count}, found ${publishedCommunityCount}`,
  );
}

const knownTopLevel = new Set(["manifest.json", "overview.json", "coverage.json", "search-index.json"]);
for (const name of fs.readdirSync(root)) {
  const full = path.join(root, name);
  if (fs.statSync(full).isFile() && !knownTopLevel.has(name)) {
    fail(`unexpected top-level file: ${name}`);
  }
}

function walkFiles(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return walkFiles(path.join(directory, entry.name), relative);
    return [relative];
  });
}

const dataFiles = [
  "overview.json",
  "coverage.json",
  "search-index.json",
  ...districtFiles.map((name) => `districts/${name}`),
  ...communityFiles.map((name) => `communities/${name}`),
].sort();
const actualPublicFiles = walkFiles(root).filter((name) => name !== "manifest.json");
const allowedPublicFiles = new Set(dataFiles);
for (const relative of actualPublicFiles) {
  if (!allowedPublicFiles.has(relative)) {
    fail(`unexpected or non-aggregate public file: ${relative}`);
  }
}
const digest = crypto.createHash("sha256");
for (const relative of dataFiles) {
  digest.update(relative, "utf8");
  digest.update(fs.readFileSync(path.join(root, relative)));
}
const contentDigest = digest.digest("hex");
if (contentDigest !== manifest.content_sha256) {
  fail(`content hash mismatch: manifest=${manifest.content_sha256} actual=${contentDigest}`);
}
if (manifest.snapshot_id !== contentDigest.slice(0, 16)) {
  fail("snapshot_id does not match content digest");
}
if (manifest.summary.file_count !== dataFiles.length + 1) {
  fail("manifest file_count is incorrect");
}

console.log(
  JSON.stringify(
    {
      status: "ok",
      as_of: manifest.as_of,
      snapshot_id: manifest.snapshot_id,
      districts: districtFiles.length,
      communities: communityFiles.length,
      files: dataFiles.length + 1,
    },
    null,
    2,
  ),
);
