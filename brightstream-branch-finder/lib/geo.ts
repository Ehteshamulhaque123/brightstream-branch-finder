export type LatLon = { lat: number; lon: number };

export function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lon - a.lon);

  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 =
    Math.cos(deg2rad(a.lat)) *
    Math.cos(deg2rad(b.lat)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)));
  return R * c;
}

function deg2rad(n: number) {
  return (n * Math.PI) / 180;
}

export function safeNumber(x: any): number | null {
  const n = typeof x === "string" ? Number(x) : x;
  return Number.isFinite(n) ? n : null;
}
