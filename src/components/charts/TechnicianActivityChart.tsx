"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface TechnicianActivityChartProps {
  technicians?: string[];
  completed?: number[];
  active?: number[];
  height?: number;
  className?: string;
}

export function TechnicianActivityChart({
  technicians = ["T. Parker", "A. Lopez", "M. Kim", "J. Reyes", "S. Patel"],
  completed   = [7, 6, 5, 8, 4],
  active      = [2, 1, 2, 0, 1],
  height = 220,
  className,
}: TechnicianActivityChartProps) {
  const option = {
    backgroundColor: "transparent",
    grid: { top: 16, right: 80, bottom: 8, left: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#0F172A",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      textStyle: { color: "#fff", fontSize: 12, fontFamily: "Inter" },
    },
    legend: {
      top: 0, right: 8,
      textStyle: { color: "#45464d", fontSize: 11, fontFamily: "Space Grotesk" },
      data: ["Completed", "Active"],
    },
    xAxis: {
      type: "value",
      axisLabel: { color: "#45464d", fontSize: 10 },
      splitLine: { lineStyle: { color: "#c6c6cd", type: "dashed", width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "category",
      data: technicians,
      axisLabel: { color: "#1b1b1d", fontSize: 12, fontFamily: "Inter", fontWeight: 500 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      { name: "Completed", type: "bar", stack: "activity", data: completed, barMaxWidth: 20, itemStyle: { color: "#10B981" } },
      { name: "Active",    type: "bar", stack: "activity", data: active,    barMaxWidth: 20, itemStyle: { color: "#3B82F6", borderRadius: [0, 3, 3, 0] } },
    ],
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Technician Activity</CardTitle>
        <span className="text-xs text-on-surface-variant">Completed + active orders today</span>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
      </CardContent>
    </Card>
  );
}
