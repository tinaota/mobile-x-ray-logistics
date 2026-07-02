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
  if (m.color)                 return m.color;
  if (m.type === "hub")        return COLOR.hub;
  if (m.type === "technician") return COLOR.technician;
  if (m.modality === "laboratory") return "#E11D48";
  if (m.modality === "radiology")  return "#4F46E5";
  if (m.priority === "stat")   return COLOR.stat;
  if (m.priority === "urgent") return COLOR.urgent;
  return COLOR.routine;
}

function createIcon(m: LiveMapMarker, selected: boolean): L.DivIcon {
  const color    = markerColor(m);
  const dotSize  = selected ? 24 : m.type === "hub" ? 18 : 20;
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
    ? `outline:2px solid white;outline-offset:2px;box-shadow:0 0 0 4px rgba(255,255,255,0.2),0 3px 10px ${glow};`
    : `box-shadow:0 2px 8px ${glow};`;

  const pulse   = isPulse  ? "animation:map-pulse 2s infinite;" : "";
  const radius  = isHub    ? "3px" : "50%";
  const rotate  = isHub    ? "transform:rotate(45deg);" : "";

  // Dynamic Inner SVG swap based on modality
  const innerIcon = m.modality === "laboratory" 
    ? `<svg viewBox="0 0 24 24" width="10" height="10" fill="white" style="display:block;margin:auto;"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>`
    : m.modality === "radiology"
      ? `<svg viewBox="0 0 24 24" width="10" height="10" fill="white" style="display:block;margin:auto;"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
      : "";

  const html = `
    <div style="
      width:${dotSize}px;height:${dotSize}px;
      background:${color};
      border:2px solid rgba(255,255,255,${selected ? 1 : 0.95});
      border-radius:${radius};
      ${selectedRing}${pulse}${rotate}
      cursor:pointer;
      transition:all .15s ease;
      display:flex;
      align-items:center;
      justify-content:center;
    ">${innerIcon}</div>`;

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
