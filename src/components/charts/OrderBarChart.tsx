"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const HOURS = ["6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm"];

interface OrderBarChartProps {
  stat?:    number[];
  urgent?:  number[];
  routine?: number[];
  height?: number;
  className?: string;
}

export function OrderBarChart({
  stat    = [1, 0, 2, 3, 1, 2, 1, 0],
  urgent  = [2, 3, 4, 5, 6, 4, 3, 2],
  routine = [5, 7, 9, 8, 7, 6, 5, 3],
  height = 220,
  className,
}: OrderBarChartProps) {
  const option = {
    backgroundColor: "transparent",
    grid: { top: 16, right: 16, bottom: 28, left: 36, containLabel: false },
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
      data: ["STAT", "Urgent", "Routine"],
    },
    xAxis: {
      type: "category",
      data: HOURS,
      axisLine: { lineStyle: { color: "#c6c6cd" } },
      axisTick: { show: false },
      axisLabel: { color: "#45464d", fontSize: 10, fontFamily: "Space Grotesk", fontWeight: 600 },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#45464d", fontSize: 10 },
      splitLine: { lineStyle: { color: "#c6c6cd", type: "dashed", width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      { name: "STAT",    type: "bar", stack: "orders", data: stat,    barMaxWidth: 28, itemStyle: { color: "#EF4444" } },
      { name: "Urgent",  type: "bar", stack: "orders", data: urgent,  barMaxWidth: 28, itemStyle: { color: "#F59E0B" } },
      { name: "Routine", type: "bar", stack: "orders", data: routine, barMaxWidth: 28, itemStyle: { color: "#3B82F6", borderRadius: [3, 3, 0, 0] } },
    ],
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Orders by Hour</CardTitle>
        <span className="text-xs text-on-surface-variant">Priority distribution today</span>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
      </CardContent>
    </Card>
  );
}
