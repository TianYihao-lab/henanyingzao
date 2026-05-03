import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./DynastyTimeline.css";
import { normalizeBuilding, toNumber, type BuildingRecord } from "../../utils/buildingViz";
import BuildingDetailModal from "../common/BuildingDetailModal";
import { getBuildingSystem, getBuildingTypeV2, SYSTEM_COLORS } from "../../utils/buildingSystems";
import EChart from "../common/EChart";
import { publicPath } from "../../utils/publicPath";

interface DynastySummaryItem {
  dynasty: string;
  dynasty_order: number | string;
  period_role?: string | null;
  is_peak?: boolean | number | string | null;
  sample_count: number | string;
  avg_aci: number | string | null;
  history_avg?: number | string | null;
  rank_avg?: number | string | null;
  scale_avg?: number | string | null;
  cluster_avg?: number | string | null;
  rep_city?: string | null;
  rep_type?: string | null;
}

interface DynastyTimelineProps {
  selectedDynasty?: string;
  onDynastyChange?: (dynasty: string) => void;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function formatPeriodLabel(role?: string | null): string {
  return role || "阶段性转折";
}

function buildPeakReason(profile: DynastySummaryItem): string {
  const reasons: string[] = [];
  if ((Number(profile.sample_count) || 0) >= 7) reasons.push("样本规模较大");
  if ((Number(profile.history_avg) || 0) >= 0.8) reasons.push("历史延续性突出");
  if ((Number(profile.rank_avg) || 0) >= 0.8) reasons.push("政治等级较高");
  if ((Number(profile.scale_avg) || 0) >= 0.7) reasons.push("建筑规模较强");
  if ((Number(profile.cluster_avg) || 0) >= 0.75) reasons.push("空间集聚明显");

  if (!reasons.length) {
    return "这一阶段虽然不是绝对高峰，但仍然呈现出制度中心与空间组织持续塑形的阶段性特征。";
  }

  return `该时期之所以形成成就高峰，主要因为${reasons.slice(0, 3).join("、")}，并由${profile.rep_city ?? "代表城市"}等节点共同支撑。`;
}

function buildStageInsight(profile: DynastySummaryItem): string {
  const reasons: string[] = [];
  if ((Number(profile.sample_count) || 0) >= 7) reasons.push("样本规模较大");
  if ((Number(profile.history_avg) || 0) >= 0.8) reasons.push("历史延续性较强");
  if ((Number(profile.rank_avg) || 0) >= 0.8) reasons.push("政治等级较高");
  if ((Number(profile.scale_avg) || 0) >= 0.7) reasons.push("建筑规模较强");
  if ((Number(profile.cluster_avg) || 0) >= 0.75) reasons.push("空间集聚明显");

  if (profile.is_peak) {
    if (!reasons.length) {
      return "这一阶段被标记为高峰，说明其在样本规模、制度表达或空间集聚上具备较强代表性。";
    }

    return `该时期之所以形成成就高峰，主要因为${reasons.slice(0, 3).join("、")}，并由${profile.rep_city ?? "代表城市"}等节点共同支撑。`;
  }

  if (!reasons.length) {
    return "这一阶段并非成就高峰，整体更接近阶段性过渡与结构调整，说明建筑文明会随制度中心与空间组织方式变化而重组。";
  }

  return `这一阶段并非成就高峰，但在${reasons.slice(0, 2).join("、")}等方面仍有一定表现，更适合被理解为阶段性重组而非集中抬升。`;
}

function buildDynastyStageInsight(profile: DynastySummaryItem): string {
  const typeLabel = getBuildingTypeV2(profile.rep_type ?? "未分类");
  const systemLabel = getBuildingSystem(typeLabel);

  switch (Number(profile.dynasty_order)) {
    case 1:
      return `新石器阶段更像中原建筑文明的起笔时期，重点不在成熟王朝建制，而在早期聚落与中心节点的形成。当前以${systemLabel}为主，代表类型是${typeLabel}，说明这一时期已经出现了明确的空间中心。`;
    case 2:
      return `夏商周阶段进入王都营建与礼制秩序逐步定型的关键期。当前以${systemLabel}为主，代表类型是${typeLabel}，因此更能体现政治中心、都城组织与制度表达的强化。`;
    case 3:
      return `秦汉阶段呈现出帝国秩序向区域空间扩展的趋势。当前以${systemLabel}为主，代表类型是${typeLabel}，它不是最高峰，但能看见中央制度向更广范围投射后的建筑表达。`;
    case 4:
      return `魏晋南北朝阶段不是成就高峰，更适合理解为过渡与重组时期。当前以${systemLabel}为主，代表类型是${typeLabel}，样本虽然很少，但洛阳等节点仍保留了制度转换时期的建筑痕迹。`;
    case 5:
      return `隋唐阶段呈现出都城重整与交通工程并进的特征。当前以${systemLabel}为主，代表类型是${typeLabel}，说明制度中心强化的同时，区域连接与工程组织能力也在同步提升。`;
    case 6:
      return `宋元阶段更强调城市繁盛、功能分化与交通组织。当前以${systemLabel}为主，代表类型是${typeLabel}，建筑文明在这一时期不只围绕政治中心，也开始向更复合的城市生活展开。`;
    case 7:
      return `明清阶段更偏向长期延续、地方化沉淀与官署园宅并存。当前以${systemLabel}为主，代表类型是${typeLabel}，这一时期的重要性不在突然抬升，而在持续保存和地方营造传统的累积。`;
    default:
      return `当前以${systemLabel}为主，代表类型是${typeLabel}。这一阶段体现出建筑文明会随制度中心、城市节点与空间组织方式变化而不断重组。`;
  }
}

function buildPeriodNarrative(profile: DynastySummaryItem): string {
  switch (Number(profile.dynasty_order)) {
    case 1:
      return "新石器阶段更接近文明萌生与聚落奠基时期，建筑样本集中出现在早期中心聚落与城址遗存中，重点体现的是中原地区空间秩序开始形成、核心节点逐渐出现。";
    case 2:
      return "夏商周阶段是王都营建与礼制秩序逐步定型的重要时期，都城/城址与官署/治理类样本更集中，说明建筑文明开始更明确地服务于权力中心、都城组织与制度表达。";
    case 3:
      return "秦汉阶段体现出帝国秩序向区域空间扩展的特征，政治性建筑仍占主导，但整体指标已经从早期高峰回落，更像是中央制度在更大尺度上的延展与落地。";
    case 4:
      return "魏晋南北朝阶段不是成就高峰，更适合理解为制度过渡与空间格局重组时期。样本较少，但空间集聚性很强，说明这一阶段的建筑表现更偏向节点性保留，而不是整体抬升。";
    case 5:
      return "隋唐阶段呈现出都城秩序重整与交通工程并进的特征，政治性建筑与工程/地方营造建筑同时出现，说明制度中心强化的同时，区域连接与工程组织能力也在提升。";
    case 6:
      return "宋元阶段更接近城市繁盛与功能分化时期，官署/治理与礼制/公共建筑依然重要，但桥梁/交通、城市节点和商业交通相关营造活动也更加活跃，建筑文明开始呈现更明显的复合化面貌。";
    case 7:
      return "明清阶段表现出官署、园宅与地方遗存并存的特点，政治性表达仍然存在，但整体更偏向存续、沉淀与地方化展开，是中原建筑文明进入长期延续的重要阶段。";
    default:
      return "这一阶段体现出建筑文明随制度中心、城市节点与空间组织方式变化而不断重组的特征。";
  }
}

void buildPeakReason;
void buildStageInsight;
void buildPeriodNarrative;

function buildRadarOption(profile: DynastySummaryItem) {
  const indicators = [
    { name: "历史延续", max: 1, key: "history_avg" as const },
    { name: "政治等级", max: 1, key: "rank_avg" as const },
    { name: "建筑规模", max: 1, key: "scale_avg" as const },
    { name: "空间集聚", max: 1, key: "cluster_avg" as const },
  ];
  const values = indicators.map((item) => Number((profile as unknown as Record<string, unknown>)[item.key]) || 0);

  return {
    color: ["#c9894d"],
    radar: {
      indicator: indicators.map((item) => ({ name: item.name, max: item.max })),
      center: ["50%", "56%"],
      radius: "56%",
      nameGap: 14,
      axisName: { color: "var(--muted)", fontSize: 12 },
      splitArea: { areaStyle: { color: ["rgba(201,137,77,0.06)", "rgba(201,137,77,0.03)"] } },
      axisLine: { lineStyle: { color: "rgba(143,71,33,0.2)" } },
      splitLine: { lineStyle: { color: "rgba(143,71,33,0.15)" } },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: values,
            name: profile.dynasty,
            areaStyle: { color: "rgba(201,137,77,0.25)" },
            lineStyle: { width: 2, color: "#c9894d" },
            itemStyle: { color: "#8f4721" },
          },
        ],
      },
    ],
  };
}

function buildSystemRatioOption(
  profiles: DynastySummaryItem[],
  ratioMap: Record<string, { political: number; engineering: number; total: number }>,
  activeDynasty: string,
) {
  const dynasties = profiles.map((item) => item.dynasty);
  const politicalData = dynasties.map((dynasty) => {
    const political = Number((ratioMap[dynasty]?.political ?? 0).toFixed(2));
    const engineering = Number((ratioMap[dynasty]?.engineering ?? 0).toFixed(2));
    const isActive = dynasty === activeDynasty;
    return {
      value: political,
      itemStyle: {
        color: isActive ? SYSTEM_COLORS["政治性建筑"] : "rgba(181,111,61,0.76)",
        borderRadius:
          engineering > 0
            ? [0, 0, 14, 14]
            : [14, 14, 14, 14],
      },
    };
  });
  const engineeringData = dynasties.map((dynasty) => {
    const political = Number((ratioMap[dynasty]?.political ?? 0).toFixed(2));
    const engineering = Number((ratioMap[dynasty]?.engineering ?? 0).toFixed(2));
    const isActive = dynasty === activeDynasty;
    return {
      value: engineering,
      itemStyle: {
        color: isActive ? SYSTEM_COLORS["工程/地方营造建筑"] : "rgba(110,128,116,0.76)",
        borderRadius:
          political > 0
            ? [14, 14, 0, 0]
            : [14, 14, 14, 14],
      },
    };
  });

  return {
    backgroundColor: "transparent",
    grid: { left: 56, right: 20, top: 16, bottom: 20 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: Array<{ axisValue: string; seriesName: string; value: number }>) => {
        if (!params.length) return "";
        const title = params[0].axisValue;
        const lines = params.map((item) => `${item.seriesName}: ${(item.value * 100).toFixed(0)}%`);
        return [title, ...lines].join("<br/>");
      },
    },
    xAxis: {
      type: "category",
      data: dynasties,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "rgba(143,71,33,0.16)" } },
      axisLabel: { color: "#6e5947", fontSize: 12, interval: 0 },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1,
      splitNumber: 4,
      axisLabel: {
        color: "#7a6552",
        fontSize: 11,
        formatter: (value: number) => `${Math.round(value * 100)}%`,
      },
      splitLine: { lineStyle: { color: "rgba(143,71,33,0.08)" } },
    },
    series: [
      {
        name: "政治性建筑",
        type: "bar",
        stack: "system",
        barWidth: 34,
        cursor: "pointer",
        barGap: "-100%",
        emphasis: { focus: "series" },
        data: politicalData,
      },
      {
        name: "工程/地方营造建筑",
        type: "bar",
        stack: "system",
        barWidth: 34,
        cursor: "pointer",
        emphasis: { focus: "series" },
        data: engineeringData,
      },
    ],
  };
}

function MiniTrendChart({
  profiles,
  active,
  onSelect,
}: {
  profiles: DynastySummaryItem[];
  active: DynastySummaryItem;
  onSelect: (dynasty: string) => void;
}) {
  const validAci = profiles.map((item) => Number(item.avg_aci) || 0);
  const maxAci = Math.max(...validAci, 0.01);
  const chartHeight = 240;
  const axisY = 200;
  const barWidth = 44;
  const barGap = 18;
  const leftPadding = 32;
  const rightPadding = 16;
  const badgeWidth = 48;
  const chartWidth = leftPadding + rightPadding + profiles.length * barWidth + Math.max(0, profiles.length - 1) * barGap;

  const bars = profiles.map((item, idx) => ({
    ...item,
    x: leftPadding + idx * (barWidth + barGap),
    height: 48 + ((Number(item.avg_aci) || 0) / maxAci) * 110,
  }));

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="dynasty-chart-svg" aria-label="朝代成就趋势图">
      <line x1={leftPadding - 4} y1={axisY} x2={chartWidth - rightPadding} y2={axisY} className="dynasty-axis" />
      {bars.map((bar) => {
        const y = axisY - bar.height;
        const activeCls = active.dynasty === bar.dynasty ? " active" : "";
        return (
          <g
            key={bar.dynasty}
            className={`dynasty-bar-group${activeCls}`}
            role="button"
            tabIndex={0}
            aria-label={`查看${bar.dynasty}的建筑成就`}
            onClick={() => onSelect(bar.dynasty)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(bar.dynasty);
              }
            }}
          >
            <rect x={bar.x + (barWidth - badgeWidth) / 2} y={y - 30} width={badgeWidth} height="22" rx="11" className="dynasty-value-badge" />
            <rect x={bar.x} y={y} width={barWidth} height={bar.height} rx="12" className={`dynasty-bar${activeCls}`} />
            <text x={bar.x + barWidth / 2} y={axisY + 17} textAnchor="middle" className="dynasty-axis-label">
              {bar.dynasty}
            </text>
            <text x={bar.x + barWidth / 2} y={y - 15} textAnchor="middle" className="dynasty-value-label">
              {(Number(bar.avg_aci) || 0).toFixed(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function DynastyTimeline({ selectedDynasty, onDynastyChange }: DynastyTimelineProps) {
  const [profiles, setProfiles] = useState<DynastySummaryItem[]>([]);
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [internalSelectedDynasty, setInternalSelectedDynasty] = useState("");
  const [clickedBuildingCode, setClickedBuildingCode] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [detailBuilding, setDetailBuilding] = useState<BuildingRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(publicPath("data/dynasty_summary.json")).then((res) => {
        if (!res.ok) throw new Error("dynasty_summary.json 加载失败");
        return res.json();
      }),
      fetch(publicPath("data/buildings_processed.json")).then((res) => {
        if (!res.ok) throw new Error("buildings_processed.json 加载失败");
        return res.json();
      }),
    ])
      .then(([rows, buildingRows]: [DynastySummaryItem[], BuildingRecord[]]) => {
        const normalizedProfiles = rows
          .map((item) => ({
            ...item,
            dynasty_order: Number(item.dynasty_order),
            sample_count: Number(item.sample_count),
            avg_aci: toNullableNumber(item.avg_aci),
            history_avg: toNullableNumber(item.history_avg),
            rank_avg: toNullableNumber(item.rank_avg),
            scale_avg: toNullableNumber(item.scale_avg),
            cluster_avg: toNullableNumber(item.cluster_avg),
            is_peak: toBool(item.is_peak),
          }))
          .filter((item) => item.dynasty)
          .sort((a, b) => Number(a.dynasty_order) - Number(b.dynasty_order));

        setProfiles(normalizedProfiles);
        setBuildings(buildingRows.map(normalizeBuilding));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!profiles.length) return;
    setInternalSelectedDynasty((current) => {
      if (selectedDynasty && profiles.find((item) => item.dynasty === selectedDynasty)) return selectedDynasty;
      if (current && profiles.find((item) => item.dynasty === current)) return current;
      return profiles[0]?.dynasty ?? "";
    });
  }, [profiles, selectedDynasty]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("drawer-open");
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove("drawer-open");
    };
  }, [isDrawerOpen]);

  const activeName = useMemo(() => {
    if (selectedDynasty && profiles.find((item) => item.dynasty === selectedDynasty)) return selectedDynasty;
    if (internalSelectedDynasty && profiles.find((item) => item.dynasty === internalSelectedDynasty)) return internalSelectedDynasty;
    return profiles[0]?.dynasty ?? "";
  }, [selectedDynasty, internalSelectedDynasty, profiles]);

  const active = profiles.find((item) => item.dynasty === activeName) ?? profiles[0];
  const peakReason = active ? buildDynastyStageInsight(active) : "";
  const systemRatioMap = useMemo(() => {
    const initial = profiles.reduce<Record<string, { political: number; engineering: number; total: number }>>((acc, item) => {
      acc[item.dynasty] = { political: 0, engineering: 0, total: 0 };
      return acc;
    }, {});

    buildings.forEach((item) => {
      const dynasty = item.dynasty_group;
      if (!dynasty || !initial[dynasty]) return;
      const system = getBuildingSystem(item.building_type_v2 ?? item.building_type);
      initial[dynasty].total += 1;
      if (system === "政治性建筑") initial[dynasty].political += 1;
      if (system === "工程/地方营造建筑") initial[dynasty].engineering += 1;
    });

    return Object.fromEntries(
      Object.entries(initial).map(([dynasty, value]) => [
        dynasty,
        {
          political: value.total ? value.political / value.total : 0,
          engineering: value.total ? value.engineering / value.total : 0,
          total: value.total,
        },
      ]),
    );
  }, [buildings, profiles]);
  const systemRatioOption = useMemo(
    () => buildSystemRatioOption(profiles, systemRatioMap, active?.dynasty ?? ""),
    [profiles, systemRatioMap, active],
  );
  const systemRatioEvents = useMemo(
    () => ({
      click: (params: { name?: string; componentType?: string; seriesType?: string }) => {
        if (params?.componentType === "series" && params?.seriesType === "bar" && params?.name) {
          setInternalSelectedDynasty(params.name);
          onDynastyChange?.(params.name);
        }
      },
    }),
    [onDynastyChange],
  );
  const activeSystemStats = active ? systemRatioMap[active.dynasty] : null;
  const activeDominantSystem = activeSystemStats
    ? activeSystemStats.political >= activeSystemStats.engineering
      ? "政治性建筑"
      : "工程/地方营造建筑"
    : null;

  const typicalBuildings = useMemo(() => {
    if (!active) return [];
    const seen = new Set<string>();
    return buildings
      .filter((item) => item.dynasty_group === active.dynasty)
      .sort((a, b) => {
        const coreDiff = toNumber(b.is_core_sample) - toNumber(a.is_core_sample);
        if (coreDiff !== 0) return coreDiff;
        const aciDiff = toNumber(b.aci) - toNumber(a.aci);
        if (aciDiff !== 0) return aciDiff;
        return toNumber(b.rank_score) - toNumber(a.rank_score);
      })
      .filter((item) => {
        if (seen.has(item.building_code)) return false;
        seen.add(item.building_code);
        return true;
      })
      .slice(0, 4);
  }, [active, buildings]);

  const selectedBuildingCode = useMemo(() => {
    if (clickedBuildingCode && typicalBuildings.find((item) => item.building_code === clickedBuildingCode)) {
      return clickedBuildingCode;
    }
    return typicalBuildings[0]?.building_code ?? null;
  }, [clickedBuildingCode, typicalBuildings]);

  const selectedBuilding = typicalBuildings.find((item) => item.building_code === selectedBuildingCode) ?? typicalBuildings[0] ?? null;

  if (loading) return <div className="dynasty-loading">朝代数据正在加载中...</div>;
  if (error) return <div className="dynasty-loading">{error}</div>;
  if (!active || profiles.length === 0) return <div className="dynasty-loading">暂无朝代汇总数据。</div>;

  const handleSelectDynasty = (dynasty: string) => {
    setInternalSelectedDynasty(dynasty);
    onDynastyChange?.(dynasty);
  };

  const drawerContent =
    selectedBuilding && isDrawerOpen
      ? createPortal(
          <>
            <button type="button" className="dynasty-drawer-backdrop" aria-label="关闭建筑详情" onClick={() => setIsDrawerOpen(false)} />
            <aside className="dynasty-drawer" aria-label="建筑详情抽屉">
              <div className="dynasty-drawer__header">
                <div>
                  <p className="dynasty-drawer__eyebrow">建筑详情</p>
                  <h3>{selectedBuilding.name}</h3>
                </div>
                <button type="button" className="dynasty-drawer__close" onClick={() => setIsDrawerOpen(false)} aria-label="关闭建筑详情">
                  ×
                </button>
              </div>

              <div className="dynasty-drawer__meta">
                <span>{selectedBuilding.city_short ?? selectedBuilding.city}</span>
                <span>{getBuildingTypeV2(selectedBuilding.building_type_v2 ?? selectedBuilding.building_type)}</span>
                <span>ACI {toNumber(selectedBuilding.aci).toFixed(2)}</span>
              </div>

              <div className="dynasty-drawer__section">
                <h4>建筑概况</h4>
                <p>{selectedBuilding.summary || selectedBuilding.historical_background || "暂无建筑概况说明。"}</p>
              </div>

              <div className="dynasty-drawer__section">
                <h4>形制与特点</h4>
                <p>{selectedBuilding.feature_note || "暂无形制特点说明。"}</p>
              </div>

              <div className="dynasty-drawer__grid">
                <div className="dynasty-drawer__kv">
                  <span>所在城市</span>
                  <strong>{selectedBuilding.city_short ?? selectedBuilding.city}</strong>
                </div>
                <div className="dynasty-drawer__kv">
                  <span>朝代归类</span>
                  <strong>{selectedBuilding.dynasty_group ?? active.dynasty}</strong>
                </div>
                <div className="dynasty-drawer__kv">
                  <span>保存状态</span>
                  <strong>{selectedBuilding.status ?? "暂无"}</strong>
                </div>
                <div className="dynasty-drawer__kv">
                  <span>遗产等级</span>
                  <strong>{selectedBuilding.heritage_level ?? "暂无"}</strong>
                </div>
              </div>
            </aside>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="dynasty-card">
      <div className="dynasty-visual-panel">
        <div className="dynasty-visual-header">
          <h3>朝代成就趋势</h3>
          <span>点击柱状图，切换不同历史阶段的平均 ACI 与样本代表性</span>
        </div>
        <MiniTrendChart profiles={profiles} active={active} onSelect={handleSelectDynasty} />
        <div className="dynasty-system-panel">
          <div className="dynasty-system-header">
            <div>
              <h4>系统结构变化</h4>
              <p>比较各朝代中政治性建筑与工程/地方营造建筑的样本比例，观察制度中心与工程地方传统如何在不同时段此消彼长。点击柱子可联动切换当前朝代。</p>
            </div>
          </div>
          <EChart option={systemRatioOption} onEvents={systemRatioEvents} style={{ height: 300 }} opts={{ renderer: "canvas" }} lazyUpdate />
          <div className="dynasty-system-legend">
            <span>
              <i className="is-political" />
              政治性建筑
            </span>
            <span>
              <i className="is-engineering" />
              工程/地方营造建筑
            </span>
          </div>
        </div>
      </div>

      <div className="dynasty-radar-panel">
        <div className="dynasty-summary">
          <div className="dynasty-summary-top">
            <h4>{active.dynasty}</h4>
            {active.is_peak ? <span className="dynasty-peak-tag">成就高峰</span> : null}
          </div>
          <p>
            {active.dynasty}阶段共纳入 <strong>{Number(active.sample_count)}</strong> 处样本，代表城市集中在 <strong>{active.rep_city ?? "暂无"}</strong> 等地。
          </p>
          <p>
            建筑类型以 <strong>{getBuildingTypeV2(active.rep_type ?? "暂无")}</strong> 为主，平均 ACI 为 <strong>{(Number(active.avg_aci) || 0).toFixed(2)}</strong>。
          </p>
          {activeSystemStats ? (
            <p>
              在双系统视角下，这一阶段以 <strong>{activeDominantSystem}</strong> 为主，
              政治性建筑占比 <strong>{(activeSystemStats.political * 100).toFixed(0)}%</strong>，
              工程/地方营造建筑占比 <strong>{(activeSystemStats.engineering * 100).toFixed(0)}%</strong>。
            </p>
          ) : null}
          <p>
            这一阶段主要体现出 <strong>{formatPeriodLabel(active.period_role)}</strong> 的历史角色，也说明建筑成就会随制度中心与空间组织方式的变化而重组。
          </p>
        </div>

        <div className="dynasty-insight">
          <h4>{active.is_peak ? "高峰原因" : "阶段解释"}</h4>
          <p>{peakReason}</p>
        </div>

        <div className="dynasty-radar-header">
          <h4>四维雷达</h4>
          <span>历史延续 · 政治等级 · 建筑规模 · 空间集聚</span>
        </div>
        <EChart option={buildRadarOption(active)} style={{ height: 284 }} opts={{ renderer: "canvas" }} lazyUpdate />
      </div>

      <div className="dynasty-info-panel">
        <h3>典型建筑</h3>
        <p className="dynasty-info-intro">以下列出这一朝代较具代表性的建筑样本，用于说明该时期建筑成就的典型面貌与主要承载对象。</p>
        <div className="dynasty-building-list">
          {typicalBuildings.length ? (
            typicalBuildings.map((building) => (
              <button
                key={building.building_code}
                type="button"
                className={`dynasty-building-card ${selectedBuilding?.building_code === building.building_code ? "is-active" : ""}`}
                onClick={() => {
                  setClickedBuildingCode(building.building_code);
                  setIsDrawerOpen(true);
                }}
              >
                <div className="dynasty-building-top">
                  <h4>{building.name}</h4>
                  <div className="dynasty-building-actions">
                    <span>{toNumber(building.aci).toFixed(2)}</span>
                    <button
                      type="button"
                      className="dynasty-building-detail-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDetailBuilding(building);
                        setIsDetailOpen(true);
                      }}
                    >
                      详情
                    </button>
                  </div>
                </div>
                <p>{building.city_short ?? building.city}</p>
                <div className="dynasty-building-meta">
                  <strong>{getBuildingTypeV2(building.building_type_v2 ?? building.building_type)}</strong>
                  {toNumber(building.is_core_sample) ? <em>核心样本</em> : null}
                </div>
              </button>
            ))
          ) : (
            <p className="dynasty-info-intro">当前朝代暂无可展示的典型建筑样本。</p>
          )}
        </div>
      </div>

      {drawerContent}
      <BuildingDetailModal building={detailBuilding} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
    </div>
  );
}
