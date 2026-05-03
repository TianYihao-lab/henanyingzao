import SectionHeader from "../components/common/SectionHeader";
import StorySection from "../components/layout/StorySection";
import CivilizationTrajectory from "../components/trajectory/CivilizationTrajectory";
import { useDeferredMount } from "../hooks/useDeferredMount";

interface TrajectorySectionProps {
  trajectory: {
    title: string;
    subtitle: string;
    desc: string;
    footer: string;
  };
}

export default function TrajectorySection({
  trajectory,
}: TrajectorySectionProps) {
  const { ref, shouldMount } = useDeferredMount<HTMLDivElement>();

  return (
    <StorySection id="trajectory">
      <SectionHeader
        title={trajectory.title}
        subtitle={trajectory.subtitle}
        desc={trajectory.desc}
      />
      <div className="section-takeaway">
        <span className="section-takeaway__label">本幕发现</span>
        <p>
          建筑成就重心会在历史更替中迁移，但整体始终围绕中原核心区域反复汇聚，
          最终呈现出<strong>从阶段分布走向文明重心</strong>的长期结构。
        </p>
      </div>

      <div ref={ref}>
        {shouldMount ? <CivilizationTrajectory /> : <div className="section-placeholder">文明星轨接近视口时加载…</div>}
      </div>

      <p className="section-footer-text">{trajectory.footer}</p>

      <div className="section-nav-footer">
        <button className="section-nav-button" onClick={() => document.getElementById("methodology")?.scrollIntoView({ behavior: "smooth" })}>
          下一章：研究方法 →
        </button>
      </div>
    </StorySection>
  );
}
