export interface BuildingRecord {
  building_code: string;
  name: string;
  city: string;
  city_short?: string;
  county?: string | null;
  lon: number | string;
  lat: number | string;
  dynasty: string;
  dynasty_group?: string;
  period_start?: number | string | null;
  period_end?: number | string | null;
  building_type: string;
  building_type_v2?: string | null;
  heritage_level?: string | null;
  status?: string | null;
  historical_background?: string | null;
  feature_note?: string | null;
  history_level?: number | string | null;
  rank_level?: number | string | null;
  scale_level?: number | string | null;
  cluster_level?: number | string | null;
  history_score?: number | string | null;
  rank_score?: number | string | null;
  scale_score?: number | string | null;
  cluster_score?: number | string | null;
  aci?: number | string | null;
  is_core_sample?: number | string | null;
  summary?: string | null;
  source?: string | null;
  source_quality_note?: string | null;
  data_quality_note?: string | null;
}

export interface ProjectedPoint {
  x: number;
  y: number;
}

export function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeBuilding(record: BuildingRecord): BuildingRecord {
  return {
    ...record,
    city_short:
      record.city_short ??
      String(record.city)
        .replace(/[?\uFF1F]+$/u, "")
        .replace(/\u5E02$/u, ""),
    building_type_v2: record.building_type_v2 ?? record.building_type,
    dynasty_group: record.dynasty_group ?? normalizeDynasty(record.dynasty),
    lon: toNumber(record.lon),
    lat: toNumber(record.lat),
    aci: record.aci === null || record.aci === undefined ? null : toNumber(record.aci),
    history_score:
      record.history_score === null || record.history_score === undefined
        ? null
        : toNumber(record.history_score),
    rank_score:
      record.rank_score === null || record.rank_score === undefined
        ? null
        : toNumber(record.rank_score),
    scale_score:
      record.scale_score === null || record.scale_score === undefined
        ? null
        : toNumber(record.scale_score),
    cluster_score:
      record.cluster_score === null || record.cluster_score === undefined
        ? null
        : toNumber(record.cluster_score),
  };
}

export function normalizeDynasty(dynasty: string): string {
  const value = String(dynasty ?? "");
  if (/仰韶|新石器/u.test(value)) return "新石器";
  if (/夏|商|周/u.test(value)) return "夏商周";
  if (/秦|汉/u.test(value)) return "秦汉";
  if (/魏|晋|南北朝/u.test(value)) return "魏晋南北朝";
  if (/隋|唐/u.test(value)) return "隋唐";
  if (/宋|元/u.test(value)) return "宋元";
  if (/明|清/u.test(value)) return "明清";
  return "其他";
}

export function projectGeoPoint(
  lon: number,
  lat: number,
  bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number },
  width: number,
  height: number,
  padding = 40,
): ProjectedPoint {
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const lonRatio = (lon - bounds.minLon) / Math.max(bounds.maxLon - bounds.minLon, 0.0001);
  const latRatio = (lat - bounds.minLat) / Math.max(bounds.maxLat - bounds.minLat, 0.0001);

  return {
    x: padding + clamp(lonRatio, 0, 1) * usableWidth,
    y: height - padding - clamp(latRatio, 0, 1) * usableHeight,
  };
}

export function getGeoBounds(records: Array<Pick<BuildingRecord, "lon" | "lat">>) {
  const lons = records.map((item) => toNumber(item.lon));
  const lats = records.map((item) => toNumber(item.lat));
  return {
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}

export function buildHullPath(
  points: ProjectedPoint[],
  width: number,
  height: number,
): string {
  if (!points.length) {
    return `M 80 70 L ${width - 100} 60 L ${width - 80} ${height - 120} L 140 ${height - 70} Z`;
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  return [
    `M ${minX - 36} ${midY - 120}`,
    `Q ${midX - 110} ${minY - 80}, ${midX - 18} ${minY - 32}`,
    `Q ${maxX + 56} ${minY + 4}, ${maxX + 34} ${midY - 18}`,
    `Q ${maxX + 12} ${maxY + 74}, ${midX + 32} ${maxY + 42}`,
    `Q ${midX - 124} ${maxY + 68}, ${minX - 44} ${midY + 54}`,
    `Q ${minX - 86} ${midY - 22}, ${minX - 36} ${midY - 120}`,
    "Z",
  ].join(" ");
}

export function getAciBandLabel(aci: number): string {
  if (aci >= 0.8) return "高值核心";
  if (aci >= 0.7) return "重点节点";
  if (aci >= 0.6) return "稳定样本";
  return "基础样本";
}

export function getDirection(from: ProjectedPoint, to: ProjectedPoint): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const horizontal = dx > 14 ? "东" : dx < -14 ? "西" : "中";
  const vertical = dy > 14 ? "南" : dy < -14 ? "北" : "中";

  if (horizontal === "中" && vertical === "中") return "中部";
  if (horizontal === "中") return `${vertical}部`;
  if (vertical === "中") return `${horizontal}部`;
  return `${vertical}${horizontal}`;
}
