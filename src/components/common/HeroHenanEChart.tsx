import { useMemo } from "react";
import useHenanOutlineMap from "../../utils/useHenanOutlineMap";
import { CITY_COORDS, HERO_ROUTE } from "../../utils/henanGeo";
import EChart from "./EChart";

type Props = {
  height?: number | string;
};

const HERO_LABEL_LAYOUT: Record<string, { position: string; distance?: number; offset?: [number, number] }> = {
  安阳: { position: "top", distance: 10, offset: [0, -2] },
  郑州: { position: "top", distance: 12, offset: [0, -2] },
  开封: { position: "top", distance: 10, offset: [0, -1] },
  商丘: { position: "right", distance: 10, offset: [8, -2] },
  洛阳: { position: "left", distance: 10, offset: [-8, -2] },
  南阳: { position: "top", distance: 8, offset: [0, 2] },
};

const heroSeries = HERO_ROUTE.map((item, index) => ({
  name: item.name,
  value: [...item.coord, index === 1 ? 10 : 7],
  label: {
    position: HERO_LABEL_LAYOUT[item.name]?.position ?? "top",
    distance: HERO_LABEL_LAYOUT[item.name]?.distance ?? 8,
    offset: HERO_LABEL_LAYOUT[item.name]?.offset ?? [0, 0],
  },
}));

const heroLines = [
  ["安阳", "郑州"],
  ["郑州", "开封"],
  ["开封", "商丘"],
  ["洛阳", "郑州"],
  ["南阳", "洛阳"],
].map(([from, to]) => ({
  coords: [CITY_COORDS[from], CITY_COORDS[to]],
}));

export default function HeroHenanEChart({ height = "100%" }: Props) {
  const { ready } = useHenanOutlineMap();

  const option = useMemo(
    () => ({
      animation: false,
      backgroundColor: "transparent",
      tooltip: { show: false },
      geo: {
        map: "henan-outline",
        roam: false,
        layoutCenter: ["50%", "52%"],
        layoutSize: "84%",
        itemStyle: {
          areaColor: "#f7eddf",
          borderColor: "#d0af94",
          borderWidth: 1.8,
        },
        emphasis: { disabled: true },
        silent: true,
      },
      series: [
        {
          type: "lines",
          coordinateSystem: "geo",
          z: 2,
          data: heroLines,
          lineStyle: {
            color: "#c48752",
            width: 4,
            opacity: 0.78,
            cap: "round",
            join: "round",
            curveness: 0.08,
          },
          effect: { show: false },
          silent: true,
        },
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          z: 3,
          data: heroSeries,
          showEffectOn: "render",
          rippleEffect: {
            scale: 2.8,
            brushType: "stroke",
          },
          symbol: "circle",
          symbolSize: (val: number[]) => val[2],
          itemStyle: {
            color: "#8f4721",
            shadowBlur: 10,
            shadowColor: "rgba(143,71,33,0.18)",
          },
          label: {
            show: true,
            formatter: "{b}",
            color: "#6e5c49",
            fontSize: 15,
            fontWeight: 700,
          },
          silent: true,
        },
      ],
    }),
    []
  );

  if (!ready) return <div style={{ height, width: "100%" }} />;

  return <EChart option={option} style={{ width: "100%", height }} opts={{ renderer: "canvas" }} lazyUpdate />;
}
