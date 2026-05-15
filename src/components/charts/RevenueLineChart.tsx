"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface RevenueLineChartProps {
  data?: number[];
  comparisonData?: number[];
  height?: number;
  className?: string;
}

export function RevenueLineChart({
  data = [8400, 12200, 9800, 15400, 14820, 11200, 13600],
  comparisonData = [7200, 9800, 8600, 11200, 12400, 9600, 11800],
  height = 220,
  className,
}: RevenueLineChartProps) {
  const option = {
    backgroundColor: "transparent",
    grid: { top: 16, right: 16, bottom: 24, left: 56, containLabel: false },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0F172A",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      textStyle: { color: "#fff", fontSize: 12, fontFamily: "Inter" },
      formatter: (params: { seriesName: string; value: number }[]) =>
        params.map((p) => `<span style="color:#3B82F6">●</span> ${p.seriesName}: <b>$${p.value.toLocaleString()}</b>`).join("<br/>"),
    },
    legend: {
      top: 0, right: 16,
      textStyle: { color: "#45464d", fontSize: 11, fontFamily: "Space Grotesk" },
      data: ["This Week", "Last Week"],
    },
    xAxis: {
      type: "category",
      data: DAYS,
      axisLine: { lineStyle: { color: "#c6c6cd" } },
      axisTick: { show: false },
      axisLabel: { color: "#45464d", fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 600 },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#45464d", fontSize: 10, fontFamily: "JetBrains Mono",
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
      },
      splitLine: { lineStyle: { color: "#c6c6cd", type: "dashed", width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: "This Week",
        type: "line",
        data,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#3B82F6", width: 2.5 },
        itemStyle: { color: "#3B82F6", borderColor: "#fff", borderWidth: 2 },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59,130,246,0.25)" },
              { offset: 1, color: "rgba(59,130,246,0)" },
            ],
          },
        },
      },
      {
        name: "Last Week",
        type: "line",
        data: comparisonData,
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#c6c6cd", width: 1.5, type: "dashed" },
      },
    ],
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <span className="text-xs text-on-surface-variant">This week vs last week</span>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
      </CardContent>
    </Card>
  );
}
