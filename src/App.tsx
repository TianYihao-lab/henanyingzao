import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import StoryNav from "./components/layout/StoryNav";
import { useCopy } from "./hooks/useCopy";
import { BuildingComparisonProvider } from "./contexts/BuildingComparisonContext";
import HeroSection from "./sections/HeroSection";
import OriginSection from "./sections/OriginSection";
import OutroSection from "./sections/OutroSection";
import MethodologySection from "./sections/MethodologySection";
import CityDetailPage from "./pages/CityDetailPage";
import BuildingSourcePage from "./pages/BuildingSourcePage";
import usePreloadMaps from "./utils/usePreloadMaps";
import { getBuildingDetailRoute, getPageKeyFromRoute } from "./utils/localBuildingPages";
import "./styles/global.css";
import "./styles/theme.css";

const LazyMapSection = React.lazy(() => import("./sections/MapSection"));
const LazyDynastySection = React.lazy(() => import("./sections/DynastySection"));
const LazyTheaterSection = React.lazy(() => import("./sections/TheaterSection"));
const LazyTrajectorySection = React.lazy(() => import("./sections/TrajectorySection"));

type PageKey =
  | "hero"
  | "origin"
  | "dynasty"
  | "map"
  | "theater"
  | "trajectory"
  | "methodology"
  | "outro";

const PAGE_KEYS: PageKey[] = [
  "hero",
  "origin",
  "dynasty",
  "map",
  "theater",
  "trajectory",
  "methodology",
  "outro",
];

function getPageFromHash(): PageKey {
  const raw = window.location.hash.replace(/^#\/?/, "") as PageKey;
  return PAGE_KEYS.includes(raw) ? raw : "hero";
}

function getCityFromHash(): string | null {
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (!raw.startsWith("city/")) {
    return null;
  }
  return decodeURIComponent(raw.replace("city/", ""));
}

function getBuildingFromHash() {
  return getBuildingDetailRoute();
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const navOffset = 108;
  const sectionBias = id === "map" ? 18 : 0;
  const top = window.scrollY + el.getBoundingClientRect().top - navOffset - sectionBias;
  window.scrollTo({
    top: Math.max(top, 0),
    behavior: "smooth",
  });
}

function findActivePageByViewport(): PageKey {
  const anchorY = window.innerHeight * 0.32;
  let closestPage: PageKey = "hero";
  let closestDistance = Number.POSITIVE_INFINITY;

  PAGE_KEYS.forEach((key) => {
    const el = document.getElementById(key);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top <= anchorY && rect.bottom >= anchorY) {
      closestPage = key;
      closestDistance = -1;
      return;
    }

    if (closestDistance === -1) return;

    const distance = Math.min(Math.abs(rect.top - anchorY), Math.abs(rect.bottom - anchorY));
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPage = key;
    }
  });

  return closestPage;
}

export default function App() {
  usePreloadMaps();
  const { copy, loading, error } = useCopy();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>(() => getPageFromHash());
  const [currentCity, setCurrentCity] = useState<string | null>(() => getCityFromHash());
  const [currentBuildingCode, setCurrentBuildingCode] = useState<string | null>(
    () => getBuildingFromHash()?.buildingCode ?? null,
  );
  const [currentBuildingFrom, setCurrentBuildingFrom] = useState<string>(
    () => getBuildingFromHash()?.from ?? "/theater",
  );
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return false;
  });

  const mainRef = useRef<HTMLDivElement>(null);
  const isManualScrollingRef = useRef(false);
  const pendingSectionScrollRef = useRef<PageKey | null>(null);

  const beginManualScroll = () => {
    isManualScrollingRef.current = true;
    window.setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 900);
  };

  const enterSectionPage = (page: PageKey, options?: { deferScroll?: boolean; replaceHistory?: boolean }) => {
    const nextHash = `#/${page}`;
    const historyMethod = options?.replaceHistory ? "replaceState" : "pushState";

    if (window.location.hash !== nextHash) {
      window.history[historyMethod](null, "", nextHash);
    }

    setCurrentCity(null);
    setCurrentBuildingCode(null);
    setCurrentBuildingFrom(`/${page}`);
    setActivePage(page);

    if (options?.deferScroll) {
      pendingSectionScrollRef.current = page;
      return;
    }

    pendingSectionScrollRef.current = null;
    beginManualScroll();
    scrollToSection(page);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const buildingRoute = getBuildingFromHash();
      if (buildingRoute) {
        setCurrentCity(null);
        setCurrentBuildingCode(buildingRoute.buildingCode);
        setCurrentBuildingFrom(buildingRoute.from);
        setActivePage(getPageKeyFromRoute(buildingRoute.from) as PageKey);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const city = getCityFromHash();
      if (city) {
        setCurrentCity(city);
        setCurrentBuildingCode(null);
        setCurrentBuildingFrom("/map");
        setActivePage("map");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const page = getPageFromHash();
      setCurrentCity(null);
      setCurrentBuildingCode(null);
      setCurrentBuildingFrom(`/${page}`);
      setActivePage(page);
      pendingSectionScrollRef.current = page;
    };

    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/hero");
    } else {
      const buildingRoute = getBuildingFromHash();
      if (buildingRoute) {
        setCurrentCity(null);
        setCurrentBuildingCode(buildingRoute.buildingCode);
        setCurrentBuildingFrom(buildingRoute.from);
        setActivePage(getPageKeyFromRoute(buildingRoute.from) as PageKey);
      } else {
        const city = getCityFromHash();
        if (city) {
          setCurrentCity(city);
          setCurrentBuildingCode(null);
          setCurrentBuildingFrom("/map");
          setActivePage("map");
        } else {
          pendingSectionScrollRef.current = getPageFromHash();
        }
      }
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (currentCity || currentBuildingCode) return;

    const target = pendingSectionScrollRef.current;
    if (!target) return;

    let timeoutId: number | null = null;
    let frameOne = 0;
    let frameTwo = 0;

    frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(() => {
        if (!document.getElementById(target)) return;
        beginManualScroll();
        scrollToSection(target);
        pendingSectionScrollRef.current = null;
      });
    });

    timeoutId = window.setTimeout(() => {
      if (!document.getElementById(target)) return;
      beginManualScroll();
      scrollToSection(target);
      pendingSectionScrollRef.current = null;
    }, 80);

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [currentCity, currentBuildingCode, activePage, copy]);

  useEffect(() => {
    if (currentCity || currentBuildingCode) return;

    let rafId = 0;

    const syncActivePage = () => {
      if (isManualScrollingRef.current) return;

      const next = findActivePageByViewport();
      setActivePage((current) => {
        if (current === next) return current;
        if (window.location.hash !== `#/${next}`) {
          window.history.replaceState(null, "", `#/${next}`);
        }
        return next;
      });
    };

    const requestSync = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        syncActivePage();
      });
    };

    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
    requestSync();

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, [currentCity, currentBuildingCode, copy]);

  const navigateTo = (page: PageKey) => {
    enterSectionPage(page, { deferScroll: Boolean(currentCity) });
  };

  const navigateToCity = (city: string) => {
    const nextHash = `#/city/${encodeURIComponent(city)}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    setCurrentCity(city);
    setCurrentBuildingCode(null);
    setCurrentBuildingFrom("/map");
    setActivePage("map");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const content = useMemo(() => {
    if (!copy) return null;

    return (
      <>
        <HeroSection hero={copy.hero} onNavigate={navigateTo} />
        <OriginSection origin={copy.origin} />
        <Suspense fallback={<div className="section-placeholder">朝代数据加载中...</div>}>
          <LazyDynastySection dynasty={copy.dynasty} />
        </Suspense>
        <Suspense fallback={<div className="section-placeholder">地图数据加载中...</div>}>
          <LazyMapSection map={copy.map} onCityNavigate={navigateToCity} />
        </Suspense>
        <Suspense fallback={<div className="section-placeholder">剧场数据加载中...</div>}>
          <LazyTheaterSection theater={copy.theater} />
        </Suspense>
        <Suspense fallback={<div className="section-placeholder">轨迹数据加载中...</div>}>
          <LazyTrajectorySection trajectory={copy.trajectory} />
        </Suspense>
        <MethodologySection methodology={copy.methodology} />
        <OutroSection outro={copy.outro} />
      </>
    );
  }, [copy]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <div className="loading-scroll"></div>
        </div>
        <p className="loading-text">长卷正在徐徐展开...</p>
      </div>
    );
  }

  if (error || !copy) {
    return (
      <div className="app-error">
        <div className="error-icon">载入失败</div>
        <h2>内容加载失败</h2>
        <p>{error || "未知错误"}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
          重新加载
        </button>
      </div>
    );
  }

  if (currentCity) {
    return (
      <BuildingComparisonProvider>
        <div className="app-shell">
          <StoryNav nav={copy.nav} activePage={activePage} onNavigate={(page) => navigateTo(page as PageKey)} />
          <CityDetailPage cityName={currentCity} onBack={() => navigateTo("map")} onCityChange={navigateToCity} />
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((value: boolean) => !value)}
            aria-label={darkMode ? "切换到浅色模式" : "切换到深色模式"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </BuildingComparisonProvider>
    );
  }

  if (currentBuildingCode) {
    return (
      <BuildingComparisonProvider>
        <div className="app-shell">
          <StoryNav nav={copy.nav} activePage={activePage} onNavigate={(page) => navigateTo(page as PageKey)} />
          <BuildingSourcePage
            buildingCode={currentBuildingCode}
            fromRoute={currentBuildingFrom}
            onBack={() => {
              const targetHash = `#${currentBuildingFrom.startsWith("/") ? currentBuildingFrom : `/${currentBuildingFrom}`}`;
              window.location.hash = targetHash;
            }}
          />
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((value: boolean) => !value)}
            aria-label={darkMode ? "切换到浅色模式" : "切换到深色模式"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </BuildingComparisonProvider>
    );
  }

  return (
    <BuildingComparisonProvider>
      <div className="app-shell">
        <StoryNav nav={copy.nav} activePage={activePage} onNavigate={(page) => navigateTo(page as PageKey)} />
        <main ref={mainRef} className="content-wrapper">
          {content}
        </main>
        {showScrollTop ? (
          <button className="scroll-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="返回顶部">
            ↑
          </button>
        ) : null}
        <button
          className="theme-toggle"
          onClick={() => setDarkMode((value: boolean) => !value)}
          aria-label={darkMode ? "切换到浅色模式" : "切换到深色模式"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </BuildingComparisonProvider>
  );
}
