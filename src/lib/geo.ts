// Shared geodesy helpers — single source of truth for distance/ETA math and
// facility coordinates (previously duplicated in technician + client pages,
// with the client using a hardcoded destination point).

export const HUB_COORDS = { lat: 33.4484, lng: -112.074 };

export const FACILITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Sunrise Medical Center":    { lat: 33.4795, lng: -112.089 },
  "Desert Valley Hospital":    { lat: 33.475,  lng: -112.128 },
  "Camelback Rehab Center":    { lat: 33.509,  lng: -112.078 },
  "Phoenix Care Facility":     { lat: 33.428,  lng: -112.062 },
  "Valley View Nursing Home":  { lat: 33.488,  lng: -112.022 },
  "Scottsdale Surgery Center": { lat: 33.5012, lng: -111.9255 },
  "Central Lab - Level 2":     { lat: 33.465,  lng: -112.035 },
  "Stat Lab - ER Wing":        { lat: 33.452,  lng: -112.082 },
  "On-site Satellite Lab":     { lat: 33.482,  lng: -112.052 },
};

/** Default service destination when a facility has no known coordinates. */
export const DEFAULT_DEST = { lat: 33.462, lng: -112.089 };

export function facilityCoords(facilityName?: string | null): { lat: number; lng: number } {
  return (facilityName && FACILITY_COORDS[facilityName]) || DEFAULT_DEST;
}

/** Great-circle distance in miles. */
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Field travel ETA in minutes, assuming ~25 mph average urban speed. */
export function etaMinutes(distanceMiles: number): number {
  return Math.max(2, Math.round(distanceMiles * 2.4));
}
