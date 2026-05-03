import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import StorySection from "../components/layout/StorySection";
import { MiniLineChart, MiniBarChart } from "../components/common/MiniCharts";
import { toNumber } from "../utils/buildingViz";
import { getBuildingTypeV2 } from "../utils/buildingSystems";
import { useProcessedBuildings } from "../hooks/useProcessedBuildings";
import { publicPath } from "../utils/publicPath";
import "./OutroSection.css";

interface DynastySummaryItem {
  dynasty: string;
  dynasty_order: number | string;
  avg_aci: number | string | null;
  sample_count: number | string;
}

interface OutroSectionProps {
  outro: {
    title: string;
    subtitle: string;
    findings: { title: string; desc: string }[];
    innovation: { title: string; items: string[] };
    desc1: string;
    desc2: string;
    desc3: string;
    cta: string;
  };
}

export default function OutroSection({ outro }: OutroSectionProps) {
  const { buildings } = useProcessedBuildings();
  const [dynasties, setDynasties] = useState<DynastySummaryItem[]>([]);

  useEffect(() => {
    let mounted = true;
    fetch(publicPath("data/dynasty_summary.json"))
      .then((res) => (res.ok ? res.json() : []))
      .then((dRows: DynastySummaryItem[]) => {
        if (!mounted) return;
        const sorted = (dRows || [])
          .filter((d) => d.dynasty)
          .sort((a, b) => Number(a.dynasty_order) - Number(b.dynasty_order));
        setDynasties(sorted);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const metrics = useMemo(() => {
    const citySet = new Set<string>();
    buildings.forEach((b) => { if (b.city_short || b.city) citySet.add(b.city_short || b.city); });
    const avgAci = buildings.length
      ? buildings.reduce((s, b) => s + toNumber(b.aci), 0) / buildings.length
      : 0;
    return {
      samples: buildings.length,
      cities: citySet.size,
      dynasties: dynasties.length,
      avgAci,
    };
  }, [buildings, dynasties]);

  const dynastyTrend = useMemo(() => {
    return dynasties.map((d) => ({
      name: d.dynasty,
      value: Number(d.avg_aci) || 0,
    }));
  }, [dynasties]);

  const typeRank = useMemo(() => {
    const map = new Map<string, number[]>();
    buildings.forEach((b) => {
      const type = getBuildingTypeV2(b.building_type_v2 ?? b.building_type);
      const list = map.get(type) || [];
      list.push(toNumber(b.aci));
      map.set(type, list);
    });
    return Array.from(map.entries())
      .map(([name, list]) => ({
        name,
        value: Number((list.reduce((a, b) => a + b, 0) / list.length).toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [buildings]);

  const handleBackTop = () => {
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToMethodology = () => {
    document.getElementById("methodology")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <StorySection id="outro">
      <SectionHeader title={outro.title} subtitle={outro.subtitle} />

      <div className="outro-metrics">
        <div className="outro-metric-card">
          <span>总样本数</span>
          <strong>{metrics.samples || "—"}</strong>
        </div>
        <div className="outro-metric-card">
          <span>覆盖城市</span>
          <strong>{metrics.cities || "—"}</strong>
        </div>
        <div className="outro-metric-card">
          <span>历史朝代跨度</span>
          <strong>{metrics.dynasties || "—"}</strong>
        </div>
        <div className="outro-metric-card">
          <span>平均 ACI</span>
          <strong>{metrics.avgAci ? metrics.avgAci.toFixed(2) : "—"}</strong>
        </div>
      </div>

      <div className="outro-charts">
        <div className="dashboard-card outro-chart">
          <MiniLineChart data={dynastyTrend} title="历代平均 ACI 变化趋势" />
        </div>
        <div className="dashboard-card outro-chart">
          <MiniBarChart data={typeRank} title="各建筑类型平均 ACI" />
        </div>
      </div>

      <div className="card-grid outro-findings">
        {outro.findings.map((item) => (
          <article key={item.title} className="story-card">
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </article>
        ))}
      </div>

      <div className="panel outro-innovation">
        <h3>{outro.innovation.title}</h3>
        <ul className="innovation-list">
          {outro.innovation.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="outro-copy">
        <p>{outro.desc1}</p>
        <p>{outro.desc2}</p>
        <p>{outro.desc3}</p>
      </div>

      <div className="outro-actions">
        <button className="ghost-button" onClick={scrollToMethodology}>
          回看方法论
        </button>
        <button className="primary-button" onClick={handleBackTop}>
          {outro.cta}
        </button>
      </div>
    </StorySection>
  );
}
