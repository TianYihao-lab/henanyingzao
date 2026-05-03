import { useEffect } from "react";
import { getMap, registerMap } from "../lib/echarts";
import { publicPath } from "./publicPath";

type EChartsMapGeoJson = Parameters<typeof registerMap>[1];

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

async function fetchAndRegister(path: string, name: string) {
  const echartsApi = { getMap } as {
    getMap?: (name: string) => { geoJson: EChartsMapGeoJson } | undefined;
  };
  if (echartsApi.getMap?.(name)) return;
  try {
    const res = await fetch(path);
    if (!res.ok) return;
    const geoJson = await res.json();
    registerMap(name, geoJson as EChartsMapGeoJson);
  } catch {
    // ignore preload errors
  }
}

export default function usePreloadMaps() {
  useEffect(() => {
    const idleWindow = window as IdleWindow;
    const preloadCoreMaps = () => {
      fetchAndRegister(publicPath("maps/henan-outline.json"), "henan-outline");
      fetchAndRegister(publicPath("maps/henan-cities.json"), "henan-cities");
    };

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(preloadCoreMaps, { timeout: 1200 });
      return () => {
        idleWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(preloadCoreMaps, 300);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);
}
