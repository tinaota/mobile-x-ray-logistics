"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface CPTData { name: string; value: number; code: string; }

interface CPTDonutChartProps {
  data?: CPTData[];
  height?: number;
  className?: string;
}

const defaultData: CPTData[] = [
  { code: "71046", name: "Chest 2-view",  value: 142 },
  { code: "71045", name: "Chest 1-view",  value: 89 },
  { code: "73520", name: "Hip AP/Lat",    value: 56 },
  { code: "73564", name: "Knee 3-view",   value: 41 },
  { code: "72100", name: "Lumbar Spine",  value: 33 },
  { code: "Other", name: "Other CPTs",    value: 28 },
];

const COLORS = ["#3B82F6", "#0F172A", "#F59E0B", "#EF4444", "#10B981", "#C6C6CD"];

export function CPTDonutChart({ data = defaultData, height = 260, className }: CPTDonutChartProps) {
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#0F172A",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      textStyle: { color: "#fff", fontSize: 12, fontFamily: "Inter" },
      formatter: (p: { name: string; value: number; percent: number; data: CPTData }) =>
        `<b>${p.data.code}</b> — ${p.name}<br/><b>${p.value}</b> procedures (${p.percent.toFixed(1)}%)`,
    },
    legend: {
      orient: "vertical", right: 8, top: "center",
      textStyle: { color: "#1b1b1d", fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 600 },
      formatter: (name: string) => {
        const d = data.find((x) => x.name === name);
        return `{code|${d?.code ?? ""}}  ${name}`;
      },
      rich: {
        code: { fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 600, color: "#3B82F6", padding: [0, 4, 0, 0] },
      },
    },
    series: [{
      type: "pie",
      radius: ["50%", "75%"],
      center: ["35%", "50%"],
      avoidLabelOverlap: true,
      label: {
        show: true, position: "center",
        formatter: () => {
          const total = data.reduce((s, d) => s + d.value, 0);
          return `{total|${total}}\n{label|Procedures}`;
        },
        rich: {
          total: { fontSize: 28, fontWeight: 700, fontFamily: "Inter", color: "#1b1b1d", lineHeight: 36 },
          label: { fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 600, color: "#45464d", lineHeight: 20 },
        },
      },
      labelLine: { show: false },
      data: data.map((d, i) => ({
        ...d,
        itemStyle: { color: COLORS[i % COLORS.length], borderRadius: 4 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.2)" } },
      })),
    }],
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>CPT Code Breakdown</CardTitle>
        <span className="text-xs text-on-surface-variant">By procedure volume</span>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
      </CardContent>
    </Card>
  );
}
