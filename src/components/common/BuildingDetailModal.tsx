import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./BuildingDetailModal.css";
import { toNumber, type BuildingRecord } from "../../utils/buildingViz";
import { getBuildingTypeV2 } from "../../utils/buildingSystems";
import { useBuildingComparison } from "../../contexts/BuildingComparisonContext";
import { buildLocalDetailHash, findLocalSourcePageForBuilding } from "../../utils/localBuildingPages";
import { formatDisplayParagraph } from "../../utils/displayText";

interface BuildingDetailModalProps {
  building: BuildingRecord | null;
  isOpen: boolean;
  onClose: () => void;
  closeLabel?: string;
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="bdm-metric">
      <span>{label}</span>
      <div className="bdm-metric__track">
        <div className="bdm-metric__fill" style={{ width: `${value * 100}%` }} />
      </div>
      <strong>{(value * 100).toFixed(0)}</strong>
    </div>
  );
}

function BuildingInfo({ building }: { building: BuildingRecord }) {
  const { addToCompare, isInCompare } = useBuildingComparison();
  const inCompare = isInCompare(building.building_code);
  const [detailHash, setDetailHash] = useState("");
  const summaryText = formatDisplayParagraph(building.summary || building.historical_background || "暂无建筑概况说明。");
  const featureText = formatDisplayParagraph(building.feature_note || "暂无形制特点说明。");

  useEffect(() => {
    let cancelled = false;

    findLocalSourcePageForBuilding(building)
      .then((page) => {
        if (!cancelled) {
          setDetailHash(page ? buildLocalDetailHash(building.building_code) : "");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetailHash("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [building]);

  return (
    <div className="bdm-info">
      <div className="bdm-info__header">
        <div>
          <p className="bdm-info__eyebrow">{`${building.city_short ?? building.city} · ${building.dynasty_group ?? building.dynasty}`}</p>
          <h3>{building.name}</h3>
        </div>
        <div className="bdm-info__aci">ACI {toNumber(building.aci).toFixed(2)}</div>
      </div>

      <div className="bdm-info__grid">
        <div className="bdm-info__kv">
          <span>建筑类型</span>
          <strong>{getBuildingTypeV2(building.building_type_v2 ?? building.building_type)}</strong>
        </div>
        <div className="bdm-info__kv">
          <span>保存状态</span>
          <strong>{building.status ?? "暂无"}</strong>
        </div>
        <div className="bdm-info__kv">
          <span>遗产等级</span>
          <strong>{building.heritage_level ?? "暂无"}</strong>
        </div>
        <div className="bdm-info__kv">
          <span>坐标</span>
          <strong>
            {toNumber(building.lon).toFixed(4)}, {toNumber(building.lat).toFixed(4)}
          </strong>
        </div>
      </div>

      <div className="bdm-info__section">
        <h4>建筑概况</h4>
        <p>{summaryText}</p>
      </div>

      <div className="bdm-info__section">
        <h4>形制与特点</h4>
        <p>{featureText}</p>
      </div>

      <div className="bdm-info__metrics">
        <MetricRow label="历史延续" value={toNumber(building.history_score)} />
        <MetricRow label="政治等级" value={toNumber(building.rank_score)} />
        <MetricRow label="建筑规模" value={toNumber(building.scale_score)} />
        <MetricRow label="空间集聚" value={toNumber(building.cluster_score)} />
      </div>

      {detailHash ? (
        <div className="bdm-info__source">
          <a href={detailHash}>详细信息 →</a>
        </div>
      ) : null}

      <button
        type="button"
        className={`bdm-compare-btn ${inCompare ? "is-active" : ""}`}
        onClick={() => addToCompare(building)}
      >
        {inCompare ? "已加入对比" : "加入对比"}
      </button>
    </div>
  );
}

export default function BuildingDetailModal({
  building,
  isOpen,
  onClose,
  closeLabel = "关闭详情",
}: BuildingDetailModalProps) {
  const { compareList, removeFromCompare } = useBuildingComparison();

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const comparePane = useMemo(() => {
    if (compareList.length === 0) return null;

    return (
      <div className="bdm-compare-pane">
        <div className="bdm-compare-pane__header">
          <span>{`对比样本 (${compareList.length}/2)`}</span>
          <button type="button" onClick={() => removeFromCompare(compareList[compareList.length - 1].building_code)}>
            移除
          </button>
        </div>

        <div className="bdm-compare-pane__list">
          {compareList.map((item) => (
            <div key={item.building_code} className="bdm-compare-chip">
              <span>{item.name}</span>
              <em>ACI {toNumber(item.aci).toFixed(2)}</em>
            </div>
          ))}
        </div>

        {compareList.length === 2 ? (
          <div className="bdm-compare-table">
            <div className="bdm-compare-row head">
              <span>维度</span>
              <span>{compareList[0].name}</span>
              <span>{compareList[1].name}</span>
            </div>
            <div className="bdm-compare-row">
              <span>历史延续</span>
              <span>{(toNumber(compareList[0].history_score) * 100).toFixed(0)}</span>
              <span>{(toNumber(compareList[1].history_score) * 100).toFixed(0)}</span>
            </div>
            <div className="bdm-compare-row">
              <span>政治等级</span>
              <span>{(toNumber(compareList[0].rank_score) * 100).toFixed(0)}</span>
              <span>{(toNumber(compareList[1].rank_score) * 100).toFixed(0)}</span>
            </div>
            <div className="bdm-compare-row">
              <span>建筑规模</span>
              <span>{(toNumber(compareList[0].scale_score) * 100).toFixed(0)}</span>
              <span>{(toNumber(compareList[1].scale_score) * 100).toFixed(0)}</span>
            </div>
            <div className="bdm-compare-row">
              <span>空间集聚</span>
              <span>{(toNumber(compareList[0].cluster_score) * 100).toFixed(0)}</span>
              <span>{(toNumber(compareList[1].cluster_score) * 100).toFixed(0)}</span>
            </div>
            <div className="bdm-compare-row">
              <span>ACI</span>
              <span>{toNumber(compareList[0].aci).toFixed(2)}</span>
              <span>{toNumber(compareList[1].aci).toFixed(2)}</span>
            </div>
          </div>
        ) : null}
      </div>
    );
  }, [compareList, removeFromCompare]);

  if (!isOpen || !building) return null;

  return createPortal(
    <>
      <div className="bdm-backdrop" onClick={onClose} aria-label="关闭详情" />
      <div className="bdm-wrapper">
        <div className="bdm-panel">
          <button type="button" className="bdm-close" onClick={onClose} aria-label="关闭详情">
            ×
          </button>
          <button type="button" className="bdm-return" onClick={onClose}>
            ← {closeLabel}
          </button>
          <BuildingInfo building={building} />
        </div>
        {comparePane}
      </div>
    </>,
    document.body,
  );
}
