"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface CollectionGaugeProps {
  rate?: number;
  target?: number;
  height?: number;
  className?: string;
}

export function CollectionGauge({ rate = 94.2, target = 95, height = 220, className }: CollectionGaugeProps) {
  const color = rate >= target ? "#10B981" : rate >= target - 5 ? "#F59E0B" : "#EF4444";

  const option = {
    backgroundColor: "transparent",
    series: [
      {
        type: "gauge",
        startAngle: 200, endAngle: -20,
        radius: "85%", center: ["50%", "60%"],
        min: 0, max: 100, splitNumber: 5,
        pointer: { length: "55%", width: 4, itemStyle: { color: "#0F172A" } },
        axisLine: {
          lineStyle: {
            width: 14,
            color: [[rate / 100, color], [1, "#e4e2e4"]],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          distance: -28, color: "#45464d", fontSize: 10, fontFamily: "JetBrains Mono",
          formatter: (v: number) => `${v}%`,
        },
        detail: {
          valueAnimation: true,
          formatter: (v: number) => `{rate|${v.toFixed(1)}%}\n{label|Collection Rate}`,
          rich: {
            rate:  { fontSize: 28, fontWeight: 700, fontFamily: "Inter",       color: "#1b1b1d", lineHeight: 36 },
            label: { fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 600, color: "#45464d", lineHeight: 20 },
          },
          offsetCenter: [0, "20%"],
        },
        data: [{ value: rate, itemStyle: { color } }],
      },
      {
        type: "gauge",
        startAngle: 200, endAngle: -20,
        radius: "85%", center: ["50%", "60%"],
        min: 0, max: 100,
        pointer: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: true, distance: -18, length: 18, lineStyle: { color: "#3B82F6", width: 2 } },
        axisLabel: { show: false },
        data: [{ value: target }],
        detail: {
          formatter: () => `{t|Target: ${target}%}`,
          rich: { t: { fontSize: 10, color: "#3B82F6", fontFamily: "Space Grotesk", fontWeight: 600 } },
          offsetCenter: [0, "45%"],
        },
      },
    ],
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Collection Rate</CardTitle>
        <span className="text-xs text-on-surface-variant">Billed vs collected</span>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
      </CardContent>
    </Card>
  );
}
