import SectionHeader from "../components/common/SectionHeader";
import StorySection from "../components/layout/StorySection";
import DynastyTimeline from "../components/dynasty/DynastyTimeline";
import { useDeferredMount } from "../hooks/useDeferredMount";

interface DynastySectionProps {
  dynasty: {
    title: string;
    subtitle: string;
    desc: string;
    footer: string;
  };
}

export default function DynastySection({ dynasty }: DynastySectionProps) {
  const { ref, shouldMount } = useDeferredMount<HTMLDivElement>();

  return (
    <StorySection id="dynasty">
      <SectionHeader title={dynasty.title} subtitle={dynasty.subtitle} />
      <div className="section-takeaway">
        <span className="section-takeaway__label">本幕发现</span>
        <p>
          中原古代建筑文明并不是随时间平均增长，而是在
          <strong>关键朝代形成集中高峰</strong>
          。如今按新口径看，都城/城址、官署/治理与礼制/公共建筑更能体现制度中心，工程/生产设施、桥梁/交通与民居/会馆/聚落则补充了区域营造与地方传统的长期延续。
        </p>
      </div>

      <div ref={ref}>
        {shouldMount ? <DynastyTimeline /> : <div className="section-placeholder">朝代卷轴接近视口时加载…</div>}
      </div>

      <p className="section-footer-text">{dynasty.footer}</p>

      <div className="section-nav-footer">
        <button className="section-nav-button" onClick={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth" })}>
          下一章：山河分布 →
        </button>
      </div>
    </StorySection>
  );
}
