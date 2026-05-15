import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/StatusBadge";
import { MapPin, Navigation } from "lucide-react";
import type { Priority } from "@/lib/utils";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: "order" | "technician" | "hub";
  label: string;
  priority?: Priority;
  status?: string;
}

interface MapWidgetProps {
  markers?: MapMarker[];
  className?: string;
  height?: string;
  showLegend?: boolean;
}

export function MapWidget({ markers = [], className, height = "h-64", showLegend = true }: MapWidgetProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Live Map View</CardTitle>
        {showLegend && (
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emergency-red" />STAT
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-medical-blue" />Tech
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-midnight-navy" />Hub
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* Map placeholder — wire up Mapbox GL JS in production */}
        <div
          className={cn(
            "relative w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden",
            height
          )}
        >
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, #0F172A 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative z-10 text-center space-y-2">
            <Navigation className="h-8 w-8 text-midnight-navy/40 mx-auto" />
            <p className="text-sm text-on-surface-variant font-medium">Mapbox GL JS</p>
            <p className="text-xs text-outline">50m geofencing · route optimization</p>
          </div>

          {/* Simulated markers */}
          {markers.map((m, i) => (
            <div
              key={m.id}
              className="absolute flex flex-col items-center gap-0.5"
              style={{
                left: `${20 + (i * 18) % 60}%`,
                top: `${25 + (i * 23) % 50}%`,
              }}
            >
              <MapPin
                className={cn(
                  "h-5 w-5 drop-shadow",
                  m.type === "order" && m.priority === "stat" ? "text-emergency-red"
                  : m.type === "technician" ? "text-medical-blue"
                  : "text-midnight-navy"
                )}
              />
              <span className="text-[9px] font-bold bg-white rounded px-1 shadow text-midnight-navy whitespace-nowrap">
                {m.label}
              </span>
              {m.priority && <PriorityBadge priority={m.priority} size="sm" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
