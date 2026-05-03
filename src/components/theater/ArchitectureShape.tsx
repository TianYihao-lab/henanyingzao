import { useEffect, useMemo, useState } from "react";
import HenanBackdrop from "../common/HenanBackdrop";
import BuildingDetailModal from "../common/BuildingDetailModal";
import "./ArchitectureShape.css";
import { normalizeBuilding, toNumber, type BuildingRecord } from "../../utils/buildingViz";
import {
  getBuildingSystem,
  getBuildingTypeV2,
  SYSTEM_COLORS,
  SYSTEM_ORDER,
  TYPE_V2_ORDER,
} from "../../utils/buildingSystems";
import { publicPath } from "../../utils/publicPath";

interface TheaterProfileItem {
  name: string;
  city: string;
  type: string;
  history: number;
  rank: number;
  scale: number;
  cluster: number;
  avg_aci: number;
  summary: string;
}

interface SystemInsight {
  system: (typeof SYSTEM_ORDER)[number];
  count: number;
  avgAci: number;
  types: string[];
  representatives: string[];
  description: string;
}

type ShapePartKey = "terrace" | "roof" | "mass" | "wings";

interface ShapePartInfo {
  key: ShapePartKey;
  label: string;
  description: string;
}

const SHAPE_PARTS: ShapePartInfo[] = [
  {
    key: "terrace",
    label: "台基厚度",
    description: "对应历史延续性，数值越高，台基越厚重。",
  },
  {
    key: "roof",
    label: "屋顶与中轴",
    description: "对应政治等级，数值越高，屋顶越展开、中轴越高。",
  },
  {
    key: "mass",
    label: "主体体量",
    description: "对应建筑规模，数值越高，主体越宽阔饱满。",
  },
  {
    key: "wings",
    label: "附属单元",
    description: "对应空间聚集性，数值越高，两侧附属单元越丰富。",
  },
];

const TYPE_ORDER = TYPE_V2_ORDER;

function getSystemNarrative(system: (typeof SYSTEM_ORDER)[number]) {
  if (system === "政治性建筑") {
    return "政治性建筑主要由都城/城址、官署/治理、礼制/公共建筑构成，在成就剧场中更适合观察中轴秩序、台基等级、屋顶抬升与公共礼制如何被建筑形态编码。";
  }

  return "工程/地方营造建筑更接近日常生产、交通组织与地方营造传统，在成就剧场中更适合观察体量展开、附属单元与工程组织如何塑造空间结构。";
}

function PalaceShape({
  profile,
  activePart,
  onPartHover,
}: {
  profile: TheaterProfileItem;
  activePart: ShapePartKey | null;
  onPartHover: (part: ShapePartKey) => void;
}) {
  const history = profile.history ?? 0.5;
  const rank = profile.rank ?? 0.5;
  const scale = profile.scale ?? 0.5;
  const cluster = profile.cluster ?? 0.5;

  const p = useMemo(() => {
    const terraceHeight = 58 + history * 56;
    const terraceWidth = 220 + scale * 140;
    const hallWidth = 176 + scale * 132;
    const hallHeight = 88 + rank * 54;
    const podiumFront = 28 + history * 16;
    const stairWidth = 108 + history * 34;
    const stairHeight = 26 + history * 20;
    const roofWidth = hallWidth + 96;
    const roofHeight = 34 + rank * 30;
    const lowerRoofWidth = hallWidth + 58;
    const lowerRoofHeight = 18 + rank * 16;
    const eaveDrop = 20 + rank * 16;
    const ridgeWidth = roofWidth * 0.28;
    const upperHallWidth = hallWidth * 0.56;
    const upperHallHeight = 56 + rank * 116;
    const sideWingCount = Math.max(1, Math.round(1 + cluster * 4));
    const sideWingHeight = 22 + cluster * 32;
    const sideWingWidth = 24;
    const sideWingGap = 28;
    const columnCount = 5;
    const bracketDepth = 12 + rank * 8;

    return {
      terraceHeight,
      terraceWidth,
      hallWidth,
      hallHeight,
      podiumFront,
      stairWidth,
      stairHeight,
      roofWidth,
      roofHeight,
      lowerRoofWidth,
      lowerRoofHeight,
      eaveDrop,
      ridgeWidth,
      upperHallWidth,
      upperHallHeight,
      sideWingCount,
      sideWingHeight,
      sideWingWidth,
      sideWingGap,
      columnCount,
      bracketDepth,
    };
  }, [history, rank, scale, cluster]);

  const cx = 320;
  const groundY = 414;
  const terraceX = cx - p.terraceWidth / 2;
  const terraceY = groundY - p.terraceHeight;
  const hallX = cx - p.hallWidth / 2;
  const hallY = terraceY - p.hallHeight;
  const upperHallX = cx - p.upperHallWidth / 2;
  const upperHallY = hallY - p.upperHallHeight + 28;
  const roofBaseY = upperHallY + 22;
  const lowerRoofBaseY = hallY + 18;
  const roofLeft = cx - p.roofWidth / 2;
  const roofRight = cx + p.roofWidth / 2;
  const lowerRoofLeft = cx - p.lowerRoofWidth / 2;
  const lowerRoofRight = cx + p.lowerRoofWidth / 2;
  const hallDoorW = p.hallWidth * 0.34;
  const hallDoorH = p.hallHeight * 0.54;
  const colXs = Array.from(
    { length: p.columnCount },
    (_, i) => hallX + p.hallWidth * ((i + 1) / (p.columnCount + 1)),
  );
  const upperCorniceY = upperHallY + p.upperHallHeight - 14;

  const getPartClass = (part: ShapePartKey) =>
    `arch-hotspot ${activePart === part ? "is-active" : ""}`;

  return (
    <svg viewBox="0 -28 640 498" className="arch-shape-svg" aria-label={`${profile.name} 建筑成就形态图`}>
      <defs>
        <linearGradient id="terraceFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#cf9f7f" />
          <stop offset="100%" stopColor="#be9476" />
        </linearGradient>
        <linearGradient id="hallFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d89a57" />
          <stop offset="100%" stopColor="#a6602e" />
        </linearGradient>
        <linearGradient id="towerFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#c27f4e" />
          <stop offset="100%" stopColor="#965225" />
        </linearGradient>
        <linearGradient id="roofFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b86e3e" />
          <stop offset="100%" stopColor="#8a431d" />
        </linearGradient>
        <linearGradient id="columnFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#c37d49" />
          <stop offset="100%" stopColor="#995626" />
        </linearGradient>
      </defs>
      <g transform="translate(0 18)">
        <rect x="70" y="420" width="500" height="10" rx="5" className="arch-ground" />
        <rect x={cx - p.stairWidth / 2} y={groundY - p.stairHeight} width={p.stairWidth} height={p.stairHeight} rx="8" className="arch-stair" />

        <g
          className={getPartClass("terrace")}
          role="button"
          tabIndex={0}
          aria-label="查看台基厚度说明"
          onMouseEnter={() => onPartHover("terrace")}
          onFocus={() => onPartHover("terrace")}
          onClick={() => onPartHover("terrace")}
        >
          <g className={`arch-part-marker ${activePart === "terrace" ? "is-active" : ""}`}>
            <circle cx={cx} cy={terraceY + p.terraceHeight + 18} r="16" />
            <text x={cx} y={terraceY + p.terraceHeight + 23} textAnchor="middle">
              1
            </text>
          </g>
          <rect x={terraceX} y={terraceY} width={p.terraceWidth} height={p.terraceHeight} rx="14" fill="url(#terraceFill)" className="arch-terrace" />
          <rect x={terraceX + 12} y={terraceY + 8} width={p.terraceWidth - 24} height="6" rx="3" className="arch-terrace-line" />
          <rect x={terraceX + 18} y={terraceY + 22} width={p.terraceWidth - 36} height="8" rx="4" className="arch-terrace-band" />
        </g>

        <g
          className={getPartClass("mass")}
          role="button"
          tabIndex={0}
          aria-label="查看主体体量说明"
          onMouseEnter={() => onPartHover("mass")}
          onFocus={() => onPartHover("mass")}
          onClick={() => onPartHover("mass")}
        >
          <g className={`arch-part-marker ${activePart === "mass" ? "is-active" : ""}`}>
            <circle cx={hallX + p.hallWidth + 28} cy={hallY + p.hallHeight * 0.45} r="16" />
            <text x={hallX + p.hallWidth + 28} y={hallY + p.hallHeight * 0.45 + 5} textAnchor="middle">
              2
            </text>
          </g>
          <rect
            x={hallX - 6}
            y={hallY + 10}
            width={p.hallWidth + 12}
            height={p.hallHeight - 8}
            rx="18"
            fill="rgba(168, 97, 43, 0.12)"
            className="arch-hall"
          />
          <rect x={hallX} y={hallY} width={p.hallWidth} height={p.hallHeight} rx="14" fill="url(#hallFill)" className="arch-hall" />
          <rect x={hallX} y={hallY + p.podiumFront} width={p.hallWidth} height="10" rx="5" className="arch-cornice" />
          <rect x={hallX + 10} y={hallY + 26} width={p.hallWidth - 20} height="8" rx="4" className="arch-eave-band" />

          {colXs.map((x, idx) => (
            <g key={idx}>
              <rect x={x - 8} y={hallY + 18} width="16" height={p.hallHeight - 26} rx="8" fill="url(#columnFill)" className="arch-column" />
              <rect x={x - 12} y={hallY + 10} width="24" height={p.bracketDepth} rx="6" className="arch-bracket" />
            </g>
          ))}

          <rect x={cx - hallDoorW / 2} y={hallY + p.hallHeight - hallDoorH} width={hallDoorW} height={hallDoorH} rx="12" className="arch-door" />
          <rect x={cx - hallDoorW / 2 + 10} y={hallY + p.hallHeight - hallDoorH + 10} width={hallDoorW - 20} height={hallDoorH - 10} rx="10" fill="rgba(129, 76, 37, 0.18)" />

          <rect x={upperHallX} y={upperHallY} width={p.upperHallWidth} height={p.upperHallHeight} rx="10" fill="url(#towerFill)" className="arch-tower" />
          <rect x={upperHallX + 10} y={upperHallY + 14} width={p.upperHallWidth - 20} height="10" rx="5" className="arch-upper-band" />
          <rect x={upperHallX} y={upperCorniceY} width={p.upperHallWidth} height="8" rx="4" className="arch-upper-cornice" />
          <rect x={upperHallX + 26} y={upperHallY + 28} width={p.upperHallWidth - 52} height={p.upperHallHeight - 52} rx="8" fill="rgba(255, 241, 226, 0.1)" />
        </g>

        <g
          className={getPartClass("roof")}
          role="button"
          tabIndex={0}
          aria-label="查看屋顶与中轴说明"
          onMouseEnter={() => onPartHover("roof")}
          onFocus={() => onPartHover("roof")}
          onClick={() => onPartHover("roof")}
        >
          <g className={`arch-part-marker ${activePart === "roof" ? "is-active" : ""}`}>
            <circle cx={roofRight - 8} cy={roofBaseY - p.roofHeight * 0.35} r="16" />
            <text x={roofRight - 8} y={roofBaseY - p.roofHeight * 0.35 + 5} textAnchor="middle">
              3
            </text>
          </g>
          <path
            d={`
              M ${lowerRoofLeft} ${lowerRoofBaseY + p.lowerRoofHeight}
              Q ${cx - p.lowerRoofWidth * 0.28} ${lowerRoofBaseY + 4}, ${cx} ${lowerRoofBaseY - p.lowerRoofHeight}
              Q ${cx + p.lowerRoofWidth * 0.28} ${lowerRoofBaseY + 4}, ${lowerRoofRight} ${lowerRoofBaseY + p.lowerRoofHeight}
              L ${cx + p.lowerRoofWidth * 0.22} ${lowerRoofBaseY + p.lowerRoofHeight}
              Q ${cx + p.lowerRoofWidth * 0.1} ${lowerRoofBaseY + 12}, ${cx} ${lowerRoofBaseY - p.lowerRoofHeight * 0.24}
              Q ${cx - p.lowerRoofWidth * 0.1} ${lowerRoofBaseY + 12}, ${cx - p.lowerRoofWidth * 0.22} ${lowerRoofBaseY + p.lowerRoofHeight}
              Z
            `}
            fill="rgba(150, 79, 32, 0.9)"
            className="arch-roof-main"
          />
          <rect x={cx - p.lowerRoofWidth * 0.16} y={lowerRoofBaseY + p.lowerRoofHeight - 5} width={p.lowerRoofWidth * 0.32} height="8" rx="4" className="arch-roof-ridge" />
          <path
            d={`
              M ${roofLeft} ${roofBaseY + p.eaveDrop}
              Q ${cx - p.roofWidth * 0.3} ${roofBaseY + 2}, ${cx} ${roofBaseY - p.roofHeight}
              Q ${cx + p.roofWidth * 0.3} ${roofBaseY + 2}, ${roofRight} ${roofBaseY + p.eaveDrop}
              L ${cx + p.roofWidth * 0.3} ${roofBaseY + p.eaveDrop}
              Q ${cx + p.roofWidth * 0.12} ${roofBaseY + 10}, ${cx} ${roofBaseY - p.roofHeight * 0.48}
              Q ${cx - p.roofWidth * 0.12} ${roofBaseY + 10}, ${cx - p.roofWidth * 0.3} ${roofBaseY + p.eaveDrop}
              Z
            `}
            fill="url(#roofFill)"
            className="arch-roof-main"
          />
          <rect x={cx - p.ridgeWidth / 2} y={roofBaseY + p.eaveDrop - 5} width={p.ridgeWidth} height="10" rx="5" className="arch-roof-ridge" />
          <path d={`M ${cx - 16} ${roofBaseY - p.roofHeight * 0.82} L ${cx} ${roofBaseY - p.roofHeight - 12} L ${cx + 16} ${roofBaseY - p.roofHeight * 0.82} Z`} className="arch-finial" />
          <path d={`M ${roofLeft + 24} ${roofBaseY + p.eaveDrop - 2} L ${roofLeft + 10} ${roofBaseY + p.eaveDrop + 8} L ${roofLeft + 36} ${roofBaseY + p.eaveDrop + 2} Z`} className="arch-finial" />
          <path d={`M ${roofRight - 24} ${roofBaseY + p.eaveDrop - 2} L ${roofRight - 10} ${roofBaseY + p.eaveDrop + 8} L ${roofRight - 36} ${roofBaseY + p.eaveDrop + 2} Z`} className="arch-finial" />
        </g>

        <g
          className={getPartClass("wings")}
          role="button"
          tabIndex={0}
          aria-label="查看附属单元说明"
          onMouseEnter={() => onPartHover("wings")}
          onFocus={() => onPartHover("wings")}
          onClick={() => onPartHover("wings")}
        >
          <g className={`arch-part-marker ${activePart === "wings" ? "is-active" : ""}`}>
            <circle cx={terraceX - p.sideWingGap - 42} cy={terraceY - 6} r="16" />
            <text x={terraceX - p.sideWingGap - 42} y={terraceY - 1} textAnchor="middle">
              4
            </text>
          </g>
          {Array.from({ length: p.sideWingCount }).map((_, idx) => {
            const h = p.sideWingHeight + idx * 6;
            const gap = (idx + 1) * p.sideWingGap;
            const y = terraceY - h + 10;
            return (
              <g key={idx}>
                <rect x={terraceX - gap - p.sideWingWidth} y={y} width={p.sideWingWidth} height={h} rx="7" className="arch-wing" />
                <rect x={terraceX + p.terraceWidth + gap} y={y} width={p.sideWingWidth} height={h} rx="7" className="arch-wing" />
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}

function MiniMetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="arch-mini-metric">
      <span>{label}</span>
      <div className="arch-mini-metric__track">
        <div className="arch-mini-metric__fill" style={{ width: `${value * 100}%` }} />
      </div>
      <em>{(value * 100).toFixed(0)}</em>
    </div>
  );
}

function BuildingBanner({ profile }: { profile: TheaterProfileItem }) {
  const system = getBuildingSystem(profile.type);

  return (
    <div className="arch-building-banner">
      <div className="arch-building-banner__top">
        <div>
          <h4>{profile.name}</h4>
          <span>{profile.city}</span>
        </div>
        <div className="arch-building-banner__aci">ACI {profile.avg_aci.toFixed(2)}</div>
      </div>
      <div className="arch-building-banner__systems">
        <span
          className="arch-building-banner__system"
          style={{
            color: SYSTEM_COLORS[system],
            backgroundColor: `${SYSTEM_COLORS[system]}14`,
          }}
        >
          {system}
        </span>
        <span className="arch-building-banner__type">{profile.type}</span>
      </div>
      <div className="arch-building-banner__bars">
        <MiniMetricBar label="历史" value={profile.history} />
        <MiniMetricBar label="等级" value={profile.rank} />
        <MiniMetricBar label="规模" value={profile.scale} />
        <MiniMetricBar label="集聚" value={profile.cluster} />
      </div>
    </div>
  );
}

export default function ArchitectureShape() {
  const [profiles, setProfiles] = useState<TheaterProfileItem[]>([]);
  const [rawBuildings, setRawBuildings] = useState<BuildingRecord[]>([]);
  const [activeName, setActiveName] = useState("");
  const [systemFilter, setSystemFilter] = useState<"全部" | (typeof SYSTEM_ORDER)[number]>("全部");
  const [hoveredPart, setHoveredPart] = useState<ShapePartKey | null>(null);
  const [detailBuilding, setDetailBuilding] = useState<BuildingRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(publicPath("data/buildings_processed.json"))
      .then((res) => {
        if (!res.ok) {
          throw new Error("buildings_processed.json 加载失败");
        }
        return res.json();
      })
      .then((rows: BuildingRecord[]) => {
        const normalized = rows.map(normalizeBuilding);
        const coreSamples = normalized.filter((item) => toNumber(item.is_core_sample));
        const allGroups = new Map<string, BuildingRecord[]>();
        const coreGroups = new Map<string, BuildingRecord[]>();

        normalized.forEach((item) => {
          const type = getBuildingTypeV2(item.building_type_v2 ?? item.building_type);
          const list = allGroups.get(type) || [];
          list.push(item);
          allGroups.set(type, list);
        });

        coreSamples.forEach((item) => {
          const type = getBuildingTypeV2(item.building_type_v2 ?? item.building_type);
          const list = coreGroups.get(type) || [];
          list.push(item);
          coreGroups.set(type, list);
        });

        const picked: TheaterProfileItem[] = [];
        TYPE_ORDER.forEach((type) => {
          const source = (coreGroups.get(type) || []).length ? coreGroups.get(type) || [] : allGroups.get(type) || [];
          const list = source
            .sort((a, b) => toNumber(b.aci) - toNumber(a.aci))
            .slice(0, 2);
          list.forEach((item) => {
            picked.push({
              name: item.name,
              city: item.city_short ?? item.city,
              type,
              history: toNumber(item.history_score),
              rank: toNumber(item.rank_score),
              scale: toNumber(item.scale_score),
              cluster: toNumber(item.cluster_score),
              avg_aci: toNumber(item.aci),
              summary: item.summary || item.historical_background || "暂无说明。",
            });
          });
        });

        setProfiles(picked);
        setRawBuildings(normalized);
        setActiveName(picked[0]?.name ?? "");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredProfiles = useMemo(
    () =>
      systemFilter === "全部"
        ? profiles
        : profiles.filter((profile) => getBuildingSystem(profile.type) === systemFilter),
    [profiles, systemFilter],
  );

  const systemInsights = useMemo<SystemInsight[]>(
    () =>
      SYSTEM_ORDER.map((system) => {
        const list = rawBuildings.filter((item) => getBuildingSystem(getBuildingTypeV2(item.building_type_v2 ?? item.building_type)) === system);
        const avgAci = list.length ? list.reduce((sum, item) => sum + toNumber(item.aci), 0) / list.length : 0;
        const types = Array.from(new Set(list.map((item) => getBuildingTypeV2(item.building_type_v2 ?? item.building_type))));
        const representatives = list
          .slice()
          .sort((a, b) => toNumber(b.aci) - toNumber(a.aci))
          .slice(0, 3)
          .map((item) => item.name);

        return {
          system,
          count: list.length,
          avgAci,
          types,
          representatives,
          description: getSystemNarrative(system),
        };
      }),
    [rawBuildings],
  );

  useEffect(() => {
    if (!filteredProfiles.some((item) => item.name === activeName)) {
      setActiveName(filteredProfiles[0]?.name ?? "");
      setHoveredPart(null);
    }
  }, [activeName, filteredProfiles]);

  const active = filteredProfiles.find((item) => item.name === activeName) ?? filteredProfiles[0];

  if (loading) {
    return <div className="dynasty-loading">成就剧场数据正在加载中...</div>;
  }

  if (error) {
    return <div className="dynasty-loading">{error}</div>;
  }

  const hasFilteredProfiles = filteredProfiles.length > 0;
  const hoveredPartInfo = hoveredPart ? SHAPE_PARTS.find((part) => part.key === hoveredPart) ?? null : null;
  const focusSystem =
    systemFilter !== "全部"
      ? systemFilter
      : active
        ? getBuildingSystem(active.type)
        : null;
  const currentSystemInsight = focusSystem
    ? systemInsights.find((item) => item.system === focusSystem) ?? null
    : null;
  const groupedProfiles = SYSTEM_ORDER.map((system) => ({
    system,
    items: filteredProfiles.filter((profile) => getBuildingSystem(profile.type) === system),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="arch-card">
      <aside className="arch-side">
        <h3>从代表样本观察建筑文明的形态表达</h3>
        <div className="arch-sidebar-stack">
          <section className="arch-sidebar-panel">
            <div className="arch-sidebar-panel__header">
              <span className="arch-sidebar-panel__eyebrow">第一层</span>
              <strong>系统筛选</strong>
            </div>
            <div className="arch-filter-strip">
              {(["全部", ...SYSTEM_ORDER] as Array<"全部" | (typeof SYSTEM_ORDER)[number]>).map((system) => (
                <button
                  key={system}
                  type="button"
                  className={`arch-filter-chip ${systemFilter === system ? "active" : ""}`}
                  onClick={() => setSystemFilter(system)}
                >
                  {system}
                </button>
              ))}
            </div>
          </section>

          <section className="arch-sidebar-panel arch-sidebar-panel--samples">
            <div className="arch-sidebar-panel__header">
              <span className="arch-sidebar-panel__eyebrow">第二层</span>
              <strong>样本选择</strong>
            </div>
            {hasFilteredProfiles ? (
              groupedProfiles.map((group) => (
                <div key={group.system} className="arch-system-group">
                  <div className="arch-system-group__title">
                    <span
                      className="arch-system-group__dot"
                      style={{ backgroundColor: SYSTEM_COLORS[group.system] }}
                    />
                    <strong>{group.system}</strong>
                  </div>
                  <div className="arch-chip-group">
                    {group.items.map((profile) => (
                      <button
                        key={profile.name}
                        type="button"
                        className={`arch-chip ${profile.name === active?.name ? "active" : ""}`}
                        onClick={() => {
                          setActiveName(profile.name);
                          setHoveredPart(null);
                        }}
                      >
                        {profile.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="arch-empty-state arch-empty-state--sidebar">
                <p>{systemFilter === "全部" ? "暂无成就剧场数据。" : `${systemFilter}分类下暂时没有筛选结果。`}</p>
                {systemFilter !== "全部" ? (
                  <button
                    type="button"
                    className="arch-empty-action"
                    onClick={() => setSystemFilter("全部")}
                  >
                    返回全部
                  </button>
                ) : null}
              </div>
            )}
          </section>

          {currentSystemInsight ? (
            <section className="arch-sidebar-panel arch-sidebar-panel--insight">
              <div className="arch-sidebar-panel__header">
                <span className="arch-sidebar-panel__eyebrow">系统解读</span>
                <strong>{currentSystemInsight.system}</strong>
              </div>
              <p className="arch-system-insight__desc">{currentSystemInsight.description}</p>
              <div className="arch-system-insight__metrics">
                <span>样本 {currentSystemInsight.count}</span>
                <span>平均 ACI {currentSystemInsight.avgAci.toFixed(2)}</span>
              </div>
              <p className="arch-system-insight__types">
                主要类型：{currentSystemInsight.types.join("、")}
              </p>
              <p className="arch-system-insight__samples">
                代表样本：{currentSystemInsight.representatives.join("、")}
              </p>
            </section>
          ) : null}
        </div>
      </aside>

      <div className="arch-visual-panel">
        <div className="arch-stage-watermark">
          <HenanBackdrop mode="watermark" showRoute={false} showLabels={false} />
        </div>
        <div className="arch-visual-header">
          <div className="arch-visual-heading">
            <h3>建筑文明形态图</h3>
          </div>
          {hasFilteredProfiles && active ? (
            <div className="arch-stage-badges">
              <span>{active.name}</span>
              <span>{getBuildingSystem(active.type)}</span>
              <span>ACI {active.avg_aci.toFixed(2)}</span>
              <button
                type="button"
                className="arch-detail-btn"
                onClick={() => {
                  const b = rawBuildings.find((item) => item.name === active.name);
                  if (b) {
                    setDetailBuilding(b);
                    setIsDetailOpen(true);
                  }
                }}
              >
                详情
              </button>
            </div>
          ) : null}
        </div>

        {hasFilteredProfiles && active ? (
          <>
            <div className="arch-visual-banner">
              <BuildingBanner profile={active} />
            </div>

            <div className="arch-shape-stage">
              <div className="arch-shape-figure" onMouseLeave={() => setHoveredPart(null)}>
                {hoveredPartInfo ? (
                  <div className="arch-shape-tooltip">
                    <span className="arch-shape-tooltip__label">{hoveredPartInfo.label}</span>
                    <p>{hoveredPartInfo.description}</p>
                  </div>
                ) : null}
                <PalaceShape profile={active} activePart={hoveredPart} onPartHover={setHoveredPart} />
              </div>
            </div>

            <div className="arch-summary arch-summary--visual">
              <h4>{active.name}</h4>
              <p>
                该样本属于 <strong>{getBuildingSystem(active.type)}</strong>，细分类别为 <strong>{active.type}</strong>。
              </p>
              {currentSystemInsight ? <p>{currentSystemInsight.description}</p> : null}
              <p>{active.summary}</p>
            </div>
          </>
        ) : (
          <div className="arch-shape-stage arch-shape-stage--empty">
            <div className="arch-empty-state">
              <h4>当前分类暂无可展示样本</h4>
              <p>你可以切换到其它系统分类，或返回“全部”继续筛选。</p>
              {systemFilter !== "全部" ? (
                <button
                  type="button"
                  className="arch-empty-action"
                  onClick={() => setSystemFilter("全部")}
                >
                  返回全部
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <BuildingDetailModal
        building={detailBuilding}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        closeLabel="返回剧场"
      />
    </div>
  );
}
