import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import "./HeroSection.css";
import { useProcessedBuildings } from "../hooks/useProcessedBuildings";
import { publicPath } from "../utils/publicPath";

const LazyHeroHenanEChart = lazy(() => import("../components/common/HeroHenanEChart"));

interface HeroData {
  title: string;
  subtitle: string;
  cta: string;
  tip: string;
}

interface HeroSectionProps {
  hero: HeroData;
  onNavigate?: (page: "origin" | "map") => void;
}

interface HeroStats {
  cityCount: number;
  periodCount: number;
  sampleCount: number;
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth" });
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
    startRef.current = null;
    let raf = 0;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setValue(Math.floor(easeOutQuart * targetRef.current));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function HeroSection({ hero, onNavigate }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [showHeroChart, setShowHeroChart] = useState(false);
  const { buildings } = useProcessedBuildings();
  const stats = useMemo<HeroStats>(() => {
    const citySet = new Set<string>();
    const periodSet = new Set<string>();

    buildings.forEach((item) => {
      const city = item.city_short ?? item.city ?? "";
      if (city) citySet.add(city);
      if (item.dynasty_group && item.dynasty_group !== "鍏朵粬") periodSet.add(item.dynasty_group);
    });

    return {
      cityCount: citySet.size,
      periodCount: periodSet.size,
      sampleCount: buildings.length,
    };
  }, [buildings]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("section-visible");
        });
      },
      { threshold: 0.12 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    type IdleWindow = Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(() => setShowHeroChart(true), { timeout: 800 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(() => setShowHeroChart(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  const cityCountAnim = useCountUp(stats.cityCount);
  const periodCountAnim = useCountUp(stats.periodCount);
  const sampleCountAnim = useCountUp(stats.sampleCount);

  return (
    <section id="hero" className="hero-section" ref={sectionRef}>
      <img
        className="hero-bg-img"
        src={publicPath("pictures/hero-bg.jpg")}
        alt=""
        aria-hidden="true"
      />
      <div className="hero-section__inner">
        <div className="hero-upgrade hero-upgrade--v4">
          <div className="hero-upgrade__copy hero-copy--v4">
            <div className="hero-copy__title-block">
              <h1 className="hero__title hero__title--v4">{hero.title}</h1>
              <p className="hero__subtitle hero__subtitle--v4">{hero.subtitle}</p>
            </div>

            <div className="hero-upgrade__actions hero-upgrade__actions--v4">
              <button
                className="primary-button primary-button--hero"
                onClick={() => (onNavigate ? onNavigate("origin") : scrollToSection("origin"))}
              >
                {hero.cta}
              </button>
              <button
                className="ghost-button ghost-button--hero"
                onClick={() => (onNavigate ? onNavigate("map") : scrollToSection("map"))}
              >
                先看山河分布
              </button>
            </div>

            <div className="hero-data-strip">
              <article className="hero-data-chip hero-data-chip--primary">
                <span>代表城市</span>
                <strong>{cityCountAnim}</strong>
              </article>
              <article className="hero-data-chip">
                <span>历史阶段</span>
                <strong>{periodCountAnim}</strong>
              </article>
              <article className="hero-data-chip hero-data-chip--accent">
                <span>代表样本</span>
                <strong>{sampleCountAnim}</strong>
              </article>
            </div>
          </div>

          <div className="hero-upgrade__visual hero-visual--v4" aria-hidden="true">
            <div className="hero-map-card hero-map-card--refined">
              <div className="hero-map-card__canvas hero-map-card__canvas--compact">
                {showHeroChart ? (
                  <Suspense fallback={<div style={{ width: "100%", height: "100%" }} />}>
                    <LazyHeroHenanEChart height="100%" />
                  </Suspense>
                ) : (
                  <div style={{ width: "100%", height: "100%" }} />
                )}
              </div>
            <div className="hero-map-footer-strip">
              <div className="hero-map-footer-item">
                <span>观察尺度</span>
                <strong>河南省</strong>
              </div>
              <div className="hero-map-footer-item">
                <span>叙事线索</span>
                <strong>城市节点 × 历史迁移</strong>
              </div>
              <div className="hero-map-footer-item">
                <span>核心问题</span>
                <strong>建筑成就发展</strong>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
