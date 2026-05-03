import SectionHeader from "../components/common/SectionHeader";
import StorySection from "../components/layout/StorySection";
import ArchitectureShape from "../components/theater/ArchitectureShape";
import { useDeferredMount } from "../hooks/useDeferredMount";

interface TheaterSectionProps {
  theater: {
    title: string;
    subtitle: string;
    desc: string;
  };
}

export default function TheaterSection({ theater }: TheaterSectionProps) {
  const { ref, shouldMount } = useDeferredMount<HTMLDivElement>();

  return (
    <StorySection id="theater">
      <SectionHeader title={theater.title} subtitle={theater.subtitle} desc={theater.desc} />
      <div ref={ref}>
        {shouldMount ? <ArchitectureShape /> : <div className="section-placeholder">文明剧场接近视口时加载…</div>}
      </div>

      <div className="section-nav-footer">
        <button className="section-nav-button" onClick={() => document.getElementById("trajectory")?.scrollIntoView({ behavior: "smooth" })}>
          下一章：文明星轨 →
        </button>
      </div>
    </StorySection>
  );
}
