import { safeNumber } from "./geo";

export type NormalizedBranch = {
  [key: string]: any;
  name: string;
  phone?: string;
  email?: string;
  addressText?: string;
  street?: string;
  city?: string;
  region?: string;
  postal?: string;
  zipCode?: string;
  country?: string;
  countryCode?: string;
  coordinates?: string;
  services?: string[];
  openingHours?: string;
  branchType?: string;
  isActive?: boolean;
  location?: { lat: number; lon: number } | null;
  distanceKm?: number | null;
};

export function normalizeBranch(item: any, plan: any): NormalizedBranch {
  // Copy all fields from item
  const branch: NormalizedBranch = { ...item };

  // Extract fields using plan mapping
  const address1 = plan.address1Field ? item?.[plan.address1Field] : undefined;
  const address2 = plan.address2Field ? item?.[plan.address2Field] : undefined;
  const city = plan.cityField ? item?.[plan.cityField] : undefined;
  const region = plan.regionField ? item?.[plan.regionField] : undefined;
  const postal = plan.postalField ? item?.[plan.postalField] : undefined;
  const country = plan.countryField ? item?.[plan.countryField] : undefined;
  const countryCode = plan.countryCodeField ? item?.[plan.countryCodeField] : undefined;
  const coordinates = plan.coordinatesField ? item?.[plan.coordinatesField] : undefined;
  const email = plan.emailField ? item?.[plan.emailField] : undefined;

  // Map all API fields for UI
  branch.street = address1;
  branch.countryCode = countryCode;
  branch.zipCode = postal;
  branch.coordinates = coordinates;
  branch.email = email;

  // Compute addressText from available fields
  const parts = [address1, address2, city, region, postal, country].filter(Boolean);
  branch.addressText = parts.length ? parts.join(", ") : undefined;

  // Compute location if geo fields exist or parse Coordinates string
  let location: { lat: number; lon: number } | null = null;
  if (plan.geoField && plan.geoLat && plan.geoLon && item?.[plan.geoField]) {
    const raw = item[plan.geoField];
    const lat = safeNumber(raw?.[plan.geoLat]);
    const lon = safeNumber(raw?.[plan.geoLon]);
    if (lat != null && lon != null) location = { lat, lon };
  } else if (coordinates) {
    // Parse string like "29.454304, -98.465448"
    const parts = coordinates.split(',').map((s: string) => s.trim());
    if (parts.length === 2) {
      const lat = safeNumber(parts[0]);
      const lon = safeNumber(parts[1]);
      if (lat != null && lon != null) location = { lat, lon };
    }
  }
  branch.location = location;

  // Compute services if present
  let services: string[] | undefined = undefined;
  if (plan.servicesField && item?.[plan.servicesField]) {
    const v = item[plan.servicesField];
    if (Array.isArray(v)) services = v.map(String);
    else if (typeof v === "string") services = v.split(",").map((s) => s.trim()).filter(Boolean);
  }
  branch.services = services;

  // Compute name (fallback)
  branch.name = (plan.nameField ? item?.[plan.nameField] : null) ?? "Brightstream Branch";
  branch.phone = plan.phoneField ? item?.[plan.phoneField] : undefined;
  branch.email = email;
  branch.city = city ? String(city) : undefined;
  branch.region = region ? String(region) : undefined;
  branch.postal = postal ? String(postal) : undefined;
  branch.country = country ? String(country) : undefined;
  branch.countryCode = countryCode ? String(countryCode) : undefined;
  branch.coordinates = coordinates ? String(coordinates) : undefined;

  // Extra fields
  branch.openingHours = plan.openingHoursField ? item?.[plan.openingHoursField] : undefined;
  branch.branchType = plan.branchTypeField ? item?.[plan.branchTypeField] : undefined;
  branch.isActive = plan.isActiveField ? item?.[plan.isActiveField] : undefined;

  branch.distanceKm = null;

  return branch;
}
