"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import type { LiveMapLeafletProps } from "./LiveMapLeaflet";

// ── Types (re-exported so callers can import LiveMapMarker from here) ─────────
export interface LiveMapMarker {
  id: string;
  lng: number;
  lat: number;
  type: "order" | "technician" | "hub";
  label: string;
  priority?: Priority;
  status?: string;
  details?: string;
}

export interface LiveMapProps {
  markers?:          LiveMapMarker[];
  center?:           [number, number]; // [lng, lat]
  zoom?:             number;
  height?:           string;
  className?:        string;
  showLegend?:       boolean;
  onMarkerClick?:    (marker: LiveMapMarker) => void;
  selectedMarkerId?: string;           // flies map + highlights marker
}

// ── Lazy-load Leaflet — never SSR ─────────────────────────────────────────────
const LeafletMap = dynamic<LiveMapLeafletProps>(
  () => import("./LiveMapLeaflet").then(m => ({ default: m.LiveMapLeaflet })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#1e2a3d] animate-pulse flex items-center justify-center">
        <span className="text-xs font-label font-semibold uppercase tracking-wider text-white/30">
          Loading map…
        </span>
      </div>
    ),
  }
);

// ── Component ─────────────────────────────────────────────────────────────────
export function LiveMap({
  markers = [],
  center  = [-112.074, 33.4484],
  zoom    = 11,
  height  = "h-96",
  className,
  showLegend      = true,
  onMarkerClick,
  selectedMarkerId,
}: LiveMapProps) {
  const [popupMarker, setPopupMarker] = useState<LiveMapMarker | null>(null);

  const handleMarkerClick = (m: LiveMapMarker) => {
    setPopupMarker(m);
    onMarkerClick?.(m);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live Fleet Map
        </CardTitle>
        {showLegend && (
          <div className="flex items-center gap-3">
            <Badge variant="stat" size="sm">STAT</Badge>
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-medical-blue inline-block" /> Tech
            </span>
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="h-2.5 w-2.5 bg-midnight-navy border border-outline-variant inline-block rounded-sm rotate-45" /> Hub
            </span>
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-warning-amber inline-block" /> Urgent
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 relative">
        <div className={cn("w-full", height)}>
          <LeafletMap
            markers={markers}
            center={center}
            zoom={zoom}
            selectedMarkerId={selectedMarkerId}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        {/* Selected marker info overlay */}
        {popupMarker && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-64
            bg-midnight-navy text-white rounded-xl p-3 shadow-card-lg animate-fade-in z-[1000]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{popupMarker.label}</p>
                {popupMarker.details && (
                  <p className="text-xs text-white/60 mt-0.5">{popupMarker.details}</p>
                )}
                {popupMarker.status && (
                  <p className="text-xs text-white/50 mt-0.5 font-mono">{popupMarker.status}</p>
                )}
              </div>
              {popupMarker.priority && (
                <PriorityBadge priority={popupMarker.priority} size="sm" animate />
              )}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
              <span className="text-[10px] font-label font-semibold uppercase tracking-wider text-white/40">
                {popupMarker.type} · {popupMarker.status ?? "active"}
              </span>
              <button
                onClick={() => setPopupMarker(null)}
                className="text-white/40 hover:text-white text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
