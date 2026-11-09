import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import type {
  CommunityData,
  Coverage,
  DistrictData,
  Manifest,
  Overview,
  SearchIndex,
} from "@/lib/types";

const productionDataRoot = path.join(process.cwd(), "public", "data");
const devDataRoot =
  process.env.NODE_ENV === "development"
    ? [
        path.resolve(process.cwd(), "../../public-data"),
        path.resolve(process.cwd(), "public-data"),
      ].find((candidate) => fs.existsSync(path.join(candidate, "manifest.json")))
    : undefined;
const dataRoot = devDataRoot ?? productionDataRoot;

function readJson<T>(relativePath: string): T {
  const fullPath = path.join(dataRoot, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8")) as T;
}

export const getManifest = cache(() => readJson<Manifest>("manifest.json"));
export const getOverview = cache(() => readJson<Overview>("overview.json"));
export const getCoverage = cache(() => readJson<Coverage>("coverage.json"));
export const getSearchIndex = cache(() => readJson<SearchIndex>("search-index.json"));

export const getDistrict = cache((code: string) => {
  try {
    return readJson<DistrictData>(`districts/${code}.json`);
  } catch {
    return null;
  }
});

export const getCommunity = cache((slug: string) => {
  try {
    return readJson<CommunityData>(`communities/${slug}.json`);
  } catch {
    return null;
  }
});

export const listCommunitySlugs = cache(() => {
  const directory = path.join(dataRoot, "communities");
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""));
});

export const listDistrictCodes = cache(() => {
  const directory = path.join(dataRoot, "districts");
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""));
});

export const listDistricts = cache(() =>
  listDistrictCodes()
    .map((code) => getDistrict(code))
    .filter((data): data is DistrictData => Boolean(data)),
);

export const getDistrictBySlug = cache((slug: string) => {
  return listDistricts().find((data) => data.district.slug === slug) ?? null;
});

export const listDistrictSlugs = cache(() =>
  listDistricts().map((data) => data.district.slug),
);

export const listCommunities = cache(() =>
  listCommunitySlugs()
    .map((slug) => getCommunity(slug))
    .filter((data): data is CommunityData => Boolean(data))
    .sort(
      (left, right) =>
        right.observation.median_unit_price - left.observation.median_unit_price,
    ),
);
