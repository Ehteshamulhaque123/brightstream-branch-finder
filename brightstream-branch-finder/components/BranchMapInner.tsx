"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NormalizedBranch } from "../lib/normalize";
import { directionsUrl } from "../lib/directions";

// Fix default marker icons
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: (iconRetinaUrl as any).src ?? iconRetinaUrl,
	iconUrl: (iconUrl as any).src ?? iconUrl,
	shadowUrl: (shadowUrl as any).src ?? shadowUrl,
});

export default function BranchMapInner({
	branches,
	selected,
	onSelect,
	userLocation,
}: {
	branches: NormalizedBranch[];
	selected: NormalizedBranch | null;
	onSelect: (b: NormalizedBranch) => void;
	userLocation: { lat: number; lon: number } | null;
}) {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	const points = useMemo(
		() => branches.filter((b) => b.location && Number.isFinite(b.location.lat) && Number.isFinite(b.location.lon)),
		[branches]
	);

	const initialCenter = useRef<[number, number]>(
		userLocation
			? [userLocation.lat, userLocation.lon]
			: points[0]?.location
			? [points[0].location!.lat, points[0].location!.lon]
			: [20, 0]
	);

	useEffect(() => {
		if (userLocation) {
			initialCenter.current = [userLocation.lat, userLocation.lon];
		}
	}, [userLocation]);

	if (!isClient) {
		return (
			<div style={{ padding: 0, overflow: "hidden", minHeight: 420 }}>
				<div style={{ padding: 14, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
					<div style={{ fontWeight: 900 }}>Map</div>
					<div className="bs-muted">Loading map...</div>
				</div>
				<div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<div className="bs-muted">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div style={{ padding: 0, overflow: "hidden", minHeight: 420 }}>
			<div style={{ padding: 14, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
				<div style={{ fontWeight: 900 }}>Map</div>
				<div className="bs-muted">
					{points.length ? "Tap a pin to view branch details." : "No coordinates available for these branches."}
				</div>
			</div>

			<div style={{ height: 420 }}>
				<MapContainer center={initialCenter.current} zoom={userLocation ? 11 : 2} style={{ height: "100%", width: "100%" }}>
					<TileLayer
						attribution='&copy; OpenStreetMap contributors'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>
					{points.map((b) => {
						const dir = directionsUrl({
							name: b.name,
							addressText: b.addressText,
							location: b.location ?? null,
						});
						return (
							<Marker
								key={`${b.name}-${b.location!.lat}-${b.location!.lon}`}
								position={[b.location!.lat, b.location!.lon]}
								eventHandlers={{
									click: () => window.open(dir, '_blank'),
								}}
							>
								<Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
								<div style={{ fontWeight: 700, fontSize: 13 }}>{b.name}</div>
								<div style={{ fontSize: 12, marginTop: 4 }}>{b.addressText}</div>
								</Tooltip>
							</Marker>
						);
					})}
				</MapContainer>
			</div>
		</div>
	);
}
