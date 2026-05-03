import EChart from "./EChart";

function isDark() {
  return document.documentElement.classList.contains("dark-mode");
}

const textColor = () => (isDark() ? "#f8f4ed" : "#4a3b2a");
const mutedColor = () => (isDark() ? "#c8b8a8" : "#7a6552");
const axisLine = () => (isDark() ? "rgba(180,130,90,0.25)" : "rgba(123,91,62,0.2)");
const splitLine = () => (isDark() ? "rgba(180,130,90,0.12)" : "rgba(123,91,62,0.1)");

export function MiniPieChart({ data, title }: { data: { name: string; value: number }[]; title?: string }) {
  const option = {
    animation: false,
    backgroundColor: "transparent",
    title: title ? { text: title, left: "center", top: 0, textStyle: { color: textColor(), fontSize: 13 } } : undefined,
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    series: [
      {
        type: "pie",
        radius: ["40%", "65%"],
        center: ["50%", "55%"],
        itemStyle: { borderRadius: 6, borderColor: isDark() ? "#1a120b" : "#f5ecde", borderWidth: 2 },
        label: { show: true, color: mutedColor(), fontSize: 11 },
        labelLine: { lineStyle: { color: axisLine() } },
        data: data.map((item, idx) => ({
          ...item,
          itemStyle: {
            color: ["#c9894d", "#8f4721", "#5f8e7b", "#d4af37", "#a86a36", "#7aa590"][idx % 6],
          },
        })),
      },
    ],
  };
  return <EChart option={option} style={{ width: "100%", height: "200px" }} opts={{ renderer: "canvas" }} lazyUpdate />;
}

export function MiniBarChart({ data, title }: { data: { name: string; value: number }[]; title?: string }) {
  const hasLongLabels = data.some((item) => item.name.length >= 12);
  const option = {
    animation: false,
    backgroundColor: "transparent",
    title: title ? { text: title, left: "center", top: 0, textStyle: { color: textColor(), fontSize: 13 } } : undefined,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: {
      left: hasLongLabels ? 150 : "3%",
      right: "8%",
      bottom: "3%",
      top: title ? 28 : 8,
      containLabel: true,
    },
    xAxis: { type: "value", axisLine: { lineStyle: { color: axisLine() } }, splitLine: { lineStyle: { color: splitLine() } }, axisLabel: { color: mutedColor(), fontSize: 11 } },
    yAxis: {
      type: "category",
      data: data.map((d) => d.name),
      axisLine: { lineStyle: { color: axisLine() } },
      axisLabel: {
        color: mutedColor(),
        fontSize: hasLongLabels ? 10 : 11,
        width: hasLongLabels ? 132 : undefined,
        overflow: "break",
        lineHeight: hasLongLabels ? 14 : undefined,
      },
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => ({ value: d.value, itemStyle: { color: "#c9894d", borderRadius: [0, 4, 4, 0] } })),
        barWidth: 14,
        label: { show: true, position: "right", color: textColor(), fontSize: 11 },
      },
    ],
  };
  return <EChart option={option} style={{ width: "100%", height: hasLongLabels ? "240px" : "200px" }} opts={{ renderer: "canvas" }} lazyUpdate />;
}

export function MiniColumnChart({ data, title }: { data: { name: string; value: number }[]; title?: string }) {
  const option = {
    animation: false,
    backgroundColor: "transparent",
    title: title ? { text: title, left: "center", top: 0, textStyle: { color: textColor(), fontSize: 13 } } : undefined,
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "8%", top: title ? 28 : 8, containLabel: true },
    xAxis: { type: "category", data: data.map((d) => d.name), axisLine: { lineStyle: { color: axisLine() } }, axisLabel: { color: mutedColor(), fontSize: 11, interval: 0, rotate: data.length > 5 ? 30 : 0 } },
    yAxis: { type: "value", axisLine: { lineStyle: { color: axisLine() } }, splitLine: { lineStyle: { color: splitLine() } }, axisLabel: { color: mutedColor(), fontSize: 11 } },
    series: [
      {
        type: "bar",
        data: data.map((d, i) => ({ value: d.value, itemStyle: { color: ["#c9894d", "#8f4721", "#5f8e7b", "#d4af37", "#a86a36", "#7aa590"][i % 6], borderRadius: [4, 4, 0, 0] } })),
        barWidth: 16,
        label: { show: true, position: "top", color: textColor(), fontSize: 11 },
      },
    ],
  };
  return <EChart option={option} style={{ width: "100%", height: "200px" }} opts={{ renderer: "canvas" }} lazyUpdate />;
}

export function MiniLineChart({ data, title }: { data: { name: string; value: number }[]; title?: string }) {
  const option = {
    animation: false,
    backgroundColor: "transparent",
    title: title ? { text: title, left: "center", top: 0, textStyle: { color: textColor(), fontSize: 13 } } : undefined,
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "8%", top: title ? 28 : 8, containLabel: true },
    xAxis: { type: "category", data: data.map((d) => d.name), boundaryGap: false, axisLine: { lineStyle: { color: axisLine() } }, axisLabel: { color: mutedColor(), fontSize: 11, interval: 0 } },
    yAxis: { type: "value", axisLine: { lineStyle: { color: axisLine() } }, splitLine: { lineStyle: { color: splitLine() } }, axisLabel: { color: mutedColor(), fontSize: 11 } },
    series: [
      {
        type: "line",
        data: data.map((d) => d.value),
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { color: "#c9894d", width: 3 },
        itemStyle: { color: "#c9894d", borderColor: isDark() ? "#1a120b" : "#f5ecde", borderWidth: 2 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(201,137,77,0.35)" }, { offset: 1, color: "rgba(201,137,77,0.02)" }] } },
      },
    ],
  };
  return <EChart option={option} style={{ width: "100%", height: "220px" }} opts={{ renderer: "canvas" }} lazyUpdate />;
}
