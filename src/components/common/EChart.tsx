import ReactECharts from "echarts-for-react";
import type { ComponentProps } from "react";

type EChartProps = ComponentProps<typeof ReactECharts>;

export default function EChart(props: EChartProps) {
  return <ReactECharts lazyUpdate {...props} />;
}
