import type { LatLon } from "./geo";

export function directionsUrl(params: {
  name?: string;
  addressText?: string;
  location?: LatLon | null;
}) {
  // Prioritize full address over coordinates for better display in Google Maps
  const addressQuery = (params.addressText || params.name || "").trim();
  if (addressQuery) {
    return `https://www.google.com/maps?q=${encodeURIComponent(addressQuery)}`;
  }

  // Fallback to coordinates if no address available
  if (params.location) {
    const { lat, lon } = params.location;
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lon}`)}`;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent("Brightstream Branch")}`;
}
