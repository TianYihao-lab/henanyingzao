import { useEffect, useMemo, useState } from "react";
import "./HenanMapReal.css";
import useHenanOutlineMap from "../../utils/useHenanOutlineMap";
import EChart from "../common/EChart";
import { CITY_COORDS, PENTAGON_SYMBOL, projectLonLatToGeo } from "../../utils/henanGeo";
import {
  getAciBandLabel,
  normalizeBuilding,
  toNumber,
  type BuildingRecord,
} from "../../utils/buildingViz";
import {
  getBuildingTypeV2,
  getBuildingSystem,
  getSystemDescription,
  SYSTEM_COLORS,
  SYSTEM_ORDER,
  TYPE_V2_COLORS,
  TYPE_V2_ORDER,
  type BuildingSystemKey,
} from "../../utils/buildingSystems";
import { publicPath } from "../../utils/publicPath";

interface CitySummaryItem {
  city: string;
  region?: string | null;
  city_role?: string | null;
  summary?: string | null;
  top_building?: string | null;
  dominant_type?: string | null;
}

interface CityPoint {
  cityShort: string;
  city: string;
  geo: [number, number];
  region: string;
  cityRole: string;
  summary: string;
  avgAci: number;
  sampleCount: number;
  displayType: string;
  displaySystem: BuildingSystemKey;
  metaDominantType: string;
  topBuilding: string;
}

interface BuildingSymbolPoint {
  cityShort: string;
  city: string;
  geo: [number, number];
  buildingName: string;
  buildingType: string;
  aci: number;
  sampleCount: number;
}

interface HenanMapRealProps {
  onCityNavigate?: (city: string) => void;
}

const DYNASTY_OPTIONS = ["全部", "新石器", "夏商周", "秦汉", "魏晋南北朝", "隋唐", "宋元", "明清"];
const TYPE_COLORS: Record<string, string> = TYPE_V2_COLORS;
const KNOWN_TYPES = [...TYPE_V2_ORDER];
const CITY_LABEL_LAYOUTS: Record<string, { position: "top" | "right" | "left" | "bottom"; distance: number }> = {
  安阳: { position: "top", distance: 14 },
  鹤壁: { position: "left", distance: 14 },
  郑州: { position: "left", distance: 12 },
  开封: { position: "right", distance: 12 },
  许昌: { position: "right", distance: 10 },
  漯河: { position: "left", distance: 10 },
};

function buildDisplayType(typeFilter: string, typeCount: Record<string, number>): string {
  if (typeFilter !== "全部" && KNOWN_TYPES.includes(typeFilter as (typeof TYPE_V2_ORDER)[number])) {
    return typeFilter;
  }

  return Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "综合样本";
}

function buildDisplaySystem(typeFilter: string, typeCount: Record<string, number>): BuildingSystemKey {
  if (typeFilter !== "全部") {
    return getBuildingSystem(typeFilter);
  }

  const systemCount = Object.entries(typeCount).reduce<Record<string, number>>((acc, [type, count]) => {
    const system = getBuildingSystem(type);
    acc[system] = (acc[system] ?? 0) + count;
    return acc;
  }, {});

  const topSystem = Object.entries(systemCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  return (topSystem as BuildingSystemKey) || "其他建筑";
}

function buildCityLabelSeries(items: CityPoint[]) {
  return {
    name: "city-labels",
    type: "scatter",
    coordinateSystem: "geo",
    z: 4,
    data: items.map((item) => ({
      name: item.cityShort,
      value: [...item.geo, item.sampleCount],
      label: {
        show: true,
        formatter: `${item.cityShort}\n${item.sampleCount}`,
        position: CITY_LABEL_LAYOUTS[item.cityShort]?.position ?? "top",
        distance: CITY_LABEL_LAYOUTS[item.cityShort]?.distance ?? 8,
        color: "#6f5b49",
        fontSize: 14,
        fontWeight: 700,
      },
    })),
    symbol: "circle",
    symbolSize: 2,
    itemStyle: {
      color: "rgba(0,0,0,0)",
      borderColor: "rgba(0,0,0,0)",
    },
    emphasis: { disabled: true },
    tooltip: { show: false },
    silent: true,
  };
}

function compareCityPriority(
  a: { cityShort: string; sampleCount: number; avgAci: number },
  b: { cityShort: string; sampleCount: number; avgAci: number },
) {
  return b.sampleCount - a.sampleCount || b.avgAci - a.avgAci || a.cityShort.localeCompare(b.cityShort, "zh-CN");
}

function getTypeLabel(record: Pick<BuildingRecord, "building_type" | "building_type_v2">): string {
  return getBuildingTypeV2(record.building_type_v2 ?? record.building_type);
}

function getTypeSymbol(type: string) {
  if (type === "都城/城址") return "circle";
  if (type === "官署/治理") return "rect";
  if (type === "礼制/公共建筑") return "roundRect";
  if (type === "工程/生产设施") return "triangle";
  if (type === "桥梁/交通") return "diamond";
  if (type === "民居/会馆/聚落") return PENTAGON_SYMBOL;
  return "circle";
}

export default function HenanMapReal({ onCityNavigate }: HenanMapRealProps) {
  const { ready: mapReady, error: mapError } = useHenanOutlineMap();
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [cityMeta, setCityMeta] = useState<Record<string, CitySummaryItem>>({});
  const [dynastyFilter, setDynastyFilter] = useState("全部");
  const [systemFilter, setSystemFilter] = useState<"全部" | BuildingSystemKey>("全部");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetch(publicPath("data/buildings_processed.json")).then((res) => {
        if (!res.ok) throw new Error("buildings_processed.json 加载失败");
        return res.json();
      }),
      fetch(publicPath("data/city_summary.json")).then((res) => {
        if (!res.ok) throw new Error("city_summary.json 加载失败");
        return res.json();
      }),
    ])
      .then(([rawBuildings, rawCities]: [BuildingRecord[], CitySummaryItem[]]) => {
        if (!mounted) return;

        const normalized = rawBuildings
          .map(normalizeBuilding)
          .filter((item) => item.city_short && CITY_COORDS[item.city_short]);

        setBuildings(normalized);
        setCityMeta(
          rawCities.reduce<Record<string, CitySummaryItem>>((acc, item) => {
            acc[item.city] = item;
            return acc;
          }, {}),
        );
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

  const typeOptions = useMemo(() => {
    const source =
      systemFilter === "全部"
        ? buildings
        : buildings.filter((item) => getBuildingSystem(getTypeLabel(item)) === systemFilter);

    return ["全部", ...Array.from(new Set(source.map((item) => getTypeLabel(item)))).filter(Boolean)];
  }, [buildings, systemFilter]);

  useEffect(() => {
    if (typeFilter !== "全部" && !typeOptions.includes(typeFilter)) {
      setTypeFilter("全部");
    }
  }, [typeFilter, typeOptions]);

  const filteredBuildings = useMemo(
    () =>
      buildings.filter((item) => {
        const dynastyOk = dynastyFilter === "全部" || item.dynasty_group === dynastyFilter;
        const typeLabel = getTypeLabel(item);
        const systemOk = systemFilter === "全部" || getBuildingSystem(typeLabel) === systemFilter;
        const typeOk = typeFilter === "全部" || typeLabel === typeFilter;
        return dynastyOk && systemOk && typeOk;
      }),
    [buildings, dynastyFilter, systemFilter, typeFilter],
  );

  const cityPoints = useMemo<CityPoint[]>(() => {
    const groups = new Map<string, BuildingRecord[]>();

    filteredBuildings.forEach((item) => {
      const key = item.city_short ?? "";
      if (!CITY_COORDS[key]) return;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });

    return Array.from(groups.entries())
      .map(([cityShort, list]) => {
        const meta = cityMeta[cityShort];
        const typeCount = list.reduce<Record<string, number>>((acc, item) => {
          const typeLabel = getTypeLabel(item);
          acc[typeLabel] = (acc[typeLabel] ?? 0) + 1;
          return acc;
        }, {});
        const dominantType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "综合样本";
        const avgAci = list.reduce((sum, item) => sum + toNumber(item.aci), 0) / list.length;
        const topBuilding = [...list].sort((a, b) => toNumber(b.aci) - toNumber(a.aci))[0]?.name ?? "暂无";

        return {
          cityShort,
          city: list[0].city,
          geo: CITY_COORDS[cityShort],
          region: meta?.region ?? "中原腹地",
          cityRole: meta?.city_role ?? getAciBandLabel(avgAci),
          summary:
            meta?.summary ??
            `${cityShort}在当前筛选条件下保留了较完整的建筑样本，可作为观察区域成就结构的窗口。`,
          avgAci,
          sampleCount: list.length,
          displayType: buildDisplayType(typeFilter, typeCount),
          displaySystem: buildDisplaySystem(typeFilter, typeCount),
          metaDominantType: meta?.dominant_type ?? dominantType,
          topBuilding: meta?.top_building ?? topBuilding,
        };
      })
      .sort(compareCityPriority);
  }, [filteredBuildings, cityMeta, typeFilter]);

  const overallTop = useMemo(() => cityPoints.slice().sort(compareCityPriority).slice(0, 5), [cityPoints]);

  const systemSummary = useMemo(() => {
    const counts = filteredBuildings.reduce<Record<string, number>>((acc, item) => {
      const system = getBuildingSystem(getTypeLabel(item));
      acc[system] = (acc[system] ?? 0) + 1;
      return acc;
    }, {});

    return SYSTEM_ORDER.map((system) => ({
      system,
      count: counts[system] ?? 0,
      share: filteredBuildings.length ? (counts[system] ?? 0) / filteredBuildings.length : 0,
      description: getSystemDescription(system),
    }));
  }, [filteredBuildings]);

  const typeCounts = useMemo(
    () =>
      filteredBuildings.reduce<Record<string, number>>((acc, item) => {
        const typeLabel = getTypeLabel(item);
        acc[typeLabel] = (acc[typeLabel] ?? 0) + 1;
        return acc;
      }, {}),
    [filteredBuildings],
  );

  const systemCounts = useMemo(
    () =>
      filteredBuildings.reduce<Record<string, number>>((acc, item) => {
        const system = getBuildingSystem(getTypeLabel(item));
        acc[system] = (acc[system] ?? 0) + 1;
        return acc;
      }, {}),
    [filteredBuildings],
  );

  const dominantType = useMemo(() => {
    if (typeFilter !== "全部") return typeFilter;
    return Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "综合类型";
  }, [typeCounts, typeFilter]);

  const dominantSystem = useMemo<BuildingSystemKey | "综合系统">(() => {
    if (typeFilter !== "全部") return getBuildingSystem(typeFilter);
    if (systemFilter !== "全部") return systemFilter;
    return (Object.entries(systemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as BuildingSystemKey) ?? "综合系统";
  }, [systemCounts, systemFilter, typeFilter]);

  const aggregateAvgAci = useMemo(() => {
    if (!filteredBuildings.length) return 0;
    return filteredBuildings.reduce((sum, item) => sum + toNumber(item.aci), 0) / filteredBuildings.length;
  }, [filteredBuildings]);

  const topBuilding = useMemo(() => {
    return [...filteredBuildings].sort((a, b) => toNumber(b.aci) - toNumber(a.aci))[0] ?? null;
  }, [filteredBuildings]);

  const cityDistributionData = useMemo(
    () =>
      cityPoints
        .slice()
        .sort(compareCityPriority)
        .slice(0, 6)
        .map((item) => ({ name: item.cityShort, value: item.sampleCount })),
    [cityPoints],
  );

  const sideTitle = useMemo(() => {
    const labels = [dynastyFilter, systemFilter, typeFilter].filter((item) => item !== "全部");
    return labels.length ? labels.join(" · ") : "全时段总览";
  }, [dynastyFilter, systemFilter, typeFilter]);

  const sideSummary = useMemo(() => {
    if (!filteredBuildings.length) {
      return "当前筛选下暂未形成有效样本。";
    }

    const focusParts: string[] = [];
    if (dynastyFilter !== "全部") focusParts.push(`朝代聚焦在${dynastyFilter}`);
    if (systemFilter !== "全部") focusParts.push(`系统收束到${systemFilter}`);
    if (typeFilter !== "全部") focusParts.push(`类型进一步锁定为${typeFilter}`);

    const opening = focusParts.length
      ? `${focusParts.join("，")}。`
      : "当前从全时段总览视角观察河南古代建筑文明的空间分布。";

    const cityLine = cityDistributionData.length
      ? `当前样本最集中的城市依次是 ${cityDistributionData.map((item) => `${item.name}（${item.value}）`).join("、")}。`
      : "当前筛选下尚未形成稳定的城市集聚序列。";

    return `${opening}这一视角共覆盖 ${filteredBuildings.length} 处样本、${cityPoints.length} 个城市，平均 ACI 为 ${aggregateAvgAci.toFixed(2)}。${cityLine}`;
  }, [aggregateAvgAci, cityDistributionData, cityPoints.length, dynastyFilter, filteredBuildings.length, systemFilter, typeFilter]);

  const filteredInsight = useMemo(() => {
    if (!cityPoints.length || !filteredBuildings.length) {
      return "当前筛选条件下样本不足，暂时无法形成稳定的空间判断。";
    }

    const regionCounts = cityPoints.reduce<Record<string, number>>((acc, item) => {
      acc[item.region] = (acc[item.region] ?? 0) + item.sampleCount;
      return acc;
    }, {});
    const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "中原腹地";
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "综合样本";
    const topSystem = Object.entries(systemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "综合系统";
    const topCities = overallTop.map((item) => item.cityShort).join("、");

    if (dynastyFilter === "全部" && systemFilter === "全部" && typeFilter === "全部") {
      return `全样本总览下，建筑文明样本主要集中在${topRegion}，并由${topCities}构成最清晰的城市集聚带。其中${topSystem}占比最高，${topType}是当前最突出的细分类别。`;
    }

    return `在当前筛选视角下，样本继续向${topRegion}收束，${topCities}构成最稳定的观察轴线；系统结构上以${topSystem}为主，类型表现则由${topType}最为突出。`;
  }, [cityPoints, filteredBuildings, dynastyFilter, overallTop, systemCounts, systemFilter, typeCounts, typeFilter]);

  const groupedSeries = useMemo(() => {
    const showAllSymbols = dynastyFilter === "全部" && typeFilter === "全部";

    const buildCityScatter = (name: string, items: CityPoint[], symbol: string, color: string) => ({
      name,
      type: "scatter",
      coordinateSystem: "geo",
      z: 3,
      data: items.map((item) => ({
        name: item.cityShort,
        value: [...item.geo, item.sampleCount],
        label: {
          show: true,
          formatter: `${item.cityShort}\n${item.sampleCount}`,
          position: CITY_LABEL_LAYOUTS[item.cityShort]?.position ?? "top",
          distance: CITY_LABEL_LAYOUTS[item.cityShort]?.distance ?? 8,
          color: "#6f5b49",
          fontSize: 14,
          fontWeight: 700,
        },
      })),
      symbol,
      symbolSize: (val: number[]) => 22 + Math.min(val[2] || 1, 8) * 3.2,
      itemStyle: {
        color,
        borderColor: "#fbf3e8",
        borderWidth: 2,
        shadowBlur: 0,
        shadowColor: color,
      },
      emphasis: { scale: 1.08, itemStyle: { shadowBlur: 6, shadowColor: color } },
    });

    const buildBuildingScatter = (name: string, items: BuildingSymbolPoint[], symbol: string, color: string) => ({
      name,
      type: "scatter",
      coordinateSystem: "geo",
      z: 3,
      data: items.map((item) => ({
        name: item.cityShort,
        value: [...item.geo, item.sampleCount],
        buildingName: item.buildingName,
        buildingType: item.buildingType,
        aci: item.aci,
      })),
      symbol,
      symbolSize: 16,
      itemStyle: {
        color,
        borderColor: "#fbf3e8",
        borderWidth: 1.6,
        shadowBlur: 0,
        shadowColor: color,
      },
      label: { show: false },
      emphasis: { scale: 1.06, itemStyle: { shadowBlur: 6, shadowColor: color } },
    });

    if (showAllSymbols) {
      const groupedBuildings = new Map<string, BuildingRecord[]>();

      filteredBuildings.forEach((item) => {
        const key = item.city_short ?? "";
        if (!CITY_COORDS[key]) return;
        groupedBuildings.set(key, [...(groupedBuildings.get(key) ?? []), item]);
      });

      const offsetBuildingPoints: BuildingSymbolPoint[] = Array.from(groupedBuildings.entries()).flatMap(
        ([cityShort, list]) => {
          const baseGeo = CITY_COORDS[cityShort];
          const sortedList = [...list].sort((a, b) => toNumber(b.aci) - toNumber(a.aci));

          return sortedList.map((building, index) => {
            const ring = Math.floor(index / 6);
            const slot = index % 6;
            const radius = 0.17 + ring * 0.08;
            const angle = (Math.PI * 2 * slot) / 6 - Math.PI / 2;
            const lonOffset = Math.cos(angle) * radius;
            const latOffset = Math.sin(angle) * radius * 0.72;

            // 转换为 GCJ-02 坐标系以修正偏移
            const [correctedLon, correctedLat] = projectLonLatToGeo(
              baseGeo[0] + lonOffset,
              baseGeo[1] + latOffset
            );

            return {
              cityShort,
              city: building.city,
              geo: [correctedLon, correctedLat],
              buildingName: building.name,
              buildingType: getTypeLabel(building),
              aci: toNumber(building.aci),
              sampleCount: list.length,
            };
          });
        },
      );

      return [
        ...TYPE_V2_ORDER.map((type: (typeof TYPE_V2_ORDER)[number]) =>
          buildBuildingScatter(
            type,
            offsetBuildingPoints.filter((item) => item.buildingType === type),
            getTypeSymbol(type),
            TYPE_COLORS[type],
          ),
        ),
        buildBuildingScatter(
          "其他",
          offsetBuildingPoints.filter((item) => !KNOWN_TYPES.includes(item.buildingType as (typeof TYPE_V2_ORDER)[number])),
          "circle",
          "#8f6842",
        ),
        buildCityLabelSeries(cityPoints),
      ];
    }

    return [
      ...TYPE_V2_ORDER.map((type: (typeof TYPE_V2_ORDER)[number]) =>
        buildCityScatter(
          type,
          cityPoints.filter((item) => item.displayType === type),
          getTypeSymbol(type),
          TYPE_COLORS[type],
        ),
      ),
      buildCityScatter(
        "其他",
        cityPoints.filter((item) => !KNOWN_TYPES.includes(item.displayType as (typeof TYPE_V2_ORDER)[number])),
        "circle",
        "#8f6842",
      ),
    ];
  }, [cityPoints, dynastyFilter, filteredBuildings, typeFilter]);

  const option = useMemo(
    () => ({
      animation: false,
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params: {
          seriesName?: string;
          seriesType?: string;
          name?: string;
          value?: number[];
          data?: { buildingName?: string; buildingType?: string; aci?: number };
        }) => {
          if (params.seriesName === "city-labels") {
            return "";
          }

          if (params.seriesType === "scatter" && params.data?.buildingName) {
            return `${params.data.buildingName}<br/>${params.name} · ${params.data.buildingType}<br/>ACI：${params.data.aci?.toFixed(2) ?? "0.00"}`;
          }

          return params.seriesType === "scatter"
            ? `${params.name}<br/>样本数：${params.value?.[2] ?? 0}`
            : params.name ?? "";
        },
      },
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
      series: groupedSeries,
    }),
    [groupedSeries],
  );

  const onEvents = useMemo(
    () => ({
      click: (params: { seriesType?: string; seriesName?: string; name?: string }) => {
        if (params?.seriesType === "scatter" && params?.seriesName !== "city-labels" && params?.name) {
          onCityNavigate?.(params.name);
        }
      },
    }),
    [onCityNavigate],
  );

  if (loading || !mapReady) {
    return <div className="henan-real-loading">空间分布数据正在绘制中...</div>;
  }

  if (error || mapError) {
    return <div className="henan-real-error">{error || mapError}</div>;
  }

  return (
    <div className="henan-real-card">
      <div className="henan-real-stage">
        <div className="henan-real-stage-title">
          <h3>河南古代建筑文明空间分布</h3>
        </div>

        <div className="henan-real-controls">
          <div className="henan-real-filter-group">
            <span>朝代</span>
            <div className="henan-real-chip-row">
              {DYNASTY_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`henan-real-chip ${dynastyFilter === item ? "active" : ""}`}
                  onClick={() => setDynastyFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="henan-real-filter-group">
            <span>系统</span>
            <div className="henan-real-chip-row">
              {(["全部", ...SYSTEM_ORDER] as Array<"全部" | BuildingSystemKey>).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`henan-real-chip ${systemFilter === item ? "active" : ""}`}
                  onClick={() => setSystemFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="henan-real-filter-group">
            <span>类型</span>
            <div className="henan-real-chip-row">
              {typeOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`henan-real-chip ${typeFilter === item ? "active" : ""}`}
                  onClick={() => setTypeFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="henan-real-stage-map">
          <EChart
            option={option}
            onEvents={onEvents}
            style={{ width: "100%", height: "580px" }}
            opts={{ renderer: "canvas" }}
            lazyUpdate
            notMerge
          />
        </div>

        <div className="henan-real-system-band">
          {systemSummary.map((item) => (
            <div key={item.system} className="henan-real-system-pill">
              <span
                className="henan-real-system-pill__dot"
                style={{ backgroundColor: SYSTEM_COLORS[item.system] }}
              />
              <div className="henan-real-system-pill__content">
                <strong>{item.system}</strong>
                <span>
                  {item.count} 处样本 · 占比 {(item.share * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="henan-real-legend">
          {TYPE_V2_ORDER.map((type) => {
            const symbolClass =
              type === "都城/城址"
                ? "circle"
                : type === "官署/治理"
                  ? "square"
                  : type === "礼制/公共建筑"
                    ? "roundrect"
                    : type === "工程/生产设施"
                      ? "triangle"
                      : type === "桥梁/交通"
                        ? "diamond"
                        : "pentagon";

            return (
              <div key={type}>
                <span className={`dot ${symbolClass}`} style={{ background: TYPE_COLORS[type] }} />
                {type}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="henan-real-side">
        <div className="henan-real-side-card">
          <h3>{sideTitle}</h3>
          {filteredBuildings.length ? (
            <>
              <div className="henan-real-metric">
                <span>建筑样本:</span>
                <strong>{filteredBuildings.length}</strong>
              </div>
              <div className="henan-real-metric">
                <span>覆盖城市:</span>
                <strong>{cityPoints.length}</strong>
              </div>
              <div className="henan-real-metric">
                <span>平均 ACI:</span>
                <strong>{aggregateAvgAci.toFixed(2)}</strong>
              </div>
              <div className="henan-real-metric">
                <span>主导系统:</span>
                <strong>{dominantSystem}</strong>
              </div>
              <div className="henan-real-metric">
                <span>主导类型:</span>
                <strong>{dominantType}</strong>
              </div>
              <div className="henan-real-summary">
                <p>{sideSummary}</p>
                {topBuilding ? (
                  <p>
                    当前最高代表样本为 <strong>{topBuilding.name}</strong>，位于 <strong>{topBuilding.city_short ?? topBuilding.city}</strong>，
                    属于 <strong>{getTypeLabel(topBuilding)}</strong>，ACI 为 <strong>{toNumber(topBuilding.aci).toFixed(2)}</strong>。
                  </p>
                ) : null}
              </div>
              {cityDistributionData.length > 0 ? (
                <div className="henan-real-dynasty-chart">
                  <h5>城市样本分布</h5>
                  <svg viewBox={`0 0 260 ${cityDistributionData.length * 22 + 10}`} className="henan-real-dynasty-svg">
                    {cityDistributionData.map((bar, idx) => {
                      const maxVal = Math.max(...cityDistributionData.map((item) => item.value), 1);
                      const labelX = 74;
                      const barX = 84;
                      const barMaxWidth = 130;
                      const barW = (bar.value / maxVal) * barMaxWidth;
                      const y = idx * 22 + 8;
                      return (
                        <g key={bar.name}>
                          <text x={labelX} y={y + 10} textAnchor="end" className="henan-real-dynasty-label">
                            {bar.name}
                          </text>
                          <rect x={barX} y={y + 2} width={barW} height={10} rx={5} />
                          <text x={barX + barW + 8} y={y + 10} className="henan-real-dynasty-value">
                            {bar.value}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : null}
            </>
          ) : (
            <p>当前筛选下暂无建筑样本。</p>
          )}
        </div>

        <div className="henan-real-side-card highlight">
          <h4>本幕发现</h4>
          {filteredBuildings.length ? (
            <>
              <p>{filteredInsight}</p>
              <ul>
                <li>
                  本视角共覆盖 <strong>{filteredBuildings.length}</strong> 处样本，<strong>{cityPoints.length}</strong> 个城市。
                </li>
                <li>
                  高值核心带主要分布在 <strong>{overallTop.slice(0, 3).map((item) => item.cityShort).join("、") || "省域核心城市"}</strong> 一线。
                </li>
                <li>
                  当前最突出的系统为 <strong>{dominantSystem}</strong>，其核心细分类别是 <strong>{dominantType}</strong>。
                </li>
              </ul>
            </>
          ) : (
            <p>等待数据加载。</p>
          )}
        </div>
      </aside>
    </div>
  );
}
