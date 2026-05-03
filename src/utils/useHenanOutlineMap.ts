import { useEffect, useState } from "react";
import { getMap, registerMap } from "../lib/echarts";
import { publicPath } from "./publicPath";

type EChartsMapGeoJson = Parameters<typeof registerMap>[1];

export default function useHenanOutlineMap() {
  const [ready, setReady] = useState(() => {
    const echartsApi = { getMap } as unknown as {
      getMap?: (name: string) => { geoJson: EChartsMapGeoJson } | undefined;
    };
    return !!echartsApi.getMap?.("henan-outline");
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready) return;
    let mounted = true;
    setError(null);
    fetch(publicPath("maps/henan-outline.json"))
      .then((res) => {
        if (!res.ok) {
          throw new Error("henan-outline.json 加载失败");
        }
        return res.json();
      })
      .then((geoJson) => {
        if (!mounted) return;
        registerMap("henan-outline", geoJson as EChartsMapGeoJson);
        setReady(true);
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setError(err.message);
        setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [ready]);

  return { ready, error };
}
