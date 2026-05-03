import { useMemo } from "react";
import "./ExplorerStatusBar.css";
import { toNumber } from "../../utils/buildingViz";
import { useProcessedBuildings } from "../../hooks/useProcessedBuildings";

interface ExplorerStatusBarProps {
  selectedDynasty: string;
  selectedCity: string;
  onClearDynasty: () => void;
  onClearCity: () => void;
  onDynastyChange?: (dynasty: string) => void;
  onCityChange?: (city: string) => void;
}

export default function ExplorerStatusBar({
  selectedDynasty,
  selectedCity,
  onClearDynasty,
  onClearCity,
  onDynastyChange,
  onCityChange,
}: ExplorerStatusBarProps) {
  const { buildings } = useProcessedBuildings();
  const hasFilters = Boolean(selectedDynasty || selectedCity);

  const filtered = useMemo(() => {
    return buildings.filter((item) => {
      const dynastyOk = !selectedDynasty || item.dynasty_group === selectedDynasty;
      const cityOk = !selectedCity || item.city_short === selectedCity || item.city === selectedCity;
      return dynastyOk && cityOk;
    });
  }, [buildings, selectedDynasty, selectedCity]);

  const sampleCount = filtered.length;
  const avgAci = useMemo(() => {
    if (!sampleCount) return 0;
    return filtered.reduce((sum, item) => sum + toNumber(item.aci), 0) / sampleCount;
  }, [filtered, sampleCount]);

  const dynasties = useMemo(() => {
    const set = new Set<string>();
    buildings.forEach((b) => {
      if (b.dynasty_group) set.add(b.dynasty_group);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [buildings]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    buildings.forEach((b) => {
      const key = b.city_short || b.city;
      if (key) set.add(key);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [buildings]);

  return (
    <div className={`explorer-status ${hasFilters ? "is-active" : ""}`} aria-label="当前探索状态">
      <div className="explorer-status__inner">
        <div className="explorer-status__title">
          <span>当前探索</span>
          <strong>{hasFilters ? "全局联动已开启" : "尚未选择全局筛选"}</strong>
        </div>

        <div className="explorer-status__chips">
          <div className={`explorer-status__chip ${selectedDynasty ? "is-on" : ""}`}>
            <span>朝代</span>
            {selectedDynasty ? (
              <>
                <strong>{selectedDynasty}</strong>
                <button type="button" onClick={onClearDynasty} aria-label="清除朝代筛选">
                  ×
                </button>
              </>
            ) : (
              <select
                className="explorer-status__select"
                value=""
                onChange={(e) => onDynastyChange?.(e.target.value)}
                aria-label="选择朝代"
              >
                <option value="">未选择</option>
                {dynasties.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className={`explorer-status__chip ${selectedCity ? "is-on" : ""}`}>
            <span>城市</span>
            {selectedCity ? (
              <>
                <strong>{selectedCity}</strong>
                <button type="button" onClick={onClearCity} aria-label="清除城市筛选">
                  ×
                </button>
              </>
            ) : (
              <select
                className="explorer-status__select"
                value=""
                onChange={(e) => onCityChange?.(e.target.value)}
                aria-label="选择城市"
              >
                <option value="">未选择</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {sampleCount > 0 ? (
            <>
              <div className="explorer-status__chip explorer-status__chip--metric">
                <span>样本数</span>
                <strong>{sampleCount}</strong>
              </div>
              <div className="explorer-status__chip explorer-status__chip--metric">
                <span>平均 ACI</span>
                <strong>{avgAci.toFixed(2)}</strong>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
