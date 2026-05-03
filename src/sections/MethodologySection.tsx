import { useMemo } from "react";
import SectionHeader from "../components/common/SectionHeader";
import EChart from "../components/common/EChart";
import StorySection from "../components/layout/StorySection";
import { toNumber } from "../utils/buildingViz";
import { useDeferredMount } from "../hooks/useDeferredMount";
import { useProcessedBuildings } from "../hooks/useProcessedBuildings";
import "./MethodologySection.css";

interface MethodologySectionProps {
  methodology: {
    title: string;
    subtitle: string;
    desc: string;
    dataSources: {
      title: string;
      sources: string[];
    };
    methodology: {
      title: string;
      steps: string[];
    };
    aciDefinition: {
      title: string;
      desc: string;
      explanation: string;
    };
    limitations: {
      title: string;
      points: string[];
    };
    academicValue: {
      title: string;
      desc: string;
    };
    footer: string;
  };
}

const STEP_ICONS = ["1", "2", "3", "4", "5"];

function isDark() {
  return document.documentElement.classList.contains("dark-mode");
}

export default function MethodologySection({ methodology }: MethodologySectionProps) {
  const { ref, shouldMount } = useDeferredMount<HTMLDivElement>();
  const { buildings } = useProcessedBuildings();

  const avgScores = useMemo(() => {
    if (!buildings.length) return [0, 0, 0, 0];

    const history = buildings.reduce((sum, item) => sum + toNumber(item.history_score), 0) / buildings.length;
    const rank = buildings.reduce((sum, item) => sum + toNumber(item.rank_score), 0) / buildings.length;
    const scale = buildings.reduce((sum, item) => sum + toNumber(item.scale_score), 0) / buildings.length;
    const cluster = buildings.reduce((sum, item) => sum + toNumber(item.cluster_score), 0) / buildings.length;

    return [history, rank, scale, cluster];
  }, [buildings]);

  const radarOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      title: {
        text: "样本平均四维得分",
        left: "center",
        top: 0,
        textStyle: {
          color: isDark() ? "#f8f4ed" : "#4a3b2a",
          fontSize: 13,
        },
      },
      tooltip: {},
      radar: {
        indicator: [
          { name: "历史延续", max: 1 },
          { name: "政治等级", max: 1 },
          { name: "建筑规模", max: 1 },
          { name: "空间集聚", max: 1 },
        ],
        center: ["50%", "58%"],
        radius: "52%",
        nameGap: 14,
        axisName: {
          color: isDark() ? "#c8b8a8" : "#7a6552",
          fontSize: 12,
        },
        splitArea: {
          areaStyle: {
            color: ["rgba(201,137,77,0.08)", "rgba(201,137,77,0.04)"],
          },
        },
        axisLine: {
          lineStyle: {
            color: isDark() ? "rgba(180,130,90,0.25)" : "rgba(123,91,62,0.2)",
          },
        },
        splitLine: {
          lineStyle: {
            color: isDark() ? "rgba(180,130,90,0.15)" : "rgba(123,91,62,0.15)",
          },
        },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: avgScores,
              name: "平均得分",
              areaStyle: { color: "rgba(201,137,77,0.28)" },
              lineStyle: { width: 2, color: "#c9894d" },
              itemStyle: { color: "#8f4721" },
            },
          ],
        },
      ],
    }),
    [avgScores],
  );

  return (
    <StorySection id="methodology">
      <SectionHeader title={methodology.title} subtitle={methodology.subtitle} desc={methodology.desc} />

      <div className="methodology-stepper-wrap">
        <div className="methodology-stepper">
          {methodology.methodology.steps.map((step, idx) => (
            <div key={idx} className="methodology-step">
              <div className="methodology-step__dot">{STEP_ICONS[idx]}</div>
              <div className="methodology-step__label">{step}</div>
              {idx < methodology.methodology.steps.length - 1 && <div className="methodology-step__line" />}
            </div>
          ))}
        </div>
      </div>

      <div className="methodology-dashboard">
        <div className="methodology-visual">
          <div className="dashboard-card methodology-radar">
            <div ref={ref}>
              {shouldMount ? (
                <EChart option={radarOption} style={{ height: 268 }} opts={{ renderer: "canvas" }} lazyUpdate />
              ) : (
                <div className="section-placeholder">研究方法图表接近视口时加载…</div>
              )}
            </div>
          </div>

          <div className="dashboard-card methodology-formula">
            <h4>{methodology.aciDefinition.title}</h4>
            <p>{methodology.aciDefinition.desc}</p>
            <div className="aci-formula">{methodology.aciDefinition.explanation}</div>
          </div>
        </div>

        <div className="methodology-content methodology-content--compact">
          <div className="methodology-section">
            <h3>{methodology.dataSources.title}</h3>
            <ul className="methodology-list">
              {methodology.dataSources.sources.map((source, index) => (
                <li key={index}>{source}</li>
              ))}
            </ul>
          </div>

          <div className="methodology-section">
            <h3>{methodology.limitations.title}</h3>
            <ul className="methodology-limitations">
              {methodology.limitations.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="methodology-section">
            <h3>{methodology.academicValue.title}</h3>
            <p>{methodology.academicValue.desc}</p>
          </div>
        </div>
      </div>

      <p className="section-footer-text">{methodology.footer}</p>

      <div className="section-nav-footer">
        <button className="section-nav-button" onClick={() => document.getElementById("outro")?.scrollIntoView({ behavior: "smooth" })}>
          下一章：结语 →
        </button>
      </div>
    </StorySection>
  );
}
