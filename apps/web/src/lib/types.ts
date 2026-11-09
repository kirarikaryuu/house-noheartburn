export type PointStatus = "published" | "insufficient_sample" | "no_data";
export type PropertyUse = "unknown" | "residential" | "commercial" | "other";

export interface MonthlyPoint {
  month: string;
  status: PointStatus;
  transaction_count: number;
  source_count: number;
  median_unit_price: number | null;
  median_total_price: number | null;
  p25_unit_price: number | null;
  p75_unit_price: number | null;
  mom_pct: number | null;
  yoy_pct: number | null;
}

export interface CommunityObservation {
  month: string;
  transaction_count: number;
  source_count: number;
  median_unit_price: number;
  median_total_price: number;
  min_unit_price: number;
  max_unit_price: number;
}

export interface PublicTransaction {
  deal_date: string;
  layout: string;
  area_sqm: number;
  floor: string;
  total_price_yuan: number;
  unit_price_yuan: number;
}

export interface DistributionBucket {
  labels: string[];
  counts: number[];
}

export interface Distribution {
  area: DistributionBucket;
  total_price: DistributionBucket;
}

export interface DistrictMeta {
  code: string;
  name: string;
  slug: string;
  group: string;
}

export interface Manifest {
  schema_version: number;
  kind: "manifest";
  as_of: string | null;
  published_at: string;
  snapshot_id: string;
  content_sha256: string;
  scope: {
    districts: string[];
    property_use: "all";
    history_months: number;
    data_nature: string;
  };
  summary: {
    as_of: string | null;
    published_at: string;
    transaction_count: number;
    community_count: number;
    published_community_count: number;
    district_count: number;
    file_count: number;
  };
}

export interface Overview {
  schema_version: number;
  kind: "overview";
  as_of: string | null;
  published_at: string;
  summary: {
    district_count: number;
    published_district_count: number;
    community_count: number;
    published_community_count: number;
    latest_transaction_count: number;
    latest_source_count: number;
    history_months: number;
    min_district_samples: number;
    min_community_samples: number;
  };
  city_series: MonthlyPoint[];
  districts: Array<DistrictMeta & { latest_point: MonthlyPoint }>;
}

export interface SubmarketSummary {
  name: string;
  latest: MonthlyPoint;
  series: MonthlyPoint[];
}

export interface CommunitySummary {
  id: string;
  slug: string;
  name: string;
  submarket: string;
  property_use: PropertyUse;
  latest: MonthlyPoint;
  observation: CommunityObservation;
}

export interface DistrictData {
  schema_version: number;
  kind: "district";
  as_of: string | null;
  district: DistrictMeta;
  latest: MonthlyPoint;
  series: MonthlyPoint[];
  submarkets: SubmarketSummary[];
  communities: CommunitySummary[];
  distribution: Distribution;
}

export interface CommunityData {
  schema_version: number;
  kind: "community";
  as_of: string | null;
  community: {
    id: string;
    slug: string;
    name: string;
    district_code: string;
    district_name: string;
    submarket: string;
    property_use: PropertyUse;
  };
  latest: MonthlyPoint;
  observation: CommunityObservation;
  series: MonthlyPoint[];
  distribution: Distribution;
  transactions: PublicTransaction[];
}

export interface CoverageCell {
  district_code: string;
  month: string;
  status: PointStatus;
  transaction_count: number;
  source_count: number;
}

export interface Coverage {
  schema_version: number;
  kind: "coverage";
  as_of: string | null;
  from: string;
  to: string;
  months: string[];
  cells: CoverageCell[];
}

export interface SearchEntry {
  type: "district" | "community";
  id: string;
  name: string;
  subtitle: string;
  path: string;
}

export interface SearchIndex {
  schema_version: number;
  kind: "search-index";
  as_of: string | null;
  entries: SearchEntry[];
}
