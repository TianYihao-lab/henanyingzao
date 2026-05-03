import type { BuildingRecord } from "./buildingViz";
import type { ParsedLocalSourcePage } from "./sourcePageParser";
import { publicPath } from "./publicPath";

export interface LocalSourceManifestItem {
  buildingCode: string;
  baseName: string;
  pageTitle?: string;
  matchMode?: string;
}

export interface LocalBuildingDetailEntry {
  buildingCode: string;
  source: LocalSourceManifestItem;
  page: ParsedLocalSourcePage;
}

interface LocalBuildingDetailBundle {
  updatedAt: string;
  matchedCount: number;
  missingCount: number;
  availableBuildingCodes: string[];
  missingBuildingCodes: string[];
  details: Record<string, LocalBuildingDetailEntry>;
}

let detailBundlePromise: Promise<LocalBuildingDetailBundle> | null = null;

export async function loadLocalBuildingDetailBundle() {
  if (!detailBundlePromise) {
    detailBundlePromise = fetch(publicPath("data/local_building_details.json"))
      .then((response) => {
        if (!response.ok) {
          throw new Error("建筑详情数据加载失败");
        }
        return response.json() as Promise<LocalBuildingDetailBundle>;
      })
      .catch((error) => {
        detailBundlePromise = null;
        throw error;
      });
  }
  return detailBundlePromise;
}

export async function loadLocalSourceManifest() {
  const bundle = await loadLocalBuildingDetailBundle();
  return Object.values(bundle.details).map((detail) => detail.source);
}

export async function findLocalSourcePageForBuilding(building: BuildingRecord) {
  const bundle = await loadLocalBuildingDetailBundle();
  return bundle.details[building.building_code]?.source ?? null;
}

export async function findLocalBuildingDetailByCode(buildingCode: string) {
  const bundle = await loadLocalBuildingDetailBundle();
  return bundle.details[buildingCode] ?? null;
}

export function buildLocalDetailHash(
  buildingCode: string,
  currentHash = window.location.hash,
): string {
  const from = currentHash.replace(/^#/, "") || "/theater";
  return `#/building/${encodeURIComponent(buildingCode)}?from=${encodeURIComponent(from)}`;
}

export function getBuildingDetailRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (!raw.startsWith("building/")) {
    return null;
  }

  const [routePart, queryPart = ""] = raw.split("?");
  const code = decodeURIComponent(routePart.replace("building/", ""));
  const params = new URLSearchParams(queryPart);
  const from = params.get("from");

  return {
    buildingCode: code,
    from: from ? decodeURIComponent(from) : "/theater",
  };
}

export function getPageKeyFromRoute(route: string) {
  const normalizedRoute = route.replace(/^\/+/, "");
  if (normalizedRoute.startsWith("city/")) {
    return "map";
  }

  const page = normalizedRoute.split("/")[0];
  return page || "theater";
}
