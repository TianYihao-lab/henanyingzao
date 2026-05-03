import { useEffect, useMemo, useState } from "react";
import { toNumber, type BuildingRecord } from "../utils/buildingViz";
import { findLocalBuildingDetailByCode, type LocalBuildingDetailEntry } from "../utils/localBuildingPages";
import { getBuildingSystem, getBuildingTypeV2, type BuildingSystemKey } from "../utils/buildingSystems";
import { formatDisplayParagraph } from "../utils/displayText";
import { publicPath } from "../utils/publicPath";
import "./BuildingSourcePage.css";

interface BuildingSourcePageProps {
  buildingCode: string;
  fromRoute: string;
  onBack: () => void;
}

type LoadState =
  | { status: "loading" }
  | { status: "missing-building" }
  | { status: "missing-page"; building: BuildingRecord }
  | { status: "ready"; building: BuildingRecord; detail: LocalBuildingDetailEntry }
  | { status: "error"; message: string };

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="building-source-page__info-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function systemToKey(building: BuildingRecord): BuildingSystemKey {
  return getBuildingSystem(building.building_type_v2 ?? building.building_type);
}

function shouldUseFallbackSummary(summary: string) {
  const normalized = summary.trim();
  return !normalized || normalized === "暂无可提取的本地页面摘要。" || /^[0-9]{1,2}°/.test(normalized);
}

function getHeroSummary(building: BuildingRecord, detail: LocalBuildingDetailEntry) {
  const pageSummary = detail.page.summary ?? "";
  if (shouldUseFallbackSummary(pageSummary)) {
    return formatDisplayParagraph(building.summary || building.historical_background || pageSummary || "暂无建筑概况说明。");
  }
  return formatDisplayParagraph(pageSummary);
}

export default function BuildingSourcePage({ buildingCode, fromRoute, onBack }: BuildingSourcePageProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setState({ status: "loading" });

        const buildingsResponse = await fetch(publicPath("data/buildings_processed.json"));
        if (!buildingsResponse.ok) {
          throw new Error("建筑数据加载失败");
        }

        const buildings = (await buildingsResponse.json()) as BuildingRecord[];
        const building = buildings.find((item) => item.building_code === buildingCode);

        if (!building) {
          if (!cancelled) {
            setState({ status: "missing-building" });
          }
          return;
        }

        const detail = await findLocalBuildingDetailByCode(buildingCode);
        if (!detail) {
          if (!cancelled) {
            setState({ status: "missing-page", building });
          }
          return;
        }

        if (!cancelled) {
          setState({
            status: "ready",
            building,
            detail,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "建筑详情加载失败",
          });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [buildingCode]);

  const routeLabel = useMemo(() => {
    if (fromRoute.startsWith("/city/")) {
      return "返回城市详情";
    }
    return "返回长卷";
  }, [fromRoute]);

  if (state.status === "loading") {
    return (
      <div className="building-source-page">
        <div className="building-source-page__shell">
          <div className="building-source-page__loading">正在加载建筑详情...</div>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="building-source-page">
        <div className="building-source-page__shell">
          <div className="building-source-page__empty">
            <h2>详细信息加载失败</h2>
            <p>{state.message}</p>
            <button type="button" onClick={onBack}>
              {routeLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "missing-building") {
    return (
      <div className="building-source-page">
        <div className="building-source-page__shell">
          <div className="building-source-page__empty">
            <h2>未找到建筑记录</h2>
            <p>当前建筑编码在本地数据集中不存在。</p>
            <button type="button" onClick={onBack}>
              {routeLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "missing-page") {
    const building = state.building;
    return (
      <div className="building-source-page">
        <div className="building-source-page__shell">
          <div className="building-source-page__empty">
            <h2>{building.name}</h2>
            <p>这处建筑没有匹配到可用的本地详情资料，因此当前版本不提供“详细信息”跳转。</p>
            <button type="button" onClick={onBack}>
              {routeLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { building, detail } = state;
  const { page } = detail;
  const systemKey = systemToKey(building);
  const heroSummary = getHeroSummary(building, detail);
  const summaryText = formatDisplayParagraph(building.summary || building.historical_background || heroSummary);
  const featureText = formatDisplayParagraph(building.feature_note || "暂无更多结构特点说明。");

  return (
    <div className="building-source-page" data-system={systemKey}>
      <div className="building-source-page__shell">
        <div className="building-source-page__hero">
          <div className="building-source-page__hero-copy">
            <button type="button" className="building-source-page__back" onClick={onBack}>
              {`← ${routeLabel}`}
            </button>
            <p className="building-source-page__eyebrow">{`${building.city_short ?? building.city} · ${building.dynasty_group ?? building.dynasty}`}</p>
            <h1>{building.name}</h1>
            <div className="building-source-page__meta">
              <span>{getBuildingTypeV2(building.building_type_v2 ?? building.building_type)}</span>
              <span>{systemKey}</span>
              <span>{`ACI ${toNumber(building.aci).toFixed(2)}`}</span>
            </div>
            <p className="building-source-page__summary">{heroSummary}</p>
          </div>

          <div className="building-source-page__hero-card">
            {page.imageUrl ? (
              <img src={publicPath(page.imageUrl)} alt={building.name} className="building-source-page__image" />
            ) : (
              <div className="building-source-page__image building-source-page__image--placeholder">
                <span>{page.title}</span>
              </div>
            )}
          </div>
        </div>

        <div className="building-source-page__info-grid">
          <InfoCard label="建筑类型" value={getBuildingTypeV2(building.building_type_v2 ?? building.building_type)} />
          <InfoCard label="所属系统" value={systemKey} />
          <InfoCard label="遗产等级" value={building.heritage_level ?? "暂无"} />
          <InfoCard label="保存状态" value={building.status ?? "暂无"} />
        </div>

        <div className="building-source-page__content">
          <section className="building-source-page__panel">
            <div className="building-source-page__section-head">
              <h2>建筑概览</h2>
            </div>
            <p>{summaryText}</p>
            <p>{featureText}</p>
          </section>

          {page.facts.length > 0 ? (
            <section className="building-source-page__panel">
              <div className="building-source-page__section-head">
                <h2>整理后的关键信息</h2>
              </div>
              <div className="building-source-page__facts">
                {page.facts.map((fact) => (
                  <div key={`${fact.label}-${fact.value}`} className="building-source-page__fact">
                    <span>{fact.label}</span>
                    <strong>{fact.value}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {page.sections.map((section) => (
            <section key={section.title} className="building-source-page__panel">
              <div className="building-source-page__section-head">
                <h2>{section.title}</h2>
              </div>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{formatDisplayParagraph(paragraph)}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
