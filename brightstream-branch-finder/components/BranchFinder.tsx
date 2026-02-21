"use client";

import { useEffect, useMemo, useState } from "react";
import { graphQL } from "../lib/graph";
import { buildBranchQueryPlan } from "../lib/branchDiscovery";
import { normalizeBranch, NormalizedBranch } from "../lib/normalize";
import { haversineKm } from "../lib/geo";
import { directionsUrl } from "../lib/directions";
import BranchMap from "./BranchMap";
import BranchDetailModal from "./BranchDetailModal";

type BranchResponse = Record<string, { total?: number; items?: any[] }>;

function useDebounced(value: string, ms: number) {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
}


export default function BranchFinder() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [plan, setPlan] = useState<any>(null);
	const [branches, setBranches] = useState<NormalizedBranch[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10); // You can adjust page size here

	const [q, setQ] = useState("");
	const dq = useDebounced(q, 180);

	const [country, setCountry] = useState("All");
	const [view, setView] = useState<"all" | "map" | "nearme">("all");

	const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
	const [selected, setSelected] = useState<NormalizedBranch | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	// Reset page when search query changes
	useEffect(() => {
		setPage(1);
	}, [dq]);

	// 1) Discover schema + build safe query + fetch branches (paged)
	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setError(null);

				const p = plan ?? (await buildBranchQueryPlan());
				if (!plan) setPlan(p);

				// Fetch ALL branches when: using "Near me" OR when searching (to search across all branches)
				const shouldFetchAll = (userLocation || dq.trim()) && p.supportsPaging;
				
				if (shouldFetchAll) {
					// First, get total count
					const firstPage = await graphQL<BranchResponse>(p.query, { limit: 100, skip: 0 });
					const totalBranches = firstPage[p.rootField]?.total ?? 0;
					
					// Calculate how many pages we need to fetch
					const pagesNeeded = Math.ceil(totalBranches / 100);
					
					// Fetch all pages in parallel
					const allPromises = [];
					for (let i = 0; i < pagesNeeded; i++) {
						allPromises.push(
							graphQL<BranchResponse>(p.query, { limit: 100, skip: i * 100 })
						);
					}
					
					const allPages = await Promise.all(allPromises);
					
					// Combine all items from all pages
					const allItems = allPages.flatMap(pageData => pageData[p.rootField]?.items ?? []);
					setTotal(totalBranches);
					const normalized = allItems.map((item: any) => normalizeBranch(item, p));
					setBranches(normalized);
				} else {
					// Regular pagination for "All" and "Map" views (when not searching)
					let variables: Record<string, any> = {};
					if (p.supportsPaging) {
						variables.limit = pageSize;
						variables.skip = (page - 1) * pageSize;
					}

					const data = await graphQL<BranchResponse>(p.query, variables);
					const root = data[p.rootField];
					const items = root?.items ?? [];
					setTotal(root?.total ?? items.length);
					const normalized = items.map((item: any) => normalizeBranch(item, p));
					setBranches(normalized);
				}
			} catch (e: any) {
				setError(e?.message ?? "Failed to load branches");
			} finally {
				setLoading(false);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, pageSize, plan, userLocation, dq]);

	// 2) Countries for filter dropdown
	const countries = useMemo(() => {
		const set = new Set<string>();
		branches.forEach((b) => {
			if (b.country) set.add(b.country);
		});
		return ["All", ...Array.from(set).sort()];
	}, [branches]);

	// 3) Search + filter (client-side for current page)
	const filtered = useMemo(() => {
		const query = dq.trim().toLowerCase();
		const base = branches.filter((b) => (country === "All" ? true : b.country === country));
		if (!query) return base;
		return base.filter((b) => {
			const hay = `${b.name} ${b.addressText ?? ""} ${b.city ?? ""} ${b.country ?? ""}`.toLowerCase();
			return hay.includes(query);
		});
	}, [branches, dq, country]);

	// 4) Apply distance (if user location exists)
	const withDistance = useMemo(() => {
		if (!userLocation) return filtered;
		return filtered
			.map((b) => {
				if (b.location) {
					return { ...b, distanceKm: haversineKm(userLocation, b.location) };
				}
				return { ...b, distanceKm: null };
			})
			.sort((a, b) => {
				if (a.distanceKm == null && b.distanceKm == null) return a.name.localeCompare(b.name);
				if (a.distanceKm == null) return 1;
				if (b.distanceKm == null) return -1;
				return a.distanceKm - b.distanceKm;
			});
	}, [filtered, userLocation]);

	// 4b) Client-side pagination for display
	const displayedBranches = useMemo(() => {
		// When viewing "Near me" or searching, we've fetched all branches, so paginate client-side
		if (userLocation || dq.trim()) {
			const start = (page - 1) * pageSize;
			const end = start + pageSize;
			return withDistance.slice(start, end);
		}
		// Otherwise, show all branches from the current API page
		return withDistance;
	}, [withDistance, userLocation, dq, page, pageSize]);

	const displayTotal = (userLocation || dq.trim()) ? withDistance.length : total;


	// 5) Geolocation action
	const useMyLocation = () => {
		if (!navigator.geolocation) {
			alert("Geolocation is not supported in this browser.");
			return;
		}
		setQ("");
		setCountry("All");
		setView("nearme");
		setPage(1); // Reset to first page
		setLoading(true); // Show loading state while fetching location
		setBranches([]); // Clear old branches to ensure only API data is shown
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
				setView("nearme");
			},
			(err) => {
				setLoading(false);
				alert(err.message || "Could not access location.");
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	};

	const openDetail = (b: NormalizedBranch) => {
		setSelected(b);
		setDetailOpen(true);
	};

	return (
		<main>
			{/* HERO */}
			<section className="bs-hero">
				<h1>Find a Branch</h1>
				<p>
					Search by city, postcode, or branch name. Use your location to find the closest branch and get directions instantly.
				</p>
				<div className="bs-actions">
					<button 
						className={`bs-btn ${view === "nearme" ? "bs-btn--primary" : "bs-btn--outline"}`}
						onClick={useMyLocation}
					>
						Use my location
					</button>
					<button
						className={`bs-btn ${view === "all" ? "bs-btn--primary" : "bs-btn--outline"}`}
						onClick={() => {
							setUserLocation(null);
							setCountry("All");
							setQ("");
							setView("all");
							setPage(1);
						}}
					>
						View all branches
					</button>
				</div>
			</section>

			{/* SURFACE */}

							 <section className="bs-surface">
								 {/* top search + dropdown */}
								 <div className="bs-toolbar">
									 <input
										 className="bs-search"
										 value={q}
										 onChange={(e) => setQ(e.target.value)}
										 placeholder="Search branches by name, city, or address…"
										 aria-label="Search branches"
									 />


								 </div>

								 {/* articles-style pills row */}
								 <div className="bs-pill-row">
									 <button
										 className={`bs-pill ${view === "all" ? "bs-pill--active" : ""}`}
										 onClick={() => {
											 setUserLocation(null);
											 setCountry("All");
											 setQ("");
											 setView("all");
										 }}
										 aria-label="Show all branches"
									 >
										 All
									 </button>

									 <button
										 className={`bs-pill ${view === "map" ? "bs-pill--active" : ""}`}
										 onClick={() => setView("map")}
										 aria-label="Map view"
									 >
										 Map
									 </button>

									 <button
										 className={`bs-pill ${view === "nearme" ? "bs-pill--active" : ""}`}
										 onClick={() => {
											 useMyLocation();
										 }}
										 aria-label="Near me"
									 >
										 Near me
									 </button>
								 </div>

								 {/* rest stays same */}

				{loading && (
					<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 80 }}>
						<div className="bs-spinner" style={{ width: 40, height: 40, border: '4px solid #eee', borderTop: '4px solid #0077ff', borderRadius: '50%', animation: 'bs-spin 1s linear infinite' }}></div>
						<style>{`
							@keyframes bs-spin {
								0% { transform: rotate(0deg); }
								100% { transform: rotate(360deg); }
							}
						`}</style>
						{view === "nearme" && userLocation === null ? (
							<div className="bs-muted" style={{ marginTop: 12 }}>Getting your location…</div>
						) : view === "nearme" ? (
							<div className="bs-muted" style={{ marginTop: 12 }}>Loading branches near you…</div>
						) : null}
					</div>
				)}
				{error && <div className="bs-error">{error}</div>}

				{!loading && !error && (
					<>
														{(view === "all" || view === "nearme") && (
															<div style={{ padding: "10px 12px 14px" }}>
																<div className="bs-split" style={{ padding: "0 10px 12px" }}>
																	<div className="bs-muted">
																	{displayTotal} results
																	{userLocation ? " (sorted by nearest)" : ""}
																</div>
																{userLocation && (
																	<button className="bs-pill" onClick={() => { setUserLocation(null); setPage(1); }}>
																		Clear location
																	</button>
																)}
															</div>
															<div style={{ display: "grid", gap: 12 }}>
																{displayedBranches.map((b) => {
																		const dir = directionsUrl({
																			name: b.name,
																			addressText: b.addressText,
																			location: b.location ?? null,
																		});
																		return (
																			<button
																				key={`${b.name}-${b.addressText ?? ""}`}
																				className={`bs-card ${selected?.name === b.name && selected?.addressText === b.addressText ? "bs-card--selected" : ""}`}
																				style={{ textAlign: "left", cursor: "pointer" }}
																				onClick={() => openDetail(b)}
																			>
																				{/* Header row */}
																				<div className="bs-split">
																					<h3 className="bs-card__title">{b.name}</h3>
																					{b.distanceKm != null && Number.isFinite(b.distanceKm) && (
																						<span className="bs-distance-pill">{b.distanceKm.toFixed(1)} km</span>
																					)}
																				</div>
																				{/* Address */}
																				<p className="bs-card__address">
																					📍 {b.addressText ?? "Address not available"}
																				</p>
																				{/* Info chips: show all fields from API */}
																				<div className="bs-card__chips">
																					{b.phone && <a href={`tel:${b.phone}`} className="bs-chip bs-chip--link" onClick={(e) => e.stopPropagation()} style={{textDecoration: 'none'}}>📞 {b.phone}</a>}
																					{b.email && <a href={`mailto:${b.email}`} className="bs-chip bs-chip--link" onClick={(e) => e.stopPropagation()} style={{maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis'}}>✉️ {b.email}</a>}
																					{b.city && <span className="bs-chip">🏙️ {b.city}</span>}
																					{b.country && <span className="bs-chip bs-chip--accent">🌎 {b.country}</span>}
																					{b.countryCode && <span className="bs-chip">🌐 {b.countryCode}</span>}
																					{b.street && <span className="bs-chip">🏠 {b.street}</span>}
																					{b.zipCode && <span className="bs-chip">🏷️ {b.zipCode}</span>}
																					{/* legacy/extra fields */}
																					{b.region && <span className="bs-chip">{b.region}</span>}
																					{b.postal && <span className="bs-chip">🏷️ {b.postal}</span>}
																					{b.branchType && <span className="bs-chip">🏢 {b.branchType}</span>}
																					{b.isActive != null && <span className={`bs-chip ${b.isActive ? "bs-chip--active" : "bs-chip--inactive"}`}>{b.isActive ? "✅ Active" : "⛔ Inactive"}</span>}
																					{b.openingHours && <span className="bs-chip">🕐 {b.openingHours}</span>}
																					{b.services && <span className="bs-chip">🛠️ {b.services}</span>}
																				</div>
																				{/* Footer */}
																				<div className="bs-card__footer">
																					<a className="bs-directions-link" href={dir} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
																						Get Directions →
																					</a>
																				</div>
																			</button>
																		);
																	})}
																</div>
																{/* Pagination controls */}
																<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}>
																	<button className="bs-pill" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
																		Previous
																	</button>
																	<span className="bs-muted">Page {page} of {Math.max(1, Math.ceil(displayTotal / pageSize))}</span>
																	<button className="bs-pill" onClick={() => setPage((p) => (p < Math.ceil(displayTotal / pageSize) ? p + 1 : p))} disabled={page >= Math.ceil(displayTotal / pageSize)}>
																		Next
																	</button>
																</div>
															</div>
														)}

						{/* MAP VIEW */}
						{view === "map" && (
							<div style={{ padding: "10px 12px 14px" }}>
								<div className="bs-split" style={{ padding: "0 10px 12px" }}>
									<div className="bs-muted">
										{withDistance.length} branches on map
										{userLocation ? " (sorted by nearest)" : ""}
									</div>

									{userLocation && (
									<button className="bs-pill" onClick={() => { setUserLocation(null); setPage(1); }}>
											Clear location
										</button>
									)}
								</div>

								{/* Only show the map, no card info */}
								<div style={{ height: "600px", borderRadius: "20px", overflow: "hidden" }}>
									<BranchMap
										branches={withDistance}
										selected={selected}
										onSelect={(b) => openDetail(b)}
										userLocation={userLocation}
									/>
								</div>
							</div>
						)}
					</>
				)}
			</section>

			{/* Detail view */}
			<BranchDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} branch={selected} />

		</main>
	);
}
