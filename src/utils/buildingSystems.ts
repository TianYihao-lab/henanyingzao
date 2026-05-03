export const TYPE_V2_ORDER = [
  "都城/城址",
  "官署/治理",
  "礼制/公共建筑",
  "工程/生产设施",
  "桥梁/交通",
  "民居/会馆/聚落",
] as const;

export type BuildingTypeV2Key = (typeof TYPE_V2_ORDER)[number];

export type BuildingSystemKey = "政治性建筑" | "工程/地方营造建筑" | "其他建筑";

export const SYSTEM_ORDER: BuildingSystemKey[] = ["政治性建筑", "工程/地方营造建筑"];

export const SYSTEM_COLORS: Record<BuildingSystemKey, string> = {
  "政治性建筑": "#b56f3d",
  "工程/地方营造建筑": "#6e8074",
  "其他建筑": "#8f6842",
};

export const TYPE_V2_COLORS: Record<BuildingTypeV2Key, string> = {
  "都城/城址": "#c58955",
  "官署/治理": "#5a8a6e",
  "礼制/公共建筑": "#8e6f9f",
  "工程/生产设施": "#4c7d7a",
  "桥梁/交通": "#5a7a9a",
  "民居/会馆/聚落": "#a46a6a",
};

export function getBuildingTypeV2(type: string): string {
  if (TYPE_V2_ORDER.includes(type as BuildingTypeV2Key)) {
    return type;
  }

  if (type === "皇宫/都城") return "都城/城址";
  if (type === "官府") return "官署/治理";
  if (type === "桥梁") return "桥梁/交通";
  if (type === "民居") return "民居/会馆/聚落";

  return type || "其他";
}

export function getBuildingSystem(type: string): BuildingSystemKey {
  const normalized = getBuildingTypeV2(type);

  if (["都城/城址", "官署/治理", "礼制/公共建筑"].includes(normalized)) {
    return "政治性建筑";
  }

  if (["工程/生产设施", "桥梁/交通", "民居/会馆/聚落"].includes(normalized)) {
    return "工程/地方营造建筑";
  }

  return "其他建筑";
}

export function getSystemDescription(system: BuildingSystemKey): string {
  if (system === "政治性建筑") {
    return "更接近制度中心、权力等级与官方组织能力的空间表达。";
  }

  if (system === "工程/地方营造建筑") {
    return "更接近工程技术、地方营造传统与日常生活空间的结构组织。";
  }

  return "用于补充整体建筑文明结构。";
}
