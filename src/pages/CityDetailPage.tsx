import { useEffect, useMemo, useState } from "react";
import { getMap } from "../lib/echarts";
import "./CityDetailPage.css";
import { normalizeBuilding, toNumber, type BuildingRecord } from "../utils/buildingViz";
import BuildingDetailModal from "../components/common/BuildingDetailModal";
import EChart from "../components/common/EChart";
import useCityMap from "../utils/useCityMap";
import useHenanCitiesMap from "../utils/useHenanCitiesMap";
import { CITY_COORDS, projectLonLatToGeo } from "../utils/henanGeo";
import {
  getBuildingSystem,
  getBuildingTypeV2,
  SYSTEM_COLORS,
  SYSTEM_ORDER,
  TYPE_V2_COLORS,
} from "../utils/buildingSystems";
import { formatDisplayParagraph } from "../utils/displayText";
import { publicPath } from "../utils/publicPath";

interface CityDetailPageProps {
  cityName: string;
  onBack: () => void;
  onCityChange?: (city: string) => void;
}

const TYPE_COLORS: Record<string, string> = TYPE_V2_COLORS;
const LABEL_POSITIONS = ["right", "top", "bottom", "left"] as const;
type LabelPosition = (typeof LABEL_POSITIONS)[number];
/*
  "皇宫/都城": "#c58955",
  "官府": "#5a8a6e",
  "桥梁": "#5a7a9a",
  "民居": "#a46a6a",
};

*/
function getTypeLabel(building: Pick<BuildingRecord, "building_type" | "building_type_v2">) {
  return getBuildingTypeV2(building.building_type_v2 ?? building.building_type);
}

function getGeoJsonBounds(geoJson: unknown): { minLon: number; maxLon: number; minLat: number; maxLat: number } | null {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  const processCoord = (coord: number[]) => {
    const [lon, lat] = coord;
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  };
  const processGeometry = (geom: { type?: string; coordinates?: unknown; geometries?: unknown[] }) => {
    if (!geom) return;
    const type = geom.type;
    const coords = geom.coordinates;
    if (type === "Point") processCoord(coords as number[]);
    else if (type === "MultiPoint" || type === "LineString") (coords as number[][]).forEach(processCoord);
    else if (type === "MultiLineString" || type === "Polygon") (coords as number[][][]).forEach((ring) => ring.forEach(processCoord));
    else if (type === "MultiPolygon") (coords as number[][][][]).forEach((poly) => poly.forEach((ring) => ring.forEach(processCoord)));
    else if (type === "GeometryCollection") ((geom.geometries || []) as { type?: string; coordinates?: unknown; geometries?: unknown[] }[]).forEach(processGeometry);
  };
  const gj = geoJson as { type?: string; features?: Array<{ geometry?: unknown }>; geometry?: unknown };
  if (gj.type === "FeatureCollection") {
    (gj.features || []).forEach((f) => processGeometry(f.geometry as { type?: string; coordinates?: unknown; geometries?: unknown[] }));
  } else if (gj.type === "Feature") {
    processGeometry(gj.geometry as { type?: string; coordinates?: unknown; geometries?: unknown[] });
  } else {
    processGeometry(gj as { type?: string; coordinates?: unknown; geometries?: unknown[] });
  }
  if (minLon === Infinity) return null;
  return { minLon, maxLon, minLat, maxLat };
}

function cityNameFromGeo(name: string): string {
  return name.replace(/[?\uFF1F]+$/u, "").replace(/\u5E02$/u, "");
}

function getBaseLabelPosition(
  lon: number,
  lat: number,
  centerLon: number,
  centerLat: number,
): LabelPosition {
  const dx = lon - centerLon;
  const dy = lat - centerLat;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }

  return dy >= 0 ? "top" : "bottom";
}

function getLabelSequence(base: LabelPosition): LabelPosition[] {
  switch (base) {
    case "right":
      return ["right", "top", "bottom", "left"];
    case "left":
      return ["left", "bottom", "top", "right"];
    case "top":
      return ["top", "right", "left", "bottom"];
    case "bottom":
      return ["bottom", "left", "right", "top"];
    default:
      return ["right", "top", "bottom", "left"];
  }
}

function getCrowdClusterKey(lon: number, lat: number) {
  return `${Math.round(lon * 80)}:${Math.round(lat * 80)}`;
}

export default function CityDetailPage({ cityName, onBack, onCityChange }: CityDetailPageProps) {
  const { ready: henanCitiesReady, error: henanCitiesError } = useHenanCitiesMap();
  const { ready: cityMapReady, error: cityMapError, mapName: cityMapName } = useCityMap(cityName);
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailBuilding, setDetailBuilding] = useState<BuildingRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [isInsetExpanded, setIsInsetExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetch(publicPath("data/buildings_processed.json"))
      .then((res) => {
        if (!res.ok) throw new Error("数据加载失败");
        return res.json();
      })
      .then((rows: BuildingRecord[]) => {
        if (!mounted) return;
        const normalized = rows.map(normalizeBuilding);
        const cityBuildings = normalized.filter(
          (b) => b.city_short === cityName || b.city === cityName || b.city?.startsWith(cityName)
        );
        setBuildings(cityBuildings);
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
  }, [cityName]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [cityName]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDetailOpen && !isInsetExpanded) {
        onBack();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onBack, isDetailOpen, isInsetExpanded]);

  const cityBuildings = useMemo(() => {
    return [...buildings].sort((a, b) => toNumber(b.aci) - toNumber(a.aci));
  }, [buildings]);

  const stats = useMemo(() => {
    const count = cityBuildings.length;
    if (!count) return { count: 0, avgAci: 0, types: [] as string[], dynasties: [] as string[], systems: [] as string[] };
    const avgAci = cityBuildings.reduce((sum, b) => sum + toNumber(b.aci), 0) / count;
    const types = Array.from(new Set(cityBuildings.map((b) => getTypeLabel(b)))).filter(Boolean);
    const dynasties = Array.from(new Set(cityBuildings.map((b) => b.dynasty_group))).filter(Boolean);
    const systems = Array.from(new Set(cityBuildings.map((b) => getBuildingSystem(getTypeLabel(b))))).filter(Boolean);
    return { count, avgAci, types, dynasties, systems };
  }, [cityBuildings]);

  const systemStats = useMemo(
    () =>
      SYSTEM_ORDER.map((system) => {
        const count = cityBuildings.filter((item) => getBuildingSystem(getTypeLabel(item)) === system).length;
        return {
          system,
          count,
          share: cityBuildings.length ? count / cityBuildings.length : 0,
        };
      }).filter((item) => item.count > 0),
    [cityBuildings],
  );

  const cityCenter = CITY_COORDS[cityName] ?? [113.6, 34.7];

  const mainMapOption = useMemo(() => {
    if (!cityBuildings.length || !cityMapReady) return null;

    const echartsApi = { getMap } as unknown as {
      getMap?: (name: string) => { geoJson: unknown } | undefined;
    };
    const mapData = echartsApi.getMap?.(cityMapName);
    const geoBounds = mapData ? getGeoJsonBounds(mapData.geoJson) : null;

    const bLons = cityBuildings.map((b) => toNumber(b.lon));
    const bLats = cityBuildings.map((b) => toNumber(b.lat));
    const bMinLon = Math.min(...bLons);
    const bMaxLon = Math.max(...bLons);
    const bMinLat = Math.min(...bLats);
    const bMaxLat = Math.max(...bLats);
    const centerLon = bLons.reduce((sum, value) => sum + value, 0) / bLons.length;
    const centerLat = bLats.reduce((sum, value) => sum + value, 0) / bLats.length;

    let boundingCoords: [number, number][] | undefined;
    if (geoBounds) {
      const needsExpand =
        bMinLon < geoBounds.minLon ||
        bMaxLon > geoBounds.maxLon ||
        bMinLat < geoBounds.minLat ||
        bMaxLat > geoBounds.maxLat;
      if (needsExpand) {
        const lonSpan = Math.max(geoBounds.maxLon, bMaxLon) - Math.min(geoBounds.minLon, bMinLon);
        const latSpan = Math.max(geoBounds.maxLat, bMaxLat) - Math.min(geoBounds.minLat, bMinLat);
        const lonPad = Math.max(0.02, lonSpan * 0.05);
        const latPad = Math.max(0.02, latSpan * 0.05);
        boundingCoords = [
          [Math.min(geoBounds.minLon, bMinLon) - lonPad, Math.max(geoBounds.maxLat, bMaxLat) + latPad],
          [Math.max(geoBounds.maxLon, bMaxLon) + lonPad, Math.min(geoBounds.minLat, bMinLat) - latPad],
        ];
      }
    }

    const labelClusters = new Map<string, number>();
    const scatterData = cityBuildings.map((b) => {
      const lon = toNumber(b.lon);
      const lat = toNumber(b.lat);
      // 转换为 GCJ-02 坐标系以修正偏移
      const [correctedLon, correctedLat] = projectLonLatToGeo(lon, lat);
      const clusterKey = getCrowdClusterKey(correctedLon, correctedLat);
      const clusterIndex = labelClusters.get(clusterKey) ?? 0;
      labelClusters.set(clusterKey, clusterIndex + 1);

      const basePosition = getBaseLabelPosition(correctedLon, correctedLat, centerLon, centerLat);
      const positionSequence = getLabelSequence(basePosition);
      const labelPosition = positionSequence[clusterIndex % positionSequence.length];
      const distance = 8 + Math.floor(clusterIndex / positionSequence.length) * 6 + (labelPosition === basePosition ? 0 : 2);
      const showLabel = clusterIndex < 2;

      return {
        name: b.name,
        value: [correctedLon, correctedLat],
        building: b,
        itemStyle: {
          color: TYPE_COLORS[getTypeLabel(b)] || "#8f6842",
          borderColor: "#fffaf4",
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: "rgba(74, 51, 34, 0.25)",
        },
        label: {
          show: showLabel,
          position: labelPosition,
          distance,
          color: "#4a3322",
          fontSize: 11,
          fontWeight: 500,
          backgroundColor: "rgba(255, 252, 247, 0.82)",
          borderColor: "rgba(180, 150, 115, 0.35)",
          borderWidth: 1,
          borderRadius: 4,
          padding: [2, 6],
          formatter: "{b}",
        },
      };
    });

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params: { data: { building: BuildingRecord } }) => {
          const b = params.data.building;
          return `${b.name}<br/>${b.dynasty_group} · ${getTypeLabel(b)}<br/>ACI ${toNumber(b.aci).toFixed(2)}`;
        },
      },
      geo: {
        map: cityMapName,
        roam: true,
        scaleLimit: {
          min: 1,
          max: 6,
        },
        layoutCenter: ["50%", "50%"],
        layoutSize: "92%",
        boundingCoords,
        label: {
          show: false,
        },
        itemStyle: {
          areaColor: "#f7eddf",
          borderColor: "#d0af94",
          borderWidth: 1.8,
        },
        emphasis: { disabled: true },
        silent: false,
      },
      series: [
        {
          type: "scatter",
          coordinateSystem: "geo",
          symbolSize: 18,
          data: scatterData,
          emphasis: {
            scale: 1.4,
            itemStyle: {
              shadowBlur: 16,
              shadowColor: "rgba(74, 51, 34, 0.35)",
            },
            label: { show: true, fontSize: 12 },
          },
          labelLayout: {
            hideOverlap: false,
            moveOverlap: "shiftY",
          },
        },
      ],
    };
  }, [cityBuildings, cityMapReady, cityMapName]);

  const insetMapOption = useMemo(() => {
    if (!henanCitiesReady) return null;
    return {
      backgroundColor: "transparent",
      geo: {
        map: "henan-cities",
        roam: false,
        layoutCenter: ["50%", "50%"],
        layoutSize: "88%",
        itemStyle: {
          areaColor: "#f7eddf",
          borderColor: "#d0af94",
          borderWidth: 1.5,
        },
        emphasis: { disabled: true },
        silent: true,
      },
      series: [
        {
          type: "scatter",
          coordinateSystem: "geo",
          symbolSize: 10,
          data: [{ value: cityCenter, name: cityName }],
          itemStyle: {
            color: "#8f4721",
            borderColor: "#fffaf4",
            borderWidth: 1.5,
            shadowBlur: 4,
            shadowColor: "rgba(74, 51, 34, 0.3)",
          },
        },
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          symbolSize: 14,
          data: [{ value: cityCenter, name: cityName }],
          rippleEffect: { brushType: "stroke", scale: 2.5 },
          itemStyle: { color: "#8f4721" },
        },
      ],
    };
  }, [henanCitiesReady, cityCenter, cityName]);

  const insetMapEvents = useMemo(
    () => ({
      click: () => {
        setIsInsetExpanded(true);
      },
    }),
    [],
  );

  const expandedMapOption = useMemo(() => {
    if (!henanCitiesReady) return null;
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params: { name?: string }) => params?.name ?? "",
      },
      geo: {
        map: "henan-cities",
        roam: false,
        layoutCenter: ["50%", "50%"],
        layoutSize: "84%",
        itemStyle: {
          areaColor: "#f7eddf",
          borderColor: "#d0af94",
          borderWidth: 1.8,
        },
        emphasis: {
          itemStyle: { areaColor: "#f3e6d6" },
          label: { show: true, color: "#5a3d2a" },
        },
        select: {
          itemStyle: { areaColor: "#ebd3b5" },
          label: { show: true, color: "#4a3322" },
        },
      },
      series: [
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          symbolSize: 18,
          data: [{ value: cityCenter, name: cityName }],
          rippleEffect: { brushType: "stroke", scale: 3 },
          itemStyle: { color: "#8f4721" },
        },
      ],
    };
  }, [henanCitiesReady, cityCenter, cityName]);

  const expandedMapEvents = useMemo(
    () => ({
      click: (params: { name?: string }) => {
        const raw = params?.name;
        if (!raw) return;
        const nextCity = cityNameFromGeo(raw);
        if (nextCity && nextCity !== cityName) {
          setIsInsetExpanded(false);
          onCityChange?.(nextCity);
        }
      },
    }),
    [onCityChange, cityName],
  );

  const onMapEvents = useMemo(
    () => ({
      click: (params: { data: { building: BuildingRecord } }) => {
        if (params?.data?.building) {
          setDetailBuilding(params.data.building);
          setIsDetailOpen(true);
        }
      },
    }),
    []
  );

  const photoUrl = publicPath(`pictures/${cityName}.jpeg`);

  if (loading) {
    return (
      <div className="city-detail-page city-detail-page--loading">
        <div className="city-detail-loading">
          <div className="city-detail-spinner" />
          <p>正在绘制 {cityName} 的城市画卷…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="city-detail-page city-detail-page--error">
        <p className="city-detail-error">{error}</p>
        <button className="city-detail-back" onClick={onBack}>← 返回山河分布</button>
      </div>
    );
  }

  if (cityMapError || henanCitiesError) {
    return (
      <div className="city-detail-page city-detail-page--error">
        <p className="city-detail-error">{cityMapError || henanCitiesError}</p>
        <button className="city-detail-back" onClick={onBack}>鈫?杩斿洖灞辨渤鍒嗗竷</button>
      </div>
    );
  }

  return (
    <div className="city-detail-page">
      <div className="city-detail-hero">
        {!photoError ? (
          <img
            className="city-detail-hero__img"
            src={photoUrl}
            alt={`${cityName}城市风光`}
            onError={() => setPhotoError(true)}
          />
        ) : null}
        <div className={`city-detail-hero__overlay ${photoError ? "no-photo" : ""}`}>
          <button className="city-detail-back" onClick={onBack}>← 返回山河分布</button>
          <h1 className="city-detail-title">{cityName}</h1>
          <p className="city-detail-subtitle">
            {stats.count > 0
              ? `${stats.count} 处古代建筑样本 · 平均 ACI ${stats.avgAci.toFixed(2)}`
              : "暂无样本数据"}
          </p>
          {systemStats.length > 0 ? (
            <div className="city-detail-system-strip">
              {systemStats.map((item) => (
                <div key={item.system} className="city-detail-system-pill">
                  <span
                    className="city-detail-system-pill__dot"
                    style={{ backgroundColor: SYSTEM_COLORS[item.system] }}
                  />
                  <span>
                    {item.system} · {item.count}处
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="city-detail-body">
        {cityBuildings.length > 0 ? (
          <>
            <section className="city-detail-section">
              <h2 className="city-detail-section__title">城市建筑分布</h2>
              <div className="city-detail-map-wrap">
                <div className="city-detail-map-main">
                  {cityMapReady && mainMapOption ? (
                    <EChart
                      key={`city-map-${cityName}`}
                      option={mainMapOption}
                      onEvents={onMapEvents}
                      style={{ width: "100%", height: "480px" }}
                      opts={{ renderer: "canvas" }}
                    />
                  ) : (
                    <div className="city-detail-map-loading">
                      <div className="city-detail-spinner" />
                      <p>正在加载地图底图…</p>
                    </div>
                  )}
                  {henanCitiesReady && insetMapOption ? (
                    <div className="city-detail-map-inset">
                      <EChart
                        option={insetMapOption}
                        onEvents={insetMapEvents}
                        style={{ width: "168px", height: "132px" }}
                        opts={{ renderer: "canvas" }}
                      />
                      <span className="city-detail-map-inset__label">在河南省的位置</span>
                    </div>
                  ) : null}
                </div>
                <div className="city-detail-map-legend">
                  {systemStats.map((item) => (
                    <div key={item.system} className="city-detail-map-legend__item city-detail-map-legend__item--system">
                      <span className="dot" style={{ background: SYSTEM_COLORS[item.system] }} />
                      <span>{item.system}</span>
                    </div>
                  ))}
                  {Object.entries(TYPE_COLORS).map(([type, color]) => (
                    <div key={type} className="city-detail-map-legend__item">
                      <span className="dot" style={{ background: color }} />
                      <span>{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="city-detail-section">
              <h2 className="city-detail-section__title">代表样本</h2>
              <div className="city-detail-cards">
                {cityBuildings.map((b) => (
                  <article
                    key={b.building_code}
                    className="city-detail-card"
                    onClick={() => {
                      setDetailBuilding(b);
                      setIsDetailOpen(true);
                    }}
                  >
                    <div className="city-detail-card__header">
                      <h3>{b.name}</h3>
                      <div className="city-detail-card__badges">
                        <span
                          className="city-detail-card__system"
                          style={{
                            color: SYSTEM_COLORS[getBuildingSystem(getTypeLabel(b))] || "#8f6842",
                            backgroundColor: `${SYSTEM_COLORS[getBuildingSystem(getTypeLabel(b))] || "#8f6842"}16`,
                          }}
                        >
                          {getBuildingSystem(getTypeLabel(b))}
                        </span>
                        <span
                          className="city-detail-card__type"
                          style={{ color: TYPE_COLORS[getTypeLabel(b)] || "#8f6842" }}
                        >
                          {getTypeLabel(b)}
                        </span>
                      </div>
                    </div>
                    <div className="city-detail-card__meta">
                      <span>{b.dynasty_group}</span>
                      <span>ACI {toNumber(b.aci).toFixed(2)}</span>
                    </div>
                    <p className="city-detail-card__desc">{formatDisplayParagraph(b.summary || b.historical_background)}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="city-detail-empty">
            <p>当前城市暂无建筑样本数据。</p>
            <button className="city-detail-back" onClick={onBack}>← 返回山河分布</button>
          </div>
        )}
      </div>

      <BuildingDetailModal
        building={detailBuilding}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {isInsetExpanded && expandedMapOption ? (
        <div
          className="city-detail-expanded-map"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInsetExpanded(false);
          }}
        >
          <div className="city-detail-expanded-map__panel">
            <div className="city-detail-expanded-map__header">
              <h3>点击城市切换</h3>
              <button
                type="button"
                className="city-detail-expanded-map__close"
                onClick={() => setIsInsetExpanded(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className="city-detail-expanded-map__body">
              <EChart
                option={expandedMapOption}
                onEvents={expandedMapEvents}
                style={{ width: "100%", height: "520px" }}
                opts={{ renderer: "canvas" }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {showScrollTop && (
        <button
          className="scroll-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="返回顶部"
        >
          ↑
        </button>
      )}
    </div>
  );
}
