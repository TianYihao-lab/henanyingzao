import { useEffect, useMemo, useState } from "react";
import "./CivilizationTrajectory.css";
import { toNumber } from "../../utils/buildingViz";
import { projectLonLatToGeo } from "../../utils/henanGeo";
import useHenanOutlineMap from "../../utils/useHenanOutlineMap";
import { formatDisplayParagraph } from "../../utils/displayText";
import EChart from "../common/EChart";
import { publicPath } from "../../utils/publicPath";

interface TrajectoryPoint {
  period: string;
  center_lon: number | string;
  center_lat: number | string;
  weight?: number | string;
  summary?: string | null;
  period_role?: string | null;
}

interface ProjectedTrajectoryPoint extends TrajectoryPoint {
  value: [number, number, number];
}

function normalizePeriod(period: string) {
  if (period.includes("新石器")) return "新石器";
  if (period.includes("夏") || period.includes("商") || period.includes("周")) return "夏商周";
  if (period.includes("秦") || period.includes("汉")) return "秦汉";
  if (period.includes("魏") || period.includes("晋") || period.includes("南北朝")) return "魏晋南北朝";
  if (period.includes("隋") || period.includes("唐")) return "隋唐";
  if (period.includes("宋") || period.includes("元")) return "宋元";
  if (period.includes("明") || period.includes("清")) return "明清";
  return period;
}

function getDirectionLabel(from: [number, number, number], to: [number, number, number]) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const horizontal = dx > 8 ? "东" : dx < -8 ? "西" : "";
  const vertical = dy > 8 ? "南" : dy < -8 ? "北" : "";

  if (!horizontal && !vertical) return "省域中部附近";
  if (horizontal && vertical) return `${vertical}${horizontal}方向`;
  return `${horizontal || vertical}向`;
}

function getWeightLevel(weight: number) {
  if (weight >= 10) return "高强度汇聚";
  if (weight >= 6) return "稳定集聚";
  if (weight >= 3) return "阶段性聚焦";
  return "低密度显现";
}

function getStageSummary(point: TrajectoryPoint) {
  return formatDisplayParagraph(point.summary || `${point.period}阶段的建筑成就特征正在补充中。`);
}

function buildStageRoleNarrative(
  current: ProjectedTrajectoryPoint,
  previous: ProjectedTrajectoryPoint | null,
) {
  const period = normalizePeriod(current.period);
  const direction = previous ? getDirectionLabel(previous.value, current.value) : "中原腹地";

  switch (period) {
    case "新石器":
      return "这一阶段更像文明星轨的起笔，重心首先落在早期聚落和中心性遗址上，说明中原建筑文明最先从聚落组织和空间秩序里长出来。";
    case "夏商周":
      return "这一阶段的轨迹开始向王都与礼制中心聚拢，说明建筑重心已经不只是居住聚落，而是在为早期国家秩序和都城结构服务。";
    case "秦汉":
      return `这一阶段重心向${direction}延展，体现出帝国秩序下更大尺度的空间投射，建筑成就开始随着统一王朝的治理网络一起展开。`;
    case "魏晋南北朝":
      return "这一阶段样本密度明显收缩，轨迹更像保留下来的关键节点，说明建筑文明没有完全中断，而是以更稀疏但更集中的方式延续。";
    case "隋唐":
      return "这一阶段重新形成较强聚焦，轨迹指向都城秩序、交通组织与公共工程同步抬升的局面，是中原建筑成就再次显著加速的时期。";
    case "宋元":
      return "这一阶段的重心带有更鲜明的城市性和流动性，说明建筑成就不再只围绕单一政治中心，而开始与商业节点和复合城市结构一起展开。";
    case "明清":
      return "这一阶段的权重再次升高，但表达方式更偏向长期沉淀与地方扩散，说明中原建筑文明进入了以存续、修整和地方经营为主的成熟阶段。";
    default:
      return current.period_role || "该阶段的角色说明正在补充中。";
  }
}

function buildShiftNarrative(
  current: ProjectedTrajectoryPoint,
  previous: ProjectedTrajectoryPoint | null,
) {
  const weight = toNumber(current.weight);

  if (!previous) {
    return `${current.period}是这条轨迹的起点，当前重心处于${getWeightLevel(weight)}状态，说明最早的建筑成就已经在中原腹地形成可辨识的集聚。`;
  }

  const previousWeight = toNumber(previous.weight);
  const direction = getDirectionLabel(previous.value, current.value);
  const delta = weight - previousWeight;
  const trend =
    delta > 1
      ? "重心强度明显上升"
      : delta < -1
        ? "重心强度有所回落"
        : "重心强度整体保持平稳";

  return `相较上一阶段，建筑成就重心向${direction}迁移，${trend}，当前处于${getWeightLevel(weight)}状态。`;
}

function buildFindingNarrative(points: ProjectedTrajectoryPoint[]) {
  if (!points.length) return "暂无可解释的轨迹发现。";

  const first = points[0];
  const last = points[points.length - 1];
  const strongest = points.reduce((best, item) =>
    toNumber(item.weight) > toNumber(best.weight) ? item : best,
  );
  const overallDirection =
    points.length > 1 ? getDirectionLabel(first.value, last.value) : "省域中部附近";

  return `从 ${first.period} 到 ${last.period}，建筑成就重心整体向${overallDirection}调整，其中 ${strongest.period} 的汇聚强度最高，说明文明星轨并不是平均铺开，而是在关键阶段出现更明确的中心收束。`;
}

function getPointVisual(index: number, activeIndex: number, weight: number, isFinished: boolean) {
  if (index === activeIndex) {
    return {
      symbolSize: 24,
      color: "#8f4721",
      opacity: 1,
      shadowBlur: 10,
      labelColor: "#6e5c49",
      labelFontWeight: 700,
    };
  }

  if (isFinished) {
    return {
      symbolSize: 12 + Math.min(weight * 0.08, 3),
      color: "rgba(169,124,88,0.26)",
      opacity: 0.26,
      shadowBlur: 0,
      labelColor: "rgba(110,92,73,0.26)",
      labelFontWeight: 500,
    };
  }

  if (index === activeIndex - 1) {
    return {
      symbolSize: 18 + Math.min(weight * 0.14, 6),
      color: "#b97b49",
      opacity: 0.8,
      shadowBlur: 6,
      labelColor: "rgba(110,92,73,0.86)",
      labelFontWeight: 600,
    };
  }

  return {
    symbolSize: 13 + Math.min(weight * 0.1, 4),
    color: "rgba(196,135,82,0.42)",
    opacity: 0.42,
    shadowBlur: 0,
    labelColor: "rgba(110,92,73,0.42)",
    labelFontWeight: 500,
  };
}

export default function CivilizationTrajectory() {
  const { ready: mapReady, error: mapError } = useHenanOutlineMap();
  const [points, setPoints] = useState<TrajectoryPoint[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(publicPath("data/trajectory.json"))
      .then((res) => {
        if (!res.ok) throw new Error("trajectory.json 加载失败");
        return res.json();
      })
      .then((rows: TrajectoryPoint[]) => {
        if (mounted) setPoints(rows);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!playing || points.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= points.length - 1) {
          window.clearInterval(timer);
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [playing, points.length]);

  const projected = useMemo<ProjectedTrajectoryPoint[]>(
    () =>
      points.map((point) => ({
        ...point,
        value: [
          ...projectLonLatToGeo(toNumber(point.center_lon), toNumber(point.center_lat)),
          toNumber(point.weight),
        ] as [number, number, number],
      })),
    [points],
  );

  const active = projected[activeIndex];
  const previous = activeIndex > 0 ? projected[activeIndex - 1] : null;
  const shown = useMemo(() => projected.slice(0, activeIndex + 1), [projected, activeIndex]);
  const isFinished = points.length > 0 && activeIndex === points.length - 1;

  const option = useMemo(
    () => ({
      animationDuration: 500,
      backgroundColor: "transparent",
      tooltip: { show: false },
      geo: {
        map: "henan-outline",
        roam: false,
        layoutCenter: ["50%", "46%"],
        layoutSize: "84%",
        itemStyle: {
          areaColor: "#f7eddf",
          borderColor: "#d0af94",
          borderWidth: 1.8,
        },
        emphasis: { disabled: true },
        silent: true,
      },
      series: [
        {
          type: "lines",
          coordinateSystem: "geo",
          z: 1,
          data:
            shown.length > 2
              ? [{ coords: shown.slice(0, -1).map((item) => [item.value[0], item.value[1]]) }]
              : [],
          polyline: true,
          lineStyle: {
            color: "rgba(196,135,82,0.36)",
            width: 3,
            opacity: 1,
            cap: "round",
            join: "round",
          },
          silent: true,
        },
        {
          type: "lines",
          coordinateSystem: "geo",
          z: 2,
          data:
            shown.length > 1
              ? [{
                  coords: shown.slice(Math.max(0, shown.length - 2)).map((item) => [item.value[0], item.value[1]]),
                }]
              : [],
          polyline: true,
          lineStyle: {
            color: "#c48752",
            width: 4,
            opacity: 0.92,
            cap: "round",
            join: "round",
          },
          effect: {
            show: true,
            period: 4,
            trailLength: 0.35,
            symbol: "arrow",
            symbolSize: 6,
            color: "#c48752",
          },
          silent: true,
        },
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          z: 3,
          data: shown.map((item, index) => {
            const visual = getPointVisual(index, activeIndex, item.value[2], isFinished);
            return {
              name: item.period,
              value: item.value,
              symbolSize: visual.symbolSize,
              itemStyle: {
                color: visual.color,
                opacity: visual.opacity,
                shadowBlur: visual.shadowBlur,
                shadowColor: "rgba(143,71,33,0.18)",
                borderColor: "rgba(248,239,226,0.9)",
                borderWidth: index === activeIndex ? 2 : 1.5,
              },
              label: {
                show: true,
                formatter: item.period,
                position: "top",
                distance: 8,
                color: visual.labelColor,
                fontSize: 14,
                fontWeight: visual.labelFontWeight,
              },
            };
          }),
          rippleEffect: { scale: 3.0, brushType: "stroke" },
          silent: true,
        },
      ],
    }),
    [shown, activeIndex, isFinished],
  );

  if (loading || !mapReady) return <div className="dynasty-loading">文明星轨数据正在推演…</div>;
  if (error || mapError) return <div className="dynasty-loading">{error || mapError}</div>;
  if (!active) return <div className="dynasty-loading">暂无可展示的重心轨迹。</div>;

  const activeSummary = getStageSummary(active);
  const roleNarrative = buildStageRoleNarrative(active, previous);
  const shiftNarrative = buildShiftNarrative(active, previous);
  const findingNarrative = buildFindingNarrative(projected);

  return (
    <div className="trajectory-card">
      <div className="trajectory-visual-panel">
        <div className="trajectory-visual-header">
          <h3>拖动时间，追踪建筑成就重心的迁移路径</h3>
        </div>

        <div className="trajectory-canvas-wrap">
          <EChart option={option} style={{ width: "100%", height: "560px" }} opts={{ renderer: "canvas" }} lazyUpdate />
        </div>

        <div className={`trajectory-live-summary ${playing ? "is-playing" : ""}`}>
          <strong>{active.period}</strong>
          <p>{activeSummary}</p>
        </div>

        <div className="trajectory-controls">
          <button type="button" className={`trajectory-control-btn ${playing ? "active" : ""}`} onClick={() => setPlaying((prev) => !prev)}>
            {playing ? "暂停演示" : "自动演示"}
          </button>
          <button type="button" className="trajectory-control-btn" onClick={() => setActiveIndex(0)}>
            回到起点
          </button>
          <button type="button" className="trajectory-control-btn" onClick={() => setActiveIndex(points.length - 1)}>
            跳到终点
          </button>
        </div>

        <div className="trajectory-slider-wrap">
          <label htmlFor="trajectory-range">历史阶段</label>
          <input
            id="trajectory-range"
            type="range"
            min={0}
            max={Math.max(points.length - 1, 0)}
            step={1}
            value={activeIndex}
            onChange={(e) => {
              setPlaying(false);
              setActiveIndex(Number(e.target.value));
            }}
          />
          <div className="trajectory-periods">
            {points.map((point, idx) => (
              <button
                key={point.period}
                type="button"
                className={`trajectory-period-chip ${idx === activeIndex ? "active" : ""}`}
                onClick={() => {
                  setPlaying(false);
                  setActiveIndex(idx);
                }}
              >
                {point.period}
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="trajectory-side">
        <div className="trajectory-summary-card">
          <h3>{active.period}</h3>
          <p>{activeSummary}</p>
        </div>

        <div className="trajectory-insight-card">
          <h4>阶段说明</h4>
          <p>{roleNarrative}</p>
        </div>

        <div className="trajectory-insight-card">
          <h4>迁移判断</h4>
          <p>{shiftNarrative}</p>
        </div>

        <div className="trajectory-insight-card">
          <h4>整体发现</h4>
          <p>{findingNarrative}</p>
        </div>
      </aside>
    </div>
  );
}
