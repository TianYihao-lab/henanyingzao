import { useEffect, useState } from "react";
import { getMap, registerMap } from "../lib/echarts";
import { publicPath } from "./publicPath";

type EChartsMapGeoJson = Parameters<typeof registerMap>[1];

export default function useCityMap(cityName: string) {
  const mapName = `city-${cityName}`;
  const [ready, setReady] = useState(() => {
    const echartsApi = { getMap } as unknown as {
      getMap?: (name: string) => { geoJson: EChartsMapGeoJson } | undefined;
    };
    return !!echartsApi.getMap?.(mapName);
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const echartsApi = { getMap } as unknown as {
      getMap?: (name: string) => { geoJson: EChartsMapGeoJson } | undefined;
    };
    if (echartsApi.getMap?.(mapName)) {
      setReady(true);
      return;
    }
    setReady(false);
    setError(null);

    let mounted = true;
    fetch(publicPath(`maps/cities/${cityName}.json`))
      .then((res) => {
        if (!res.ok) throw new Error(`${cityName} 地图数据加载失败`);
        return res.json();
      })
      .then((geoJson) => {
        if (!mounted) return;
        registerMap(mapName, geoJson as EChartsMapGeoJson);
        setReady(true);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, [cityName, mapName]);

  return { ready, error, mapName };
}
