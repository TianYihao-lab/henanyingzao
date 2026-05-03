import { useMemo } from "react";
import SectionHeader from "../components/common/SectionHeader";
import StorySection from "../components/layout/StorySection";
import { MiniPieChart, MiniBarChart, MiniColumnChart } from "../components/common/MiniCharts";
import { getBuildingTypeV2 } from "../utils/buildingSystems";
import { useProcessedBuildings } from "../hooks/useProcessedBuildings";
import "./OriginSection.css";

interface OriginSectionProps {
  origin: {
    title: string;
    subtitle: string;
    desc: string;
    cards: { title: string; desc: string }[];
    footer: string;
  };
}

function normalizeHeritageLevel(level?: string | null) {
  const text = String(level ?? "").trim();

  if (!text) return "未分级";
  if (/世界文化遗产/u.test(text)) return "世界文化遗产";
  if (/全国重点文物保护单位|国保/u.test(text)) return "全国重点文物保护单位";
  if (/省级文物保护单位|省保/u.test(text)) return "省级文物保护单位";
  if (/市级文物保护单位/u.test(text)) return "市级文物保护单位";
  if (/县级文物保护单位/u.test(text)) return "县级文物保护单位";
  return text;
}

export default function OriginSection({ origin }: OriginSectionProps) {
  const { buildings } = useProcessedBuildings();
  const knownDynasties = useMemo(
    () => new Set(["\u65b0\u77f3\u5668", "\u590f\u5546\u5468", "\u79e6\u6c49", "\u9b4f\u664b\u5357\u5317\u671d", "\u96cb\u5510", "\u5b8b\u5143", "\u660e\u6e05"]),
    [],
  );

  const typeData = useMemo(() => {
    const map = new Map<string, number>();
    buildings.forEach((b) => {
      const type = getBuildingTypeV2(b.building_type_v2 ?? b.building_type);
      map.set(type, (map.get(type) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [buildings]);

  const levelData = useMemo(() => {
    const map = new Map<string, number>();
    buildings.forEach((b) => {
      const key = normalizeHeritageLevel(b.heritage_level);
      map.set(key, (map.get(key) || 0) + 1);
    });

    const order = ["世界文化遗产", "全国重点文物保护单位", "省级文物保护单位", "市级文物保护单位", "县级文物保护单位", "未分级"];

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const ia = order.indexOf(a.name);
        const ib = order.indexOf(b.name);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return b.value - a.value;
      });
  }, [buildings]);

  const dynastyData = useMemo(() => {
    const map = new Map<string, number>();
    buildings.forEach((b) => {
      const key = b.dynasty_group || b.dynasty || "??";
      if (!knownDynasties.has(key)) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    const order = ["新石器", "夏商周", "秦汉", "魏晋南北朝", "隋唐", "宋元", "明清"];
    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return b[1] - a[1];
    });
    return entries.map(([name, value]) => ({ name, value }));
  }, [buildings, knownDynasties]);

  const cityData = useMemo(() => {
    const map = new Map<string, number>();
    buildings.forEach((b) => {
      const key = b.city_short || b.city;
      if (key) map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "zh-CN"))
      .slice(0, 5);
  }, [buildings]);

  const hasData = buildings.length > 0;

  return (
    <StorySection id="origin" className="origin-section">
      <SectionHeader title={origin.title} subtitle={origin.subtitle} />

      <div className="origin-layout">
        <div className="origin-left">
          <div className="card-grid origin-cards">
            {origin.cards.map((card) => (
              <article key={card.title} className="story-card">
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="origin-right">
          <div className="dashboard-grid origin-dashboard">
            <div className="dashboard-card">
              <MiniPieChart data={typeData} title="建筑类型分布" />
            </div>
            <div className="dashboard-card">
              <MiniBarChart data={levelData} title="遗产等级分布" />
            </div>
            <div className="dashboard-card">
              <MiniColumnChart data={dynastyData} title="朝代样本数量" />
            </div>
            <div className="dashboard-card">
              <MiniBarChart data={cityData} title="样本集聚城市 Top5" />
            </div>
          </div>
          {!hasData && (
            <p className="origin-loading-hint">数据图表加载中…</p>
          )}
        </div>
      </div>

      <div className="section-nav-footer">
        <button className="section-nav-button" onClick={() => document.getElementById("dynasty")?.scrollIntoView({ behavior: "smooth" })}>
          下一章：朝代演变 →
        </button>
      </div>
    </StorySection>
  );
}
