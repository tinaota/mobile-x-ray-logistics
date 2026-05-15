"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { LiveMapMarker } from "./LiveMap";

// ── Tile & attribution ────────────────────────────────────────────────────────
const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// ── Color tokens (match tailwind.config) ─────────────────────────────────────
const COLOR = {
  hub:        "#0F172A",
  technician: "#3B82F6",
  stat:       "#EF4444",
  urgent:     "#F59E0B",
  routine:    "#3B82F6",
};

function markerColor(m: LiveMapMarker) {
  if (m.type === "hub")        return COLOR.hub;
  if (m.type === "technician") return COLOR.technician;
  if (m.priority === "stat")   return COLOR.stat;
  if (m.priority === "urgent") return COLOR.urgent;
  return COLOR.routine;
}

function createIcon(m: LiveMapMarker, selected: boolean): L.DivIcon {
  const color    = markerColor(m);
  const dotSize  = selected ? 20 : m.type === "hub" ? 18 : 15;
  const isPulse  = m.type === "order" && m.priority === "stat";
  const isHub    = m.type === "hub";

  const glowMap: Record<string, string> = {
    [COLOR.stat]:       "rgba(239,68,68,0.55)",
    [COLOR.urgent]:     "rgba(245,158,11,0.45)",
    [COLOR.technician]: "rgba(59,130,246,0.45)",
    [COLOR.hub]:        "rgba(0,0,0,0.5)",
  };
  const glow = glowMap[color] ?? "rgba(0,0,0,0.3)";

  const selectedRing = selected
    ? `outline:3px solid white;outline-offset:3px;box-shadow:0 0 0 6px rgba(255,255,255,0.2),0 3px 10px ${glow};`
    : `box-shadow:0 2px 8px ${glow};`;

  const pulse   = isPulse  ? "animation:map-pulse 2s infinite;" : "";
  const radius  = isHub    ? "3px" : "50%";
  const rotate  = isHub    ? "transform:rotate(45deg);" : "";

  const html = `
    <div style="
      width:${dotSize}px;height:${dotSize}px;
      background:${color};
      border:3px solid rgba(255,255,255,${selected ? 1 : 0.95});
      border-radius:${radius};
      ${selectedRing}${pulse}${rotate}
      cursor:pointer;
      transition:all .15s ease;
    "></div>`;

  const half = dotSize / 2 + 3;
  return L.divIcon({
    html,
    className: "",
    iconSize:   [dotSize + 6, dotSize + 6],
    iconAnchor: [half, half],
  });
}

// ── FlyController — useMap() must live inside MapContainer ────────────────────
function FlyController({ markers, selectedMarkerId }: {
  markers: LiveMapMarker[];
  selectedMarkerId?: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedMarkerId) return;
    const found = markers.find(m => m.id === selectedMarkerId);
    if (found) map.flyTo([found.lat, found.lng], 14, { animate: true, duration: 0.8 });
  }, [selectedMarkerId, markers, map]);
  return null;
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface LiveMapLeafletProps {
  markers:          LiveMapMarker[];
  center:           [number, number]; // [lng, lat] — swapped to Leaflet's [lat, lng] internally
  zoom:             number;
  selectedMarkerId?: string;
  onMarkerClick?:   (m: LiveMapMarker) => void;
}

// ── Main component ────────────────────────────────────────────────────────────
export function LiveMapLeaflet({
  markers, center, zoom, selectedMarkerId, onMarkerClick,
}: LiveMapLeafletProps) {
  return (
    <MapContainer
      center={[center[1], center[0]]}   // Leaflet uses [lat, lng]
      zoom={zoom}
      style={{ width: "100%", height: "100%" }}
      attributionControl
      zoomControl
    >
      <TileLayer url={LIGHT_TILES} attribution={ATTRIBUTION} maxZoom={19} />

      <FlyController markers={markers} selectedMarkerId={selectedMarkerId} />

      {markers.map(m => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={createIcon(m, m.id === selectedMarkerId)}
          zIndexOffset={m.id === selectedMarkerId ? 1000 : m.type === "hub" ? 500 : 0}
          eventHandlers={{ click: () => onMarkerClick?.(m) }}
        >
          <Tooltip
            permanent
            direction="top"
            offset={[0, -10]}
            className="map-label"
          >
            {m.label}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
