import SectionHeader from "../components/common/SectionHeader";
import StorySection from "../components/layout/StorySection";
import HenanMapReal from "../components/map/HenanMapReal";
import { useDeferredMount } from "../hooks/useDeferredMount";

interface MapSectionProps {
  map: {
    title: string;
    subtitle: string;
    desc: string;
    footer: string;
  };
  onCityNavigate?: (city: string) => void;
}

export default function MapSection({ map, onCityNavigate }: MapSectionProps) {
  const { ref, shouldMount } = useDeferredMount<HTMLDivElement>();

  return (
    <StorySection id="map">
      <SectionHeader title={map.title} subtitle={map.subtitle} />

      <div ref={ref}>
        {shouldMount ? (
          <HenanMapReal onCityNavigate={onCityNavigate} />
        ) : (
          <div className="section-placeholder">山河分布接近视口时加载…</div>
        )}
      </div>

      <div className="section-nav-footer">
        <button className="section-nav-button" onClick={() => document.getElementById("theater")?.scrollIntoView({ behavior: "smooth" })}>
          下一章：文明剧场 →
        </button>
      </div>
    </StorySection>
  );
}
